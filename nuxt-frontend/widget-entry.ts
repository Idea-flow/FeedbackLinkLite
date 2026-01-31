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
        console.log('Checking for existing feedback-widget.32..')
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

                    console.log('API Base allScripts.src-one:', allScripts[i]);
                    const script = allScripts[i];
                    const attrValue = script.getAttribute('data-api-base');
                    if (attrValue) {
                        apiBase = attrValue;
                        break;
                    }
                    if (script.src.includes('feedback.js') || script.src.includes('feedback10.js')){
                        console.log('API Base allScripts.src-one-fed:', allScripts[i]);
                        const url = new URL(script.src);
                        apiBase = `${url.origin}/api`;

                    }

                }


                console.log('API Base allScripts.src---apiBase:', apiBase);
                // 2. 如果没有，则取第一个 feedback.js 脚本的 src
                if (!apiBase) {
                    for (let script of document.querySelectorAll('script[src]') as NodeListOf<HTMLScriptElement>) {
                        if (script.src.includes('feedback.js')) {
                            const url = new URL(script.src);
                            console.log('Found feedback.js script:', script.src);
                            console.log('Origin extracted:', url.origin);
                            apiBase = `${url.origin}/api`;
                            break;
                        }
                    }
                }

                // let found = false;
                //
                // for (let script of document.querySelectorAll('script[src]')) {
                //     if (script.src.includes('feedback.js')) {
                //         const url = new URL(script.src);
                //         console.log('Found feedback.js script:', script.src);
                //         console.log('Origin extracted:', url.origin);
                //         found = true;
                //         break;
                //     }
                // }
                //
                // if (!found) {
                //     console.warn('Did NOT find any script whose src includes "feedback.js"');
                // }
            }

            console.log('API Base currentScript.src:', currentScript);
            // If still not found and script has src, try to derive from script src
            if (!apiBase && currentScript && currentScript.src) {
                try {
                    const url = new URL(currentScript.src);
                    // Extract the path to determine if we need to adjust the API path
                    // If script is served from root like https://domain.com/feedback.js, use /api
                    // If script is served from subdirectory like https://domain.com/sub/feedback.js, adjust accordingly
                    const scriptPath = url.pathname;
                    console.log('API Base currentScript.src111:', url)
                    if (scriptPath === '/feedback.js' ) {
                        console.log('API Base currentScript.src22:', currentScript)
                        // Script is at root, so API is likely at /api
                        apiBase = `${url.origin}/api`;
                    } else {
                        console.log('API Base currentScript.src33:', currentScript)
                        // Script is in subdirectory, construct API path accordingly
                        const basePath = scriptPath.replace(/\/[^/]*$/, ''); // Remove filename
                        apiBase = `${url.origin}${basePath}/api`;
                    }
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

