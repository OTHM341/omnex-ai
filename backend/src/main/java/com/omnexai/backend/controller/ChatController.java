package com.omnexai.backend.controller;

import com.omnexai.backend.entity.Message;
import com.omnexai.backend.service.GeminiService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final GeminiService geminiService;

    public ChatController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * Handles a standard chat request.
     */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request
    ) {

        List<Message> messages = List.of(
                new Message("user", request.message())
        );

        String response = geminiService.generateResponse(
                messages,
                "GENERAL"
        );

        return ResponseEntity.ok(
                new ChatResponse(response)
        );
    }

    /**
     * Request DTO.
     */
    public record ChatRequest(
            @NotBlank(message = "Message cannot be empty")
            String message
    ) {
    }

    /**
     * Response DTO.
     */
    public record ChatResponse(
            String response
    ) {
    }
}