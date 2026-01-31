<script setup lang="ts">
import { defineCustomElement, onMounted } from 'vue'
import FeedbackWidget from '~/components/FeedbackWidget.ce.vue'

onMounted(() => {
  // FeedbackWidget.ce.vue 是一个 "Custom Element 模式" 的组件
  // 它的样式被封装在 JS 中，只有通过 defineCustomElement 注册为 Web Component 后
  // 并在 Shadow DOM 中渲染，样式才会生效。

  if (!customElements.get('feedback-widget-demo')) {
    const FeedbackWidgetElement = defineCustomElement(FeedbackWidget)
    customElements.define('feedback-widget-demo', FeedbackWidgetElement)
  }
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Web Component 测试3</h1>
    <p>组件应该显示在右下角。</p>
    <p class="mb-4 text-sm text-gray-600">下方是 FeedbackWidget 组件:</p>

    <!-- 使用注册的自定义元素标签 -->
    <feedback-widget-demo />
    
    <!-- 添加一些调试信息 -->
    <div class="mt-8 p-4 bg-gray-100 rounded-lg">
      <h2 class="text-lg font-semibold mb-2">调试信息</h2>
      <p>当前页面已成功导入 FeedbackWidget 组件</p>
      <p>组件将以 Web Component 形式在页面右下角显示</p>
    </div>
  </div>
</template>

<style scoped>
</style>