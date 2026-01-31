package com.ideaflow.feedbacklinklite.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * 应用启动后的配置初始化器
 * 在Spring上下文完全加载后加载外部配置文件
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ConfigInitializer implements CommandLineRunner {

    private final FeedbackProperties feedbackProperties;
    private final FeedbackConfigStorage feedbackConfigStorage;

    @Override
    public void run(String... args) throws Exception {
        log.info("开始加载外部配置文件...");
        
        // 加载外部配置，如果存在则覆盖内存配置
        FeedbackProperties external = feedbackConfigStorage.loadIfExists(feedbackProperties);
        if (external != null) {
            feedbackProperties.copyFrom(external);
            log.info("外部配置加载完成");
        } else {
            log.info("未找到外部配置文件，继续使用默认配置");
        }
    }
}