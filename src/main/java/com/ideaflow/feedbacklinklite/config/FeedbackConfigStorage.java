package com.ideaflow.feedbacklinklite.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 负责将 Feedback 配置持久化到 JSON，并在启动时尝试加载外部文件覆盖 application.yml。
 * 支持容器挂载，通过 feedback.config-path 或环境变量 FEEDBACK_CONFIG_PATH 指定路径。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FeedbackConfigStorage {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Environment environment;

    /**
     * 根据配置或环境变量解析外部文件路径。
     */
    public Path resolveConfigPath(FeedbackProperties properties) {
        // 优先环境变量
        String envPath = environment.getProperty("FEEDBACK_CONFIG_PATH");
        String propPath = properties.getConfigPath();
        String finalPath = StringUtils.hasText(envPath) ? envPath : propPath;
        if (!StringUtils.hasText(finalPath)) {
            finalPath = "./data/feedback_config.json";
        }
        return Paths.get(finalPath).toAbsolutePath().normalize();
    }

    /**
     * 启动时读取外部 JSON，若存在则返回，异常时返回 null。
     */
    public FeedbackProperties loadIfExists(FeedbackProperties properties) {
        Path path = resolveConfigPath(properties);
        File file = path.toFile();
        if (!file.exists()) {
            log.info("外部配置未找到，使用 application.yml: {}", path);
            return null;
        }
        try {
            byte[] bytes = Files.readAllBytes(path);
            FeedbackProperties loaded = objectMapper.readValue(bytes, FeedbackProperties.class);
            log.info("已加载外部配置: {}", path);
            return loaded;
        } catch (IOException e) {
            log.warn("读取外部配置失败，使用 application.yml: {}", path, e);
            return null;
        }
    }

    /**
     * 保存当前内存配置到外部 JSON，不存在则创建，存在则覆盖。
     */
    public void save(FeedbackProperties properties) throws IOException {
        Path path = resolveConfigPath(properties);
        Files.createDirectories(path.getParent());
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), properties);
        log.info("配置已写入外部文件: {}", path);
    }
}

