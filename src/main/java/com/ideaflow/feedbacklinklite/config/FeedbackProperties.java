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
    /**
     * 外部配置文件路径，支持通过环境变量 FEEDBACK_CONFIG_PATH 或 feedback.config-path 覆盖
     * 默认指向工作目录下的 data/feedback_config.json，便于容器挂载
     */
    private String configPath = "./data/feedback_config.json";

    /**
     * 将另一个配置实例的值复制到当前对象，用于启动时加载外部 JSON 覆盖 application.yml
     */
    public void copyFrom(FeedbackProperties source) {
        if (source == null) {
            return;
        }
        this.enabled = source.isEnabled();
        if (source.getDingTalk() != null) {
            this.dingTalk.setWebhook(source.getDingTalk().getWebhook());
            this.dingTalk.setSecret(source.getDingTalk().getSecret());
        }
        if (source.getRateLimit() != null) {
            this.rateLimit.setEnabled(source.getRateLimit().isEnabled());
            this.rateLimit.setMaxRequests(source.getRateLimit().getMaxRequests());
            this.rateLimit.setWindowMinutes(source.getRateLimit().getWindowMinutes());
        }
        if (source.getAuth() != null) {
            this.auth.setUsername(source.getAuth().getUsername());
            this.auth.setPassword(source.getAuth().getPassword());
            this.auth.setToken(source.getAuth().getToken());
        }
        // 同步外部配置路径，保证后续保存使用同一路径
        this.configPath = source.getConfigPath();
    }

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
