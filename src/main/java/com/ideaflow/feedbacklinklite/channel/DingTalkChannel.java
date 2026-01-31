package com.ideaflow.feedbacklinklite.channel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ideaflow.feedbacklinklite.config.FeedbackProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Slf4j
@Component
@RequiredArgsConstructor
public class DingTalkChannel implements MessageChannel {
    private final FeedbackProperties feedbackProperties;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ChannelResult send(MessageContext context) {
        String webhook = feedbackProperties.getDingTalk().getWebhook();
        if (!StringUtils.hasText(webhook)) {
            return ChannelResult.fail("DingTalk webhook not configured");
        }
        try {
            String url = appendSignatureIfNeeded(webhook, feedbackProperties.getDingTalk().getSecret());
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("msgtype", "markdown");
            ObjectNode markdown = payload.putObject("markdown");
            markdown.put("title", "收到新的用户反馈");

            StringBuilder content = new StringBuilder();
            content.append("### 🔔 收到新的用户反馈\n\n");
            if (StringUtils.hasText(context.getPageUrl())) {
                content.append("- **页面**: ").append(escapeMarkdownContent(context.getPageUrl())).append("\n");
            }
            if (StringUtils.hasText(context.getContact())) {
                content.append("- **联系**: ").append(context.getContact()).append("\n");
            }
            content.append("\n**内容**:\n> ").append(escapeMarkdownContent(context.getMessage()));

            markdown.put("text", content.toString());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(payload.toString(), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                return ChannelResult.ok();
            }
            log.warn("DingTalk send failed status={} body={}", response.getStatusCode(), response.getBody());
            return ChannelResult.fail("DingTalk send failed");
        } catch (Exception ex) {
            log.error("DingTalk send exception", ex);
            return ChannelResult.fail("DingTalk send exception: " + ex.getMessage());
        }
    }

    @Override
    public String name() {
        return "dingTalk";
    }

    private String maskContact(String contact) {
        if (contact == null || contact.length() < 3) {
            return "***";
        }
        int keep = Math.min(3, contact.length());
        return contact.substring(0, keep) + "***";
    }

    // 更新方法：转义 Markdown 特殊字符，同时保留换行符
    private String escapeMarkdownContent(String content) {
        if (content == null) {
            return "";
        }
        
        // 先处理换行符，将其标准化为 \n
        content = content.replace("\r\n", "\n").replace("\r", "\n");
        
        // 处理多个连续空格，但保留有意义的空格
        content = content.replaceAll(" {2,}", " ");
        
        // 转义 Markdown 特殊字符，但不转义换行符
        content = content.replace("\\", "\\\\"); // 反斜杠
        content = content.replace("`", "\\`"); // 反引号
        content = content.replace("*", "\\*"); // 星号
        content = content.replace("_", "\\_"); // 下划线
        content = content.replace("{", "\\{"); // 花括号
        content = content.replace("}", "\\}"); // 花括号
        content = content.replace("[", "\\["); // 方括号
        content = content.replace("]", "\\]"); // 方括号
        content = content.replace("(", "\\("); // 圆括号
        content = content.replace(")", "\\)"); // 圆括号
        content = content.replace("#", "\\#"); // 井号
        content = content.replace("+", "\\+"); // 加号
        content = content.replace("-", "\\-"); // 减号
        content = content.replace(".", "\\."); // 点号
        content = content.replace("!", "\\!"); // 感叹号
        content = content.replace("~", "\\~"); // 波浪号
        content = content.replace("|", "\\|"); // 竖线
        
        // 在 Markdown 中，要实现真正的换行，通常需要在行尾加两个空格加换行
        // 或者使用 <br> 标签，但考虑到安全性和兼容性，我们直接保留换行
        content = content.replace("\n", "  \n"); // 在每行末尾添加两个空格和换行符，使 Markdown 正确渲染换行
        
        return content;
    }

    private String appendSignatureIfNeeded(String webhook, String secret) {
        if (!StringUtils.hasText(secret)) {
            return webhook;
        }
        long timestamp = System.currentTimeMillis();
        try {
            String stringToSign = timestamp + "\n" + secret;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] signData = mac.doFinal(stringToSign.getBytes(StandardCharsets.UTF_8));
            String sign = URLEncoder.encode(Base64.getEncoder().encodeToString(signData), StandardCharsets.UTF_8);
            String connector = webhook.contains("?") ? "&" : "?";
            return webhook + connector + "timestamp=" + timestamp + "&sign=" + sign;
        } catch (Exception e) {
            log.warn("Failed to sign DingTalk request", e);
            return webhook;
        }
    }
}