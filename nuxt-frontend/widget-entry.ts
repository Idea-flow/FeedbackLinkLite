import { defineCustomElement } from 'vue'
import FeedbackWidget from './app/components/FeedbackWidget.ce.vue'

// 优化挂载逻辑 (widget-entry.ts):
// 增加了智能检测：在挂载前检查 document.body 是否存在。
// 如果 body 尚未就绪，则监听 DOMContentLoaded 事件或通过延时重试，确保 100% 成功挂载。
// 增强层级样式 (FeedbackWidget.ce.vue):
// 将 z-index 调整为 CSS 允许的最大安全整数 2147483647，确保它永远处于页面最顶层。
// 给组件宿主 (:host) 添加了 position: relative 和高 z-index，防止其被宿主页面的其他元素“压住”。

console.log('Initializing ServiceLinkLite Feedback Widget...')

// Define the custom element
const FeedbackWidgetElement = defineCustomElement(FeedbackWidget)

// Register the custom element
customElements.define('feedback-widget', FeedbackWidgetElement)

// Function to mount the widget
function mountWidget() {
    if (typeof document === 'undefined') return
    if (document.querySelector('feedback-widget')) return
    if (!document.body) {
         // Should technically be covered by checking readyState or wait, but just in case
        setTimeout(mountWidget, 100)
        return
    }

    const widget = document.createElement('feedback-widget')

    // Pass API base from script tag attribute if available
    const currentScript = document.currentScript as HTMLScriptElement | null
    if (currentScript) {
        let apiBase = currentScript.getAttribute('data-api-base')

        // If explicit config is missing, try to derive from script src
        if (!apiBase && currentScript.src) {
            try {
                const url = new URL(currentScript.src)
                apiBase = `${url.origin}/api`
            } catch (e) {
                console.warn('Failed to derive api base from script src')
            }
        }

        if (apiBase) {
            widget.setAttribute('api-base', apiBase)
        }
    }

    document.body.appendChild(widget)
}

// Automatically append to body
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountWidget)
    } else {
        mountWidget()
    }
}
