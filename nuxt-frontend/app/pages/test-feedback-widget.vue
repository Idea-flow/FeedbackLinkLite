<script setup lang="ts">
// 设置页面标题
definePageMeta({
  layout: false // 不使用默认布局
});

// 在客户端挂载后引入并初始化反馈组件
onMounted(() => {
  // 检查组件是否已存在，避免重复初始化
  if (typeof window !== 'undefined' && !(window as any).ServiceLinkLiteFeedbackInstance) {
    // 动态加载反馈组件
    const script = document.createElement('script');
    script.src = '/feedback-widget.js';
    script.onload = () => {
      // 组件已加载，可选择自定义配置
      console.log('ServiceLinkLite Feedback Widget loaded323');
    };
    script.onerror = () => {
      console.error('Failed to load ServiceLinkLite Feedback Widget');
    };
    document.head.appendChild(script);
  }
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8">
    <div class="max-w-4xl mx-auto">
      <header class="py-12 text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">ServiceLinkLite 反馈组件测试页</h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          这是一个专门用于测试 feedback-widget.js 功能的页面。
          您可以在右下角找到悬浮的反馈按钮，点击即可使用反馈功能。
        </p>
      </header>

      <main class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-12">
        <section class="mb-10">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">页面内容示例</h2>
          <p class="text-gray-600 mb-4">
            这里是一些示例内容，用于展示反馈组件在真实页面环境中的表现。
            反馈组件会固定定位在页面右下角，不会影响页面主要内容的浏览。
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div class="bg-gradient-to-r from-orange-50 to-rose-50 p-6 rounded-xl border border-rose-100">
              <h3 class="font-bold text-lg text-rose-600 mb-2">功能特点</h3>
              <ul class="list-disc pl-5 text-gray-700 space-y-1">
                <li>无需框架依赖，原生 JavaScript 实现</li>
                <li>支持毛玻璃效果和现代 UI 设计</li>
                <li>提供明暗模式适配</li>
                <li>自动保存草稿功能</li>
                <li>防抖提交机制</li>
              </ul>
            </div>
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h3 class="font-bold text-lg text-indigo-600 mb-2">使用方法</h3>
              <ul class="list-disc pl-5 text-gray-700 space-y-1">
                <li>引入 feedback-widget.js 文件</li>
                <li>组件会自动初始化</li>
                <li>右下角出现悬浮按钮</li>
                <li>点击按钮打开反馈表单</li>
                <li>填写并提交反馈信息</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="mb-10">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">测试说明</h2>
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-gray-700">
            <p class="mb-2"><strong>注意：</strong>要使反馈功能正常工作，您需要确保后端服务正在运行，并且 API 端点正确配置。</p>
            <p>反馈数据将发送到 <code class="bg-gray-100 px-2 py-1 rounded">/api/feedback</code> 端点。</p>
          </div>
        </section>

        <section class="mb-10">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">自定义配置</h2>
          <p class="text-gray-600 mb-4">
            如果需要自定义反馈组件的行为，可以通过 JavaScript 进行配置：
          </p>
          <pre class="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
// 示例配置
const feedbackWidget = new ServiceLinkLiteFeedback({
  position: 'bottom-right',  // 位置: 'bottom-left', 'top-left', 'top-right'
  apiBase: '/api',           // API 基础路径
  title: '帮助我们改进',      // 标题
  subtitle: '您的反馈是我们前进的动力', // 副标题
  messagePlaceholder: '请详细描述您遇到的问题或建议...', // 消息占位符
  contactPlaceholder: '您的邮箱地址', // 联系方式占位符
  buttonText: '提交反馈',     // 按钮文本
  poweredByText: 'Powered by ServiceLinkLite', // 底部文字
  showPoweredBy: true,       // 是否显示底部文字
  enableLocalStorage: true,  // 是否启用本地存储
  enableAnimation: true      // 是否启用动画效果
});
          </pre>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">常见问题</h2>
          <div class="space-y-4">
            <div class="border-b pb-4">
              <h3 class="font-medium text-gray-800 mb-2">Q: 如何修改反馈组件的位置？</h3>
              <p class="text-gray-600">A: 使用配置选项 <code class="bg-gray-100 px-2 py-1 rounded">position</code>，可选值包括 'bottom-right', 'bottom-left', 'top-left', 'top-right'。</p>
            </div>
            <div class="border-b pb-4">
              <h3 class="font-medium text-gray-800 mb-2">Q: 如何禁用本地存储功能？</h3>
              <p class="text-gray-600">A: 在初始化时设置 <code class="bg-gray-100 px-2 py-1 rounded">enableLocalStorage: false</code>。</p>
            </div>
            <div class="border-b pb-4">
              <h3 class="font-medium text-gray-800 mb-2">Q: 如何自定义 API 端点？</h3>
              <p class="text-gray-600">A: 使用 <code class="bg-gray-100 px-2 py-1 rounded">apiBase</code> 选项指定基础路径，例如 <code class="bg-gray-100 px-2 py-1 rounded">apiBase: 'https://example.com/api/v1'</code>。</p>
            </div>
          </div>
        </section>
      </main>

      <footer class="py-8 text-center text-gray-500 text-sm">
        <p>ServiceLinkLite 反馈组件测试页面</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* 额外的样式可以在这里添加 */
code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}
</style>