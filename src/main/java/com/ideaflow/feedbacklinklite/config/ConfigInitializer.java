package com.ideaflow.feedbacklinklite.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 应用启动后的配置初始化器
 * 在Spring上下文完全加载后加载外部配置文件
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ConfigInitializer implements CommandLineRunner, Ordered {

    private final FeedbackProperties feedbackProperties;
    private final FeedbackConfigStorage feedbackConfigStorage;

    @Override
    public int getOrder() {
        // 设置较高优先级，确保在其他组件之前运行
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            log.info("开始加载外部配置文件...");

            // 加载外部配置，如果存在则覆盖内存配置
            FeedbackProperties external = feedbackConfigStorage.loadIfExists(feedbackProperties);
            if (external != null) {
                feedbackProperties.copyFrom(external);
                log.info("外部配置加载完成");
            } else {
                log.info("未找到外部配置文件，继续使用默认配置");
            }
        } catch (Exception e) {
            log.error("未找到外部配置文件，继续使用默认配置",e);
        }
    }
}