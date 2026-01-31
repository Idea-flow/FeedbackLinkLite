# ServiceLinkLite - 轻量级用户反馈系统

> **"倾听用户的声音，是产品进化的捷径。"**

## 🌟 核心理念：利他 (Altruism)

在独立开发和小型项目的世界里，我们深知每一行代码背后的心血。然而，无论产品构思多么精妙，如果听不到用户的声音，就如同在黑暗中摸索。

**ServiceLinkLite** 的诞生源于一个简单的"想知道用户反馈"初衷：
- **为开发者减负**：您不应该为了一个简单的"反馈功能"而耗费宝贵的开发时间。我们希望您能专注于核心业务，把"倾听"这件事交给我们。
- **让用户受益**：当您的用户遇到问题或有好的建议时，他们能拥有一个极简、无压力的渠道与您沟通。这不仅解决了他们的问题，更让您的产品因为他们的参与而变得更好。

这是一个连接创造者与使用者的桥梁。我们相信，开放反馈渠道本身就是一种对他人的尊重与关怀，而这份"利他"之心，终将回馈于您的产品成长。

---

## 🚀 项目介绍

**ServiceLinkLite** 是一个专门为 **个人开发者**、**小型 Web 项目/网站** 打造的轻量级用户反馈解决方案。

它由两部分组成：
1. **前端 Widget**：一个极简的 JavaScript 插件，几行代码即可嵌入任何网页。
2. **后端服务**：基于 Spring Boot 的轻量级服务，负责接收反馈并实时推送到您的即时通讯工具（目前支持钉钉，更多渠道开发中）。

### ✨ 核心特性

- **极简集成**：前端只需引入一个 JS 文件，即可获得优雅的反馈按钮与弹窗。
- **即时触达**：用户提交反馈后，消息会立即通过机器人在群里通知您（支持钉钉 Webhook）。
- **防骚扰设计**：内置 IP 频次限制（Rate Limiting），防止恶意刷屏。
- **完全开源**：代码透明，数据掌控在自己手中，无隐私担忧。
- **开箱即用**：无需复杂的数据库配置（默认日志/内存处理，可视需求扩展）。

## 🛠 技术栈

- **后端**: Java 17+, Spring Boot
- **前端 Widget**: Vue 3 (Web Components), Vite

## 📦 快速开始

### 1. 部署后端
```bash
# 克隆项目
git clone https://github.com/your-repo/ServiceLinkLite.git

# 运行服务
cd ServiceLinkLite
./mvnw spring-boot:run
```

### 2. 配置通知渠道 (application.yml)
```yaml
feedback:
  channels:
    dingtalk:
      enabled: true
      access-token: "YOUR_DINGTALK_TOKEN"
      secret: "YOUR_DINGTALK_SECRET"
```

### 3. 前端嵌入
在您的 HTML 页面中添加：
```html
<script src="http://your-server-ip-or-domain/feedback.js"></script>
<feedback-widget api-base="http://your-server-ip:8080"></feedback-widget>
```

---

## 🤝 贡献与支持
如果你觉得这个小工具对你有帮助，欢迎 Star 支持！也欢迎提交 PR 扩展更多消息渠道（如飞书、企业微信、Email 等）。

让我们一起，用代码传递善意。

