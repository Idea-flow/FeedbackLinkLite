package com.ideaflow.feedbacklinklite.service;

import com.ideaflow.feedbacklinklite.config.FeedbackProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimiterService {
    // 定义最大 IP 数量限制，防止恶意攻击导致内存溢出。如果内存中存储的 IP 超过 100,000 个，将拒绝新 IP
    private static final int MAX_IP_COUNT = 100_000;
    // 注入应用配置属性，用于获取限流相关的配置（如是否开启、时间窗口、最大请求数）
    private final FeedbackProperties feedbackProperties;
    // 使用线程安全的 ConcurrentHashMap 存储每个 IP（key）对应的请求时间戳队列（value）
    private final Map<String, ArrayDeque<Long>> buckets = new ConcurrentHashMap<>();

    /**
     * 判断指定 IP 是否允许访问
     * @param key IP 地址
     * @return true 表示允许访问，false 表示请求过于频繁被限流
     */
    public boolean allowed(String key) {
        // 获取配置中的限流规则
        FeedbackProperties.RateLimit cfg = feedbackProperties.getRateLimit();
        // 如果没有配置限流或限流未开启，则默认允许访问
        if (cfg == null || !cfg.isEnabled()) {
            return true;
        }
        // 获取配置的最大请求次数（例如每小时 5 次）
        int maxRequests = cfg.getMaxRequests();
        // 获取时间窗口的大小，将分钟转换为毫秒（例如 60 分钟 * 60 * 1000 = 3600000 毫秒）
        long windowMillis = cfg.getWindowMinutes() * 60 * 1000L;
        // 获取当前的时间戳（毫秒）
        long now = Instant.now().toEpochMilli();
        // 计算时间窗口的起始时间，在这个时间之前的请求记录都被视为“过期”
        long windowStart = now - windowMillis;

        // computeIfAbsent：如果 map 中没有这个 key，则根据后面的逻辑创建一个新的队列放入 map
        ArrayDeque<Long> deque = buckets.computeIfAbsent(key, k -> {
            // 在创建新 IP 记录前，检查当前存储的 IP 总数是否已超限
            if (buckets.size() >= MAX_IP_COUNT) {
                return null;
            }
            // 创建一个新的空队列用于存储该 IP 的请求时间
            return new ArrayDeque<>();
        });
        // 如果 deque 为 null，说明上面的数量检查没通过（存储已满），为了保护系统，拒绝该请求
        if (deque == null) {
            return false;
        }
        // 对这个 deque 对象加锁，保证同一时间只有一个线程能操作这个 IP 的请求记录
        synchronized (deque) {
            // 清理过期数据：检查队列头部（最早的请求），如果早于窗口起始时间，就移除
            while (!deque.isEmpty() && deque.peekFirst() < windowStart) {
                deque.pollFirst();
            }
            // 检查当前队列大小。如果已经达到允许的最大请求数，则拒绝本次请求
            if (deque.size() >= maxRequests) {
                return false;
            }
            // 如果未超限，将当前请求的时间戳加入队列尾部，记录这次访问
            deque.addLast(now);
            return true;
        }
    }

    // 定时清理任务，执行频率由配置的时间窗口决定（单位：毫秒）。支持动态配置，例如窗口为60分钟，则每60分钟清理一次(只有重启的时候生效)
    @Scheduled(fixedDelayString = "#{feedbackProperties.rateLimit.windowMinutes * 60 * 1000}")
    public void cleanup() {
        // 获取限流配置
        FeedbackProperties.RateLimit cfg = feedbackProperties.getRateLimit();
        if (cfg == null) return;

        // 计算当前的时间窗口范围
        long windowMillis = cfg.getWindowMinutes() * 60 * 1000L;
        long now = Instant.now().toEpochMilli();
        long windowStart = now - windowMillis;

        // 遍历所有存储的 IP 记录
        buckets.forEach((key, deque) -> {
            // 加锁处理，防止和 allowed 方法冲突
            synchronized (deque) {
                // 移除队列中过期的请求时间戳
                while (!deque.isEmpty() && deque.peekFirst() < windowStart) {
                    deque.pollFirst();
                }
                // 如果清理后队列空了，说明这个 IP 在最近一个时间窗口内没有任何有效请求
                // 那么这个 key 也可以从大 map 中移除了，节省内存
                if (deque.isEmpty()) {
                    // 注意：这里存在微小的竞态条件，但对于限流场景可接受
                    buckets.remove(key, deque);
                }
            }
        });
        log.debug("Rate limiter cleanup completed. Current keys: {}", buckets.size());
    }
}
