package com.omnexai.backend.repository;

import com.omnexai.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MessageRepository
        extends JpaRepository<Message, UUID> {
}