package com.ideaflow.servicelinklite.servicelinklite.controller;

import com.ideaflow.servicelinklite.servicelinklite.channel.MessageContext;
import com.ideaflow.servicelinklite.servicelinklite.model.FeedbackRequest;
import com.ideaflow.servicelinklite.servicelinklite.model.FeedbackResponse;
import com.ideaflow.servicelinklite.servicelinklite.model.FeedbackStatus;
import com.ideaflow.servicelinklite.servicelinklite.service.ChannelRouter;
import com.ideaflow.servicelinklite.servicelinklite.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {
    private final ChannelRouter channelRouter;
    private final RateLimiterService rateLimiterService;

    @PostMapping
    public ResponseEntity<FeedbackResponse> submit(@Valid @RequestBody FeedbackRequest request,
                                                   HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        if (!rateLimiterService.allowed(ip)) {
            return ResponseEntity.ok(FeedbackResponse.of(FeedbackStatus.TOO_FREQUENT));
        }
        MessageContext context = MessageContext.builder()
                .message(request.getMessage())
                .contact(request.getContact())
                .pageUrl(request.getPageUrl())
                .userAgent(request.getUserAgent())
                .build();
        var result = channelRouter.route(context);
        if (result.isSuccess()) {
            return ResponseEntity.ok(FeedbackResponse.of(FeedbackStatus.SUCCESS));
        }
        String msg = result.getMessage();
        FeedbackStatus status = mapErrorToStatus(msg);
        return ResponseEntity.ok(FeedbackResponse.of(status, msg));
    }

    private FeedbackStatus mapErrorToStatus(String msg) {
        if (msg == null) {
            return FeedbackStatus.SERVER_ERROR;
        }
        String lower = msg.toLowerCase();
        if (lower.contains("disabled")) {
            return FeedbackStatus.CHANNEL_DISABLED;
        }
        if (lower.contains("not configured")) {
            if (lower.contains("webhook")) {
                return FeedbackStatus.ENDPOINT_NOT_CONFIGURED;
            }
            return FeedbackStatus.CHANNEL_NOT_CONFIGURED;
        }
        if (lower.contains("frequent")) {
            return FeedbackStatus.TOO_FREQUENT;
        }
        return FeedbackStatus.FAILED;
    }
}
