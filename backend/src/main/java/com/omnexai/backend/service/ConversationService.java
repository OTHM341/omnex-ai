package com.omnexai.backend.service;

import com.omnexai.backend.entity.Conversation;
import com.omnexai.backend.entity.Message;
import com.omnexai.backend.repository.ConversationRepository;
import com.omnexai.backend.repository.MessageRepository;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;

@Service
public class ConversationService {

    private static final Set<String> ALLOWED_ASSISTANT_TYPES = Set.of(
            "GENERAL", "CODE", "WRITING", "RESEARCH"
    );

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final GeminiService geminiService;
    private final TransactionTemplate transactionTemplate;

    public ConversationService(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            GeminiService geminiService,
            PlatformTransactionManager transactionManager
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.geminiService = geminiService;

        this.transactionTemplate =
                new TransactionTemplate(transactionManager);

        this.transactionTemplate.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW
        );
    }

    @Transactional
    public Conversation createConversation() {
        return createConversation("GENERAL");
    }

    @Transactional
    public Conversation createConversation(String assistantType) {

        Conversation conversation = new Conversation();

        conversation.setTitle("New conversation");
        conversation.setAssistantType(
                normalizeAssistantType(assistantType)
        );

        return conversationRepository.save(conversation);
    }

    private String normalizeAssistantType(String assistantType) {

        if (assistantType == null || assistantType.isBlank()) {
            return "GENERAL";
        }

        String normalized =
                assistantType.trim().toUpperCase(Locale.ROOT);

        if (!ALLOWED_ASSISTANT_TYPES.contains(normalized)) {
            throw new IllegalArgumentException(
                    "Unsupported assistant type: " + assistantType
            );
        }

        return normalized;
    }

    @Transactional(readOnly = true)
    public List<Conversation> getAllConversations() {

        return conversationRepository
                .findAllWithMessagesByOrderByUpdatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Conversation getConversation(UUID id) {

        return conversationRepository.findWithMessagesById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Conversation not found."
                        )
                );
    }

    @Transactional
    public Conversation sendMessage(
            UUID conversationId,
            String content
    ) {

        Conversation conversation = getConversation(conversationId);

        Message userMessage = new Message("user", content);
        conversation.addMessage(userMessage);

        updateTitle(conversation, content);

        conversation.setUpdatedAt(Instant.now());

        messageRepository.save(userMessage);

        String reply = geminiService.generateResponse(
                conversation.getMessages(),
                conversation.getAssistantType()
        );

        Message assistantMessage =
                new Message("assistant", reply);

        conversation.addMessage(assistantMessage);
        conversation.setUpdatedAt(Instant.now());

        messageRepository.save(assistantMessage);
        conversationRepository.save(conversation);

        return conversation;
    }

    /**
     * Backward-compatible streaming method.
     */
    public void streamMessage(
            UUID conversationId,
            String content,
            Consumer<String> onChunk
    ) {
        streamMessage(
                conversationId,
                content,
                onChunk,
                () -> {
                    // No reset callback required.
                }
        );
    }

    /**
     * Streams a Gemini response and supports resetting partial output
     * when Gemini retries after a temporary error.
     */
    public void streamMessage(
            UUID conversationId,
            String content,
            Consumer<String> onChunk,
            Runnable onReset
    ) {

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(
                    "Message content cannot be empty."
            );
        }

        if (onChunk == null) {
            throw new IllegalArgumentException(
                    "Streaming callback cannot be null."
            );
        }

        if (onReset == null) {
            throw new IllegalArgumentException(
                    "Reset callback cannot be null."
            );
        }

        /*
         * PHASE 1:
         * Load the conversation and save the user message.
         * The transaction commits before Gemini is called.
         */
        StreamingContext context = transactionTemplate.execute(status -> {

            Conversation conversation = conversationRepository
                    .findWithMessagesById(conversationId)
                    .orElseThrow(() ->
                            new EntityNotFoundException(
                                    "Conversation not found."
                            )
                    );

            Message userMessage = new Message("user", content);

            conversation.addMessage(userMessage);

            updateTitle(conversation, content);

            conversation.setUpdatedAt(Instant.now());

            messageRepository.save(userMessage);
            conversationRepository.save(conversation);

            /*
             * Copy messages so Gemini can use them after
             * the database transaction has closed.
             */
            List<Message> messageSnapshot = new ArrayList<>();

            for (Message message : conversation.getMessages()) {

                messageSnapshot.add(
                        new Message(
                                message.getRole(),
                                message.getContent()
                        )
                );
            }

            return new StreamingContext(
                    conversation.getAssistantType(),
                    messageSnapshot
            );
        });

        if (context == null) {
            throw new IllegalStateException(
                    "Could not prepare the conversation for streaming."
            );
        }

        /*
         * PHASE 2:
         * Generate the response without keeping a database
         * transaction open.
         */
        StringBuilder completeResponse = new StringBuilder();

        geminiService.streamResponse(
                context.messages(),
                context.assistantType(),

                // Receive generated text.
                chunk -> {
                    completeResponse.append(chunk);
                    onChunk.accept(chunk);
                },

                // Clear the previous attempt before retrying.
                () -> {
                    completeResponse.setLength(0);
                    onReset.run();
                }
        );

        /*
         * PHASE 3:
         * Save only the final successful assistant response.
         */
        String finalResponse = completeResponse.toString();

        if (finalResponse.isBlank()) {
            throw new IllegalStateException(
                    "Gemini returned an empty response."
            );
        }

        transactionTemplate.executeWithoutResult(status -> {

            Conversation conversation = conversationRepository
                    .findWithMessagesById(conversationId)
                    .orElseThrow(() ->
                            new EntityNotFoundException(
                                    "Conversation not found."
                            )
                    );

            Message assistantMessage = new Message(
                    "assistant",
                    finalResponse
            );

            conversation.addMessage(assistantMessage);
            conversation.setUpdatedAt(Instant.now());

            messageRepository.save(assistantMessage);
            conversationRepository.save(conversation);
        });
    }

    private void updateTitle(
            Conversation conversation,
            String content
    ) {

        if (conversation.getMessages().size() == 1) {

            String title = content.length() > 60
                    ? content.substring(0, 57) + "..."
                    : content;

            conversation.setTitle(title);
        }
    }

    @Transactional
    public void deleteConversation(UUID id) {

        Conversation conversation = getConversation(id);

        conversationRepository.delete(conversation);
    }

    /**
     * Immutable data passed from the database transaction
     * to the Gemini streaming process.
     */
    private record StreamingContext(
            String assistantType,
            List<Message> messages
    ) {
    }
}