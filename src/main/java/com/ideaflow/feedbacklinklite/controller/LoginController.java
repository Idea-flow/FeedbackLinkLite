package com.ideaflow.feedbacklinklite.controller;

import com.ideaflow.feedbacklinklite.config.FeedbackProperties;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoginController {

    // 注入配置属性类，用于获取预设的用户名和密码
    private final FeedbackProperties feedbackProperties;

    /**
     * 登录接口
     * 接收前端提交的用户名和密码，验证后返回Token
     *
     * @param request 登录请求体
     * @return 成功返回Token，失败返回401状态码
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // 简单鉴权逻辑：检查用户名和密码是否非空，且匹配配置文件中的设定值
        if (request.getUsername() != null && request.getPassword() != null &&
            request.getUsername().equals(feedbackProperties.getAuth().getUsername()) &&
            request.getPassword().equals(feedbackProperties.getAuth().getPassword())) {

            // 验证通过，返回配置的 Token
            // 使用 Map 封装返回数据，格式为 { "token": "..." }
            return ResponseEntity.ok(Collections.singletonMap("token", feedbackProperties.getAuth().getToken()));
        }

        // 验证失败，返回 401 Unauthorized 状态码
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    /**
     * 登录请求数据模型
     */
    @Data
    public static class LoginRequest {
        // 前端传来的用户名
        private String username;
        // 前端传来的密码
        private String password;
    }
}

