import { defineCustomElement } from 'vue'
import FeedbackWidget from './app/components/FeedbackWidget.ce.vue'

console.log('Initializing ServiceLinkLite Feedback Widget...')

// Define the custom element
const FeedbackWidgetElement = defineCustomElement(FeedbackWidget)

// Register the custom element
customElements.define('feedback-widget', FeedbackWidgetElement)

// Automatically append to body if not present
if (typeof document !== 'undefined') {
    const initWidget = () => {
        console.log('Checking for existing feedback-widget...')
        if (!document.querySelector('feedback-widget')) {
            const widget = document.createElement('feedback-widget')

            // Pass API base from script tag attribute if available
            let apiBase = null;
            
            // First, try to get from current script
            const currentScript = document.currentScript as HTMLScriptElement | null;
            if (currentScript) {
                apiBase = currentScript.getAttribute('data-api-base');
            }
            
            // If not found in current script, search all scripts on the page
            if (!apiBase) {
                const allScripts = document.querySelectorAll('script[src*="feedback"], script[data-api-base]') as NodeListOf<HTMLScriptElement>;
                for (let i = 0; i < allScripts.length; i++) {
                    const script = allScripts[i];
                    const attrValue = script.getAttribute('data-api-base');
                    if (attrValue) {
                        apiBase = attrValue;
                        break;
                    }
                }
            }
            
            // If still not found and script has src, try to derive from script src
            if (!apiBase && currentScript && currentScript.src) {
                try {
                    const url = new URL(currentScript.src);
                    apiBase = `${url.origin}/api`;
                } catch (e) {
                    console.warn('Failed to derive api base from script src');
                }
            }
            
            // Default fallback
            if (!apiBase) {
                apiBase = '/api';
            }
            
            if (apiBase) {
                widget.setAttribute('api-base', apiBase);
            }

            document.body.appendChild(widget)
        }
    }

    // Check if document is already loaded, otherwise wait for DOMContentLoaded
    if (document.readyState === 'loading') {
        console.log('DOM is loading, waiting for DOMContentLoaded...')
        document.addEventListener('DOMContentLoaded', initWidget)
    } else {
        // DOM is already ready
        console.log('DOM is already ready, initializing widget...')
        initWidget()
    }
}

