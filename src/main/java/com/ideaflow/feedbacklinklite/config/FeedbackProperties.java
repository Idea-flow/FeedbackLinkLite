package com.ideaflow.feedbacklinklite.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "feedback")
public class FeedbackProperties {
    private boolean enabled = true;
    private DingTalk dingTalk = new DingTalk();
    private RateLimit rateLimit = new RateLimit();
    private Auth auth = new Auth();

    @Data
    public static class DingTalk {
        private String webhook;
        private String secret;
    }

    @Data
    public static class RateLimit {
        private boolean enabled = true;
        /**
         * Max requests allowed within the window.
         */
        private int maxRequests = 3;
        /**
         * Time window in minutes.
         */
        private int windowMinutes = 60;
    }

    @Data
    public static class Auth {
        /**
         * 登录用户名
         */
        private String username;
        /**
         * 登录密码
         */
        private String password;
        /**
         * 鉴权 Token，登录成功后写入 Cookie 的值
         */
        private String token;
    }
}
