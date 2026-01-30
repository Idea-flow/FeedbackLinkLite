import { defineCustomElement } from 'vue'
import FeedbackWidget from './app/components/FeedbackWidget.ce.vue'

console.log('Initializing ServiceLinkLite Feedback Widget...')

// Define the custom element
const FeedbackWidgetElement = defineCustomElement(FeedbackWidget)

// Register the custom element
customElements.define('feedback-widget', FeedbackWidgetElement)

// Automatically append to body if not present
if (typeof document !== 'undefined') {
    if (!document.querySelector('feedback-widget')) {
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
}

