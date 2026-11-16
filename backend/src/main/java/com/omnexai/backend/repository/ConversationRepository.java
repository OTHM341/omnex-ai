package com.omnexai.backend.repository;

import com.omnexai.backend.entity.Conversation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository
        extends JpaRepository<Conversation, UUID> {

    @EntityGraph(attributePaths = "messages")
    List<Conversation> findAllWithMessagesByOrderByUpdatedAtDesc();

    @EntityGraph(attributePaths = "messages")
    Optional<Conversation> findWithMessagesById(UUID id);
}