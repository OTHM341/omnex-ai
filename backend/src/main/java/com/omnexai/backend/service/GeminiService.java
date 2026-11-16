package com.omnexai.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.omnexai.backend.entity.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

@Service
public class GeminiService {

    private static final Logger logger =
            LoggerFactory.getLogger(GeminiService.class);

    private static final int MAX_ATTEMPTS = 3;

    private static final long[] RETRY_DELAYS_MS = {
            2_000L,
            4_000L
    };

    private static final String HIGH_DEMAND_MESSAGE =
            "Gemini is currently experiencing high demand. "
                    + "Please try again in a few moments.";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.model}")
    private String model;

    public GeminiService(
            RestTemplate restTemplate,
            ObjectMapper objectMapper
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    // =========================================================
    // NORMAL RESPONSE
    // =========================================================

    public String generateResponse(
            List<Message> messages,
            String assistantType
    ) {
        validateConfiguration();

        try {
            Map<String, Object> requestBody =
                    buildRequestBody(messages, assistantType);

            String url =
                    "https://generativelanguage.googleapis.com/v1beta/models/"
                            + model
                            + ":generateContent";

            HttpHeaders headers = createHeaders();

            org.springframework.http.HttpEntity<Map<String, Object>> request =
                    new org.springframework.http.HttpEntity<>(
                            requestBody,
                            headers
                    );

            String response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    String.class
            ).getBody();

            if (response == null || response.isBlank()) {
                throw new IllegalStateException(
                        "Gemini returned an empty response."
                );
            }

            JsonNode root = objectMapper.readTree(response);

            JsonNode textNode = root
                    .path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (textNode.isMissingNode() || textNode.isNull()) {
                throw new IllegalStateException(
                        "Gemini did not return any response text."
                );
            }

            return textNode.asText();

        } catch (Exception ex) {
            logger.error("Gemini response generation failed.", ex);

            if (isRetryableTemporaryError(ex)) {
                throw new IllegalStateException(
                        HIGH_DEMAND_MESSAGE,
                        ex
                );
            }

            throw new IllegalStateException(
                    "Unable to generate a response with Gemini.",
                    ex
            );
        }
    }

    // =========================================================
    // STREAMING - BACKWARD COMPATIBILITY
    // =========================================================

    public void streamResponse(
            List<Message> messages,
            String assistantType,
            Consumer<String> onChunk
    ) {
        streamResponse(
                messages,
                assistantType,
                onChunk,
                () -> {
                }
        );
    }

    // =========================================================
    // STREAMING - WITH AUTOMATIC RETRY AND RESET
    // =========================================================

    public void streamResponse(
            List<Message> messages,
            String assistantType,
            Consumer<String> onChunk,
            Runnable onReset
    ) {
        validateConfiguration();

        if (onChunk == null) {
            throw new IllegalArgumentException(
                    "The streaming callback cannot be null."
            );
        }

        if (onReset == null) {
            throw new IllegalArgumentException(
                    "The reset callback cannot be null."
            );
        }

        Map<String, Object> requestBody =
                buildRequestBody(messages, assistantType);

        String url =
                "https://generativelanguage.googleapis.com/v1beta/models/"
                        + model
                        + ":streamGenerateContent?alt=sse";

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {

            AtomicBoolean chunkSent = new AtomicBoolean(false);

            logger.info(
                    "Starting Gemini streaming attempt {}/{}",
                    attempt,
                    MAX_ATTEMPTS
            );

            try {
                HttpHeaders headers = createHeaders();
                headers.setAccept(List.of(
                        MediaType.TEXT_EVENT_STREAM
                ));


                restTemplate.execute(
                        url,
                        HttpMethod.POST,
                        clientHttpRequest -> {
                            clientHttpRequest.getHeaders().putAll(headers);

                            objectMapper.writeValue(
                                    clientHttpRequest.getBody(),
                                    requestBody
                            );
                        },
                        response -> {
                            processStreamingResponse(
                                    response,
                                    chunk -> {
                                        chunkSent.set(true);
                                        onChunk.accept(chunk);
                                    }
                            );

                            return null;
                        }
                );

                logger.info(
                        "Gemini streaming completed successfully on attempt {}/{}",
                        attempt,
                        MAX_ATTEMPTS
                );

                return;

            } catch (Exception ex) {

                boolean temporaryError =
                        isRetryableTemporaryError(ex);

                logger.warn(
                        "Gemini retry diagnostic: temporaryError={}, "
                                + "chunksAlreadySent={}, attempt={}/{}",
                        temporaryError,
                        chunkSent.get(),
                        attempt,
                        MAX_ATTEMPTS
                );

                // Do not retry errors that are not temporary.
                if (!temporaryError) {

                    if (chunkSent.get()) {
                        onReset.run();
                    }

                    logger.error(
                            "Non-retryable Gemini streaming error.",
                            ex
                    );

                    throw new IllegalStateException(
                            "Gemini streaming failed. Please try again.",
                            ex
                    );
                }

                // Retry when the error is temporary.
                if (attempt < MAX_ATTEMPTS) {

                    if (chunkSent.get()) {
                        logger.info(
                                "Resetting partial response before retry."
                        );

                        onReset.run();
                    }

                    long delay = RETRY_DELAYS_MS[attempt - 1];

                    logger.warn(
                            "Gemini is temporarily unavailable. "
                                    + "Retrying in {} ms (attempt {}/{}).",
                            delay,
                            attempt + 1,
                            MAX_ATTEMPTS
                    );

                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException interruptedException) {
                        Thread.currentThread().interrupt();

                        throw new IllegalStateException(
                                "Gemini retry was interrupted.",
                                interruptedException
                        );
                    }

                    continue;
                }

                // Final attempt failed.
                if (chunkSent.get()) {
                    logger.info(
                            "Resetting incomplete response after final failure."
                    );

                    onReset.run();
                }

                logger.error(
                        "Gemini streaming failed after {} attempts.",
                        MAX_ATTEMPTS,
                        ex
                );

                throw new IllegalStateException(
                        HIGH_DEMAND_MESSAGE,
                        ex
                );
            }
        }

        throw new IllegalStateException(HIGH_DEMAND_MESSAGE);
    }

    // =========================================================
    // PROCESS SSE STREAM
    // =========================================================

    private void processStreamingResponse(
            ClientHttpResponse response,
            Consumer<String> onChunk
    ) throws IOException {

        try (
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(
                                response.getBody(),
                                StandardCharsets.UTF_8
                        )
                )
        ) {

            String line;

            while ((line = reader.readLine()) != null) {

                if (!line.startsWith("data:")) {
                    continue;
                }

                String data = line.substring(5).trim();

                if (data.isEmpty() || "[DONE]".equals(data)) {
                    continue;
                }

                JsonNode root = objectMapper.readTree(data);

                // Gemini may return an error inside an SSE event.
                JsonNode errorNode = root.path("error");

                if (!errorNode.isMissingNode()
                        && !errorNode.isNull()) {

                    String errorMessage = errorNode
                            .path("message")
                            .asText("Unknown Gemini error");

                    throw new IOException(
                            "Gemini returned an error: " + errorMessage
                    );
                }

                JsonNode candidates = root.path("candidates");

                if (!candidates.isArray() || candidates.isEmpty()) {
                    continue;
                }

                JsonNode parts = candidates
                        .path(0)
                        .path("content")
                        .path("parts");

                if (!parts.isArray()) {
                    continue;
                }

                for (JsonNode part : parts) {

                    JsonNode textNode = part.path("text");

                    if (!textNode.isMissingNode()
                            && !textNode.isNull()) {

                        String chunk = textNode.asText();

                        if (!chunk.isEmpty()) {
                            onChunk.accept(chunk);
                        }
                    }
                }
            }
        }
    }

    // =========================================================
    // BUILD GEMINI REQUEST
    // =========================================================

    private Map<String, Object> buildRequestBody(
            List<Message> messages,
            String assistantType
    ) {

        List<Map<String, Object>> contents = new ArrayList<>();

        if (messages == null || messages.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one message is required."
            );
        }

        for (Message message : messages) {

            if (message == null
                    || message.getContent() == null
                    || message.getContent().isBlank()) {
                continue;
            }

            Map<String, Object> part = new HashMap<>();
            part.put("text", message.getContent());

            Map<String, Object> content = new HashMap<>();

            String role = message.getRole();

            if ("ASSISTANT".equalsIgnoreCase(role)
                    || "MODEL".equalsIgnoreCase(role)) {
                content.put("role", "model");
            } else {
                content.put("role", "user");
            }

            content.put("parts", List.of(part));

            contents.add(content);
        }

        if (contents.isEmpty()) {
            throw new IllegalArgumentException(
                    "No valid messages were provided."
            );
        }

        Map<String, Object> requestBody = new HashMap<>();

        requestBody.put("systemInstruction", Map.of(
                "parts",
                List.of(Map.of(
                        "text",
                        getSystemInstruction(assistantType)
                ))
        ));

        requestBody.put("contents", contents);

        requestBody.put("generationConfig", Map.of(
                "temperature", 0.7,
                "topP", 0.95,
                "maxOutputTokens", 8192
        ));

        return requestBody;
    }

    // =========================================================
    // ASSISTANT SYSTEM INSTRUCTIONS
    // =========================================================

    private String getSystemInstruction(String assistantType) {

        if (assistantType == null) {
            assistantType = "GENERAL";
        }

        return switch (assistantType.toUpperCase()) {

            case "CODE" -> """
                    You are an expert software engineering assistant.
                    Help users write, understand, debug, and improve code.
                    Provide accurate and practical solutions.
                    When code is requested, provide complete and usable code.
                    Explain important technical decisions clearly.
                    """;

            case "WRITING" -> """
                    You are a professional writing assistant.
                    Help users write, rewrite, correct, and improve text.
                    Adapt your tone and style to the intended audience.
                    Produce natural, clear, and well-structured writing.
                    """;

            case "RESEARCH" -> """
                    You are a research assistant.
                    Provide structured, factual, and analytical answers.
                    Distinguish established facts from assumptions.
                    Explain complex topics using clear and relevant details.
                    """;

            default -> """
                    You are Omnex AI, a helpful and intelligent AI assistant.
                    Answer clearly, accurately, and naturally.
                    Adapt your responses to the user's needs.
                    Use examples when they help explain a topic.
                    """;
        };
    }

    // =========================================================
    // HTTP HEADERS
    // =========================================================

    private HttpHeaders createHeaders() {

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        return headers;
    }

    // =========================================================
    // CONFIGURATION VALIDATION
    // =========================================================

    private void validateConfiguration() {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Gemini API key is not configured."
            );
        }

        if (model == null || model.isBlank()) {
            throw new IllegalStateException(
                    "Gemini API model is not configured."
            );
        }
    }

    // =========================================================
    // TEMPORARY ERROR DETECTION
    // =========================================================

    private boolean isRetryableTemporaryError(Throwable exception) {

        Throwable current = exception;

        StringBuilder errorDetails = new StringBuilder();

        while (current != null) {

            if (current.getMessage() != null) {
                errorDetails
                        .append(" ")
                        .append(current.getMessage());
            }

            current = current.getCause();
        }

        String error = errorDetails
                .toString()
                .toLowerCase();

        return error.contains("high demand")
                || error.contains("overloaded")
                || error.contains("temporarily unavailable")
                || error.contains("resource_exhausted")
                || error.contains("service unavailable")
                || error.contains("rate limit")
                || error.contains("too many requests")
                || error.contains("http 429")
                || error.contains("http 503")
                || error.contains("quota exceeded")
                || error.contains("capacity exceeded")
                || error.contains("503 service")
                || error.contains("429 too many");
    }
}