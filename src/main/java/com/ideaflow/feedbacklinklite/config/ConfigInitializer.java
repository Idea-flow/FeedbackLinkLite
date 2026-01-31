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
        log.info("开始初始化应用配置...");
        
        // 确保必要目录存在
        ensureDirectoriesExist();
        
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
    
    /**
     * 确保日志和配置文件目录存在
     */
    private void ensureDirectoriesExist() {
        try {
            // 确保日志目录存在
            String logDirProperty = System.getProperty("LOG_DIR");
            String logDir = logDirProperty != null ? logDirProperty : System.getenv("LOG_DIR");
            if (logDir == null) {
                logDir = "./data/logs";
            }
            
            Path logPath = Paths.get(logDir).toAbsolutePath().normalize();
            Files.createDirectories(logPath);
            
            log.info("日志目录已确保存在: {}", logPath);
        } catch (Exception e) {
            log.warn("创建日志目录时出错，这可能导致日志写入失败: {}", e.getMessage());
        }
        
        try {
            // 确保配置文件目录存在
            String configPathStr = feedbackProperties.getConfigPath();
            if (configPathStr != null) {
                Path configPath = Paths.get(configPathStr).getParent();
                if (configPath != null) {
                    Files.createDirectories(configPath);
                    log.info("配置文件目录已确保存在: {}", configPath);
                }
            }
        } catch (Exception e) {
            log.warn("创建配置文件目录时出错: {}", e.getMessage());
        }
    }
}