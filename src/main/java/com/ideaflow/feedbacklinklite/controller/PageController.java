package com.ideaflow.feedbacklinklite.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 页面路由控制器，用于处理前端页面请求
 */
@Controller
public class PageController {

    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    @GetMapping("/login")
    public String login() {
        return "forward:/login/index.html";
    }

    @GetMapping("/static/login")
    public String staticLogin() {
        return "forward:/login/index.html";
    }

    @GetMapping("/config")
    public String config() {
        return "forward:/index.html";
    }
}