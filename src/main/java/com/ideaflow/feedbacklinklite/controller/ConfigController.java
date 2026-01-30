package com.ideaflow.feedbacklinklite.controller;

import com.ideaflow.feedbacklinklite.config.FeedbackProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class ConfigController {
    private final FeedbackProperties feedbackProperties;

    @GetMapping
    public FeedbackProperties getConfig() {
        return feedbackProperties;
    }

    @PostMapping
    public ResponseEntity<Boolean> update(@RequestBody FeedbackProperties updated) {
        // For simplicity first version: overwrite in-memory properties
        feedbackProperties.setEnabled(updated.isEnabled());
        feedbackProperties.getDingTalk().setWebhook(updated.getDingTalk().getWebhook());
        feedbackProperties.getDingTalk().setSecret(updated.getDingTalk().getSecret());
        feedbackProperties.getRateLimit().setEnabled(updated.getRateLimit().isEnabled());
        feedbackProperties.getRateLimit().setLimitPerMinute(updated.getRateLimit().getLimitPerMinute());
        return ResponseEntity.ok(true);
    }
}

