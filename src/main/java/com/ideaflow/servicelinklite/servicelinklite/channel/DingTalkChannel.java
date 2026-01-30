package com.ideaflow.servicelinklite.servicelinklite.channel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ideaflow.servicelinklite.servicelinklite.config.FeedbackProperties;
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
            payload.put("msgtype", "text");
            ObjectNode text = payload.putObject("text");
            String content = "用户反馈:\n" + context.getMessage();
            if (StringUtils.hasText(context.getContact())) {
                content += "\n联系方式: " + maskContact(context.getContact());
            }
            if (StringUtils.hasText(context.getPageUrl())) {
                content += "\n页面: " + context.getPageUrl();
            }
//            if (StringUtils.hasText(context.getUserAgent())) {
//                content += "\nUA: " + context.getUserAgent();
//            }
            text.put("content", content);

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

