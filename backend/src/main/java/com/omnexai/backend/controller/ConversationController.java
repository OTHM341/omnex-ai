package com.omnexai.backend.controller;

import com.omnexai.backend.entity.Conversation;
import com.omnexai.backend.entity.Message;
import com.omnexai.backend.service.ConversationService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private static final Logger log =
            LoggerFactory.getLogger(ConversationController.class);

    private final ConversationService conversationService;

    public ConversationController(
            ConversationService conversationService
    ) {
        this.conversationService = conversationService;
    }

    /**
     * Creates a new conversation.
     */
    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(
            @RequestBody(required = false)
            CreateConversationRequest request
    ) {

        String assistantType = request == null
                ? "GENERAL"
                : request.assistantType();

        try {

            Conversation conversation =
                    conversationService.createConversation(assistantType);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(toResponse(conversation));

        } catch (IllegalArgumentException exception) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    exception.getMessage()
            );
        }
    }

    /**
     * Retrieves all conversations.
     */
    @GetMapping
    public List<ConversationSummary> getAllConversations() {

        return conversationService.getAllConversations()
                .stream()
                .map(conversation -> {

                    List<Message> messages =
                            conversation.getMessages();

                    String lastMessage = messages.isEmpty()
                            ? ""
                            : messages.get(messages.size() - 1)
                                    .getContent();

                    return new ConversationSummary(
                            conversation.getId(),
                            conversation.getTitle(),
                            conversation.getAssistantType(),
                            conversation.getCreatedAt(),
                            conversation.getUpdatedAt(),
                            lastMessage
                    );
                })
                .toList();
    }

    /**
     * Retrieves one conversation with its messages.
     */
    @GetMapping("/{id}")
    public ConversationResponse getConversation(
            @PathVariable UUID id
    ) {

        try {

            return toResponse(
                    conversationService.getConversation(id)
            );

        } catch (EntityNotFoundException exception) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    exception.getMessage()
            );
        }
    }

    /**
     * Sends a message and returns the complete AI response.
     * This endpoint is kept for non-streaming requests.
     */
    @PostMapping("/{id}/messages")
    public ConversationResponse sendMessage(
            @PathVariable UUID id,
            @Valid @RequestBody ChatRequest request
    ) {

        try {

            Conversation conversation =
                    conversationService.sendMessage(
                            id,
                            request.message()
                    );

            return toResponse(conversation);

        } catch (EntityNotFoundException exception) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    exception.getMessage()
            );
        }
    }

    /**
     * Streams a Gemini response using Server-Sent Events.
     *
     * The reset event tells the frontend to clear partial output
     * before Gemini starts a new retry attempt.
     */
    @PostMapping("/{id}/messages/stream")
    public SseEmitter streamMessage(
            @PathVariable UUID id,
            @Valid @RequestBody ChatRequest request
    ) {

        SseEmitter emitter = new SseEmitter(180_000L);

        CompletableFuture.runAsync(() -> {

            try {

                log.info(
                        "Starting streaming for conversation ID: {}",
                        id
                );

                conversationService.streamMessage(
                        id,
                        request.message(),

                        // Send generated text chunks.
                        chunk -> {
                            try {
                                emitter.send(
                                        SseEmitter.event()
                                                .name("chunk")
                                                .data(Map.of("content", chunk))
                                );
                            } catch (Exception exception) {
                                log.error(
                                        "Failed to send streaming chunk for conversation ID: {}",
                                        id,
                                        exception
                                );

                                throw new RuntimeException(
                                        "Could not send streaming chunk.",
                                        exception
                                );
                            }
                        },

                        // Clear partial output before a retry.
                        () -> {
                            try {
                                emitter.send(
                                        SseEmitter.event()
                                                .name("reset")
                                                .data(Map.of("status", "reset"))
                                );

                                log.info(
                                        "Sent streaming reset event for conversation ID: {}",
                                        id
                                );

                            } catch (Exception exception) {
                                log.error(
                                        "Failed to send streaming reset event for conversation ID: {}",
                                        id,
                                        exception
                                );

                                throw new RuntimeException(
                                        "Could not reset streaming response.",
                                        exception
                                );
                            }
                        }
                );

                log.info(
                        "Response generated and saved for conversation ID: {}",
                        id
                );

                emitter.send(
                        SseEmitter.event()
                                .name("complete")
                                .data(Map.of("status", "completed"))
                );

                emitter.complete();

                log.info(
                        "Streaming completed successfully for conversation ID: {}",
                        id
                );

            } catch (Exception exception) {

                log.error(
                        "Streaming failed for conversation ID: {}",
                        id,
                        exception
                );

                try {

                    emitter.send(
                            SseEmitter.event()
                                    .name("error")
                                    .data(
                                            Map.of(
                                                    "message",
                                                    "Could not generate the response. Please try again."
                                            )
                                    )
                    );

                    emitter.complete();

                } catch (Exception sendException) {

                    log.error(
                            "Could not send SSE error event for conversation ID: {}",
                            id,
                            sendException
                    );

                    emitter.completeWithError(exception);
                }
            }
        });

        return emitter;
    }

    /**
     * Deletes a conversation.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable UUID id
    ) {

        try {

            conversationService.deleteConversation(id);

            return ResponseEntity.noContent().build();

        } catch (EntityNotFoundException exception) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    exception.getMessage()
            );
        }
    }

    /**
     * Converts a Conversation entity into its API response.
     */
    private ConversationResponse toResponse(
            Conversation conversation
    ) {

        List<MessageResponse> messages =
                conversation.getMessages()
                        .stream()
                        .map(message -> new MessageResponse(
                                message.getId(),
                                message.getRole(),
                                message.getContent(),
                                message.getCreatedAt()
                        ))
                        .toList();

        return new ConversationResponse(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getAssistantType(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt(),
                messages
        );
    }

    // =========================
    // REQUEST DTOs
    // =========================

    public record CreateConversationRequest(
            String assistantType
    ) {
    }

    public record ChatRequest(

            @NotBlank(message = "Message cannot be empty")
            @Size(
                    max = 20000,
                    message = "Message is too long"
            )
            String message

    ) {
    }

    // =========================
    // RESPONSE DTOs
    // =========================

    public record MessageResponse(
            UUID id,
            String role,
            String content,
            Instant createdAt
    ) {
    }

    public record ConversationResponse(
            UUID id,
            String title,
            String assistantType,
            Instant createdAt,
            Instant updatedAt,
            List<MessageResponse> messages
    ) {
    }

    public record ConversationSummary(
            UUID id,
            String title,
            String assistantType,
            Instant createdAt,
            Instant updatedAt,
            String lastMessage
    ) {
    }
}