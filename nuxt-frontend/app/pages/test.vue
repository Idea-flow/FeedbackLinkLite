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
    <h1 class="text-2xl font-bold mb-4">Web Component 测试</h1>
    <p>组件应该显示在右下角。</p>

    <!-- 使用注册的自定义元素标签 -->
    <feedback-widget-demo />
  </div>
</template>

<style scoped>

</style>