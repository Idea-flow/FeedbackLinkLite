package com.ideaflow.feedbacklinklite;

import io.micrometer.common.util.StringUtils;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class ServiceLinkLiteApplication {

    public static void main(String[] args) throws UnknownHostException {
        // 在 Spring Boot 启动之前确保日志和配置目录存在
        ensureDirectoriesExist();
        
        ConfigurableApplicationContext application = SpringApplication.run(ServiceLinkLiteApplication.class, args);

        Environment env = application.getEnvironment();
        String ip = InetAddress.getLocalHost().getHostAddress();
        String port = env.getProperty("server.port");
        String path = env.getProperty("server.servlet.context-path");
        path = StringUtils.isNotBlank(path) ? path : "";

        System.out.println("\n----------------------------------------------------------\n\t" +
                "blog is running! Access URLs:\n\t" +
                "Local: \t\thttp://localhost:" + port + path + "/\n\t" +
                "External: \thttp://" + ip + ":" + port + path + "/\n\t" +
                "Knife4j-ui: \thttp://" + ip + ":" + port + path + "/doc.html\n\t" +
                "----------------------------------------------------------");
    }
    
    /**
     * 确保日志和配置目录存在
     */
    private static void ensureDirectoriesExist() {
        try {
            // 确保日志目录存在
            String logDirProperty = System.getProperty("LOG_DIR");
            String logDir = logDirProperty != null ? logDirProperty : System.getenv("LOG_DIR");
            if (logDir == null) {
//                logDir = "./data/logs";
                logDir = "/app/data/logs";
            }

            Path logPath = Paths.get(logDir).toAbsolutePath().normalize();
            Files.createDirectories(logPath);

            System.out.println("Log directory ensured: " + logPath.toString());

            // 确保配置目录也存在
            String configPathStr = System.getProperty("FEEDBACK_CONFIG_PATH");
            String defaultConfigPath = configPathStr != null ? configPathStr : "./data/feedback_config.json";
            Path configPath = Paths.get(defaultConfigPath).getParent();
            if (configPath != null) {
                Files.createDirectories(configPath);
                System.out.println("Config directory ensured: " + configPath.toString());
            }
        } catch (Exception e) {
            System.err.println("Failed to create log/config directories: " + e.getMessage());
            e.printStackTrace();
        }
    }
}