# ServiceLinkLite 规划

## 目标与范围
- 提供单 JS 引入的前端悬浮客服组件，采集用户反馈并发送至后端。
- 后端以策略模式路由消息到钉钉（首版）并预留多渠道扩展，支持启用开关与多渠道并发发送。
- 提供配置与频控能力（启用、Webhook、频率阈值），前端接口返回明确状态枚举。

## 前端方案（单 JS 引入）
- 形态：用户 `<script src="//cdn.../servicelinklite.js"></script>` 即可加载；内置悬浮按钮与弹窗 UI，支持自定义主题/位置。
- 功能：
  - 悬浮按钮 → 弹出对话框；字段：消息内容、联系方式（可选）、来源 URL/UA 自动附加。
  - 输入校验与节流（如 3s 内防抖）；本地缓存草稿与最近一次提交结果。
  - 调用后端固定接口 `/api/feedback`，处理返回状态（成功/失败/频繁/未配置渠道/未配置地址/禁用）。
- 技术建议：
  - 构建：Vite + 原生 TS（目标输出 UMD/IIFE，打包压缩，内联样式，避免外部依赖）。
  - DOM 隔离：Shadow DOM 或前缀化样式，防止污染宿主页面；命名空间事件避免冲突。
  - 安全：仅允许 HTTPS；校验后端域名白名单；最小化依赖，避免 XSS（转义用户输入）。

## 后端方案
- 架构：Spring Boot；控制器 → 服务层 → 策略路由（ChannelStrategy） → 具体渠道适配器（钉钉等）。
- 渠道策略：
  - 接口 `MessageChannel`：`send(MessageContext ctx): ChannelResult`；实现 `DingTalkChannel`，后续可加 Feishu/Slack/Email。
  - 组合策略：支持配置启用列表，按配置并行/串行发送（首版串行简化，失败聚合返回首个错误）。
- 频控：
  - 基于 IP  的令牌桶/滑动窗口；阈值来自配置（每分钟 N 条等）。
  - 频控结果映射到状态码 `TOO_FREQUENT`。
- 接口协议：
  - `POST /api/feedback`：请求 {message, contact?, pageUrl, userAgent?}；响应 {status: "SUCCESS" | "FAILED" | "TOO_FREQUENT" | "CHANNEL_DISABLED" | "CHANNEL_NOT_CONFIGURED" | "ENDPOINT_NOT_CONFIGURED" | "SERVER_ERROR", message?}。
  - `GET /api/config`：返回当前启用渠道与频控阈值（只读，供前端提示。
  - `POST /api/config`：更新配置（需鉴权：简单 token / Basic / 后续接入 OAuth）。
- 日志与审计：记录请求 ID、来源 IP、URL、渠道结果；失败重试暂不做，留扩展点。

## 待完成功能与实施步骤
- 前端技术选型确认：Vite + TS，单文件 UMD/IIFE 产物，Shadow DOM 隔离，无第三方依赖；约定构建命令 `npm run build` 输出 `dist/servicelinklite.js`，暴露挂载函数且默认自动挂载。
- 前端开发任务：
  - 悬浮按钮与弹窗 UI（主题/位置可配置），命名空间样式/事件。
  - 字段校验（必填 message，contact 可选）+ 3s 防抖；本地缓存草稿与最近提交结果。
  - 调用 `/api/feedback`、处理状态枚举提示；启动时调用 `/api/config` 获取启用/频控信息。
  - 快速验收：在示例页面可加载脚本、完成提交与状态提示、缓存生效。
- 后端配置存储决策：M1 使用 YAML + 内存缓存；M2 迁移到 DB（H2/MySQL 二选一，倾向 MySQL）+ 缓存刷新，保留向后兼容导入脚本。
- 后端开发任务：
  - 频控：IP 维度滑动窗口/令牌桶，阈值来自配置，返回 `TOO_FREQUENT`。
  - 渠道策略：串行发送，钉钉 `DingTalkChannel` 首版；支持启用列表并聚合首个错误。
  - 配置接口：`GET/POST /api/config`，简单 Header Token 鉴权，更新后刷新缓存；错误码映射未配置/未启用。
  - 日志：记录请求 ID、来源 IP/URL、渠道结果；联系方式脱敏。
- 迭代里程碑待办：
  - M1 原型：钉钉发送打通、文件配置、频控、前端最简 UI 与状态提示。
  - M2 配置化：DB 持久化 + 缓存刷新，管理鉴权，前端主题/位置定制。
  - M3 多渠道：并行/失败聚合，新增 Feishu/Email 适配。
  - M4 健壮性：灰度/降级、重试与告警、CSP/域白名单、审计报表。
- 发布与交付：前端发布通道待定（OSS+CDN 或 npm+UNPKG），后端提供 Dockerfile；确认运行环境限制后收敛方案。

## 技术选型
- 前端：Vite + TS + Shadow DOM；内置 minimal UI，无第三方依赖；打包成单文件 CDN 发布。
- 后端：Spring Boot 4 + Web + Validation；HTTP 客户端用 `WebClient`；缓存 `Caffeine`；频控 自研滑窗；日志 `Slf4j`。
- 部署：容器化（Dockerfile）

## 迭代里程碑
- M1 原型：单渠道钉钉发送，文件配置，基本频控，前端最简 UI，状态枚举打通。
- M2 配置接口：DB 持久化 + 缓存刷新，管理端简易鉴权，前端主题/位置定制。
- M3 多渠道：并行发送、失败聚合，更多渠道适配（Feishu/Email），更细粒度频控（按渠道）。
- M4 健壮性：灰度/降级策略、重试与告警、CSP/域白名单、审计报表。

## 测试要点
- 功能：前端按钮/弹窗交互、字段校验、草稿保存、状态提示；后端钉钉发送成功/失败路径。
- 频控：阈值内外行为、不同来源组合、并发场景。
- 配置：启用/禁用、Webhook 缺失、并行/串行切换、热更新生效；鉴权校验。
- 异常：钉钉超时/签名错误、JSON 解析错误、后端 5xx；前端网络异常提示。
- 安全：XSS 转义、CORS 域校验、接口鉴权、日志脱敏（联系方式）。

## 开放问题
- 是否需要多租户与渠道级独立频控？ 不需要
- 前端是否需要埋点与灰度开关？ 不需要
- 是否需要后端消息持久化与告警重试队列？ 不需要
