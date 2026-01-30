package com.ideaflow.feedbacklinklite.service;

import com.ideaflow.feedbacklinklite.config.FeedbackProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class RateLimiterService {
    private final FeedbackProperties feedbackProperties;
    private final Map<String, ArrayDeque<Long>> buckets = new ConcurrentHashMap<>();

    public boolean allowed(String key) {
        FeedbackProperties.RateLimit cfg = feedbackProperties.getRateLimit();
        if (cfg == null || !cfg.isEnabled()) {
            return true;
        }
        int limit = cfg.getLimitPerMinute();
        long now = Instant.now().toEpochMilli();
        long windowStart = now - 60_000L;
        ArrayDeque<Long> deque = buckets.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst() < windowStart) {
                deque.pollFirst();
            }
            if (deque.size() >= limit) {
                return false;
            }
            deque.addLast(now);
            return true;
        }
    }
}

