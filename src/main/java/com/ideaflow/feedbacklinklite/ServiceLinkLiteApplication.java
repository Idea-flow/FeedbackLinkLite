package com.ideaflow.feedbacklinklite;

import com.ideaflow.feedbacklinklite.config.FeedbackConfigStorage;
import com.ideaflow.feedbacklinklite.config.FeedbackProperties;
import io.micrometer.common.util.StringUtils;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.InetAddress;
import java.net.UnknownHostException;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class ServiceLinkLiteApplication {

    public static void main(String[] args) throws UnknownHostException {

        ConfigurableApplicationContext application = SpringApplication.run(ServiceLinkLiteApplication.class, args);

        Environment env = application.getEnvironment();
        String ip = InetAddress.getLocalHost().getHostAddress();
        String port = env.getProperty("server.port");
        String path = env.getProperty("server.servlet.context-path");
        path = StringUtils.isNotBlank(path) ? path : "";

        // 在启动后尝试加载外部 JSON 配置，覆盖内存配置
        FeedbackProperties feedbackProperties = application.getBean(FeedbackProperties.class);
        FeedbackConfigStorage storage = application.getBean(FeedbackConfigStorage.class);
        FeedbackProperties external = storage.loadIfExists(feedbackProperties);
        if (external != null) {
            feedbackProperties.copyFrom(external);
        }

        System.out.println("\n----------------------------------------------------------\n\t" +
                "blog is running! Access URLs:\n\t" +
                "Local: \t\thttp://localhost:" + port + path + "/\n\t" +
                "External: \thttp://" + ip + ":" + port + path + "/\n\t" +
                "Knife4j-ui: \thttp://" + ip + ":" + port + path + "/doc.html\n\t" +
                "----------------------------------------------------------");
    }

}
