huggingface space 运行一个内部端口是 4567的镜像容器 (ghcr.io/idea-flow/feedbacklinklite:latest),如何处理

docker pull ghcr.io/idea-flow/feedbacklinklite:latest



---
title: FeedbackLinkLite
sdk: docker
app_port: 4567   # 把外部暴露设置成 4567
---
运行 FeedbackLinkLite 应用的 Hugging Face Space 配置文件示例。

1. Docker SDK + 配置 app_port

在 Space 的 README.md YAML 配置中：

![image-20260131015158122](https://biliww.github.io/imgs/md202502/image-20260131015158122.png)


![image-20260131015527919](https://biliww.github.io/imgs/md202502/image-20260131015527919.png)