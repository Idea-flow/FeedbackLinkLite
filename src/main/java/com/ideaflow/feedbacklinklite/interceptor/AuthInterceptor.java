package com.ideaflow.feedbacklinklite.interceptor;

import com.ideaflow.feedbacklinklite.config.FeedbackProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 权限拦截器
 * 用于拦截受保护的接口请求，验证 Cookie 中的 Auth Token
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final FeedbackProperties feedbackProperties;

    /**
     * 请求处理前调用
     * 验证 Cookie 中的 Token 是否与服务端配置一致
     *
     * @param request 请求对象
     * @param response 响应对象
     * @param handler 处理器
     * @return true: 验证通过, false: 验证失败
     */
    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) {
        // 获取所有 Cookie
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            // 遍历 Cookie 查找 auth 字段
            for (Cookie cookie : cookies) {
                if ("auth".equals(cookie.getName())) {
                    // 获取配置中的正确 Token
                    String authToken = feedbackProperties.getAuth().getToken();
                    // 比较 Cookie 值与配置值
                    if (authToken != null && authToken.equals(cookie.getValue())) {
                        // 验证成功，放行
                        return true;
                    }
                }
            }
        }

        // 验证失败，设置 401 状态码
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        // 拦截请求，不再向下传递
        return false;
    }
}

