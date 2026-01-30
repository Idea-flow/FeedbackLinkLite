package com.ideaflow.feedbacklinklite.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "feedback")
public class FeedbackProperties {
    private boolean enabled = true;
    private DingTalk dingTalk = new DingTalk();
    private RateLimit rateLimit = new RateLimit();

    @Data
    public static class DingTalk {
        private String webhook;
        private String secret;
    }

    @Data
    public static class RateLimit {
        private boolean enabled = true;
        private int limitPerMinute = 1;
    }
}

