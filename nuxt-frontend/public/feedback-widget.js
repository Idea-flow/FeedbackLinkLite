;(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    global.ServiceLinkLiteFeedback = factory();
  }
}(this, function () {
  'use strict';

  // 简易状态枚举与后端保持一致
  const Status = {
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    TOO_FREQUENT: 'TOO_FREQUENT',
    CHANNEL_DISABLED: 'CHANNEL_DISABLED',
    CHANNEL_NOT_CONFIGURED: 'CHANNEL_NOT_CONFIGURED',
    ENDPOINT_NOT_CONFIGURED: 'ENDPOINT_NOT_CONFIGURED',
    SERVER_ERROR: 'SERVER_ERROR'
  };

  const STORAGE_KEY = 'servicelinklite_feedback';
  const LAST_RESULT_KEY = 'servicelinklite_feedback_last';
  const DEBOUNCE_MS = 3000;
  const emailRegex = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;

  class ServiceLinkLiteFeedback {
    constructor(options = {}) {
      this.options = Object.assign({
        position: 'bottom-right', // 'bottom-left', 'top-left', 'top-right'
        apiBase: '/api', // 默认API基础路径
        zIndex: 9999,
        title: '帮助我们改进',
        subtitle: '您的反馈是我们前进的动力',
        messagePlaceholder: '请详细描述您遇到的问题或建议...',
        contactPlaceholder: '您的邮箱地址',
        buttonText: '提交反馈',
        poweredByText: 'Powered by ServiceLinkLite',
        showPoweredBy: true,
        enableLocalStorage: true, // 是否启用本地存储草稿功能
        enableAnimation: true // 是否启用动画效果
      }, options);

      this.isOpen = false;
      this.isHovered = false;
      this.loading = false;
      this.form = {
        message: '',
        contact: '',
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      };
      this.lastResult = null;
      this.error = '';
      this.lastSubmitAt = 0;
      this.element = null;

      this.init();
    }

    init() {
      this.loadDraft();
      this.createWidget();
      this.bindEvents();
    }

    createWidget() {
      // 创建容器元素
      this.element = document.createElement('div');
      this.element.className = 'servicelinklite-feedback-container';
      
      // 根据位置设置样式类
      let positionClass = 'bottom-6 right-6';
      switch(this.options.position) {
        case 'bottom-left':
          positionClass = 'bottom-6 left-6';
          break;
        case 'top-left':
          positionClass = 'top-6 left-6';
          break;
        case 'top-right':
          positionClass = 'top-6 right-6';
          break;
      }
      
      this.element.innerHTML = `
        <div class="" + positionClass + " sl-flex sl-flex-col sl-items-end sl-gap-4 sl-font-sans sl-text-slate-900 sl-z-" + this.options.zIndex + "" style="position: fixed;">
          <!-- Feedback Panel -->
          <div class="sl-feedback-panel sl-transition sl-duration-300 sl-ease-out sl-opacity-0 sl-translate-y-4 sl-scale-95 sl-hidden">
            <div class="sl-w-96 sl-origin-bottom-right sl-rounded-2xl sl-bg-white/80 sl-backdrop-blur-lg sl-p-0 sl-shadow-2xl sl-ring-1 sl-ring-slate-900/5 sl-focus:outline-none">
              <!-- Header -->
              <div class="sl-relative sl-overflow-hidden sl-rounded-t-2xl sl-bg-gradient-to-br sl-from-orange-400 sl-via-rose-500 sl-to-pink-600 sl-p-6 sl-text-white">
                <div class="sl-relative sl-z-10">
                  <h3 class="sl-text-lg sl-font-semibold sl-tracking-wide">${this.options.title}</h3>
                  <p class="sl-mt-1 sl-text-sm sl-text-white/90">${this.options.subtitle}</p>
                </div>
                <!-- Decorative elements -->
                <div class="sl-absolute sl--right-6 sl--top-6 sl-h-24 sl-w-24 sl-rounded-full sl-bg-yellow-300/30 sl-blur-2xl"></div>
                <div class="sl-absolute sl--left-6 sl--bottom-6 sl-h-24 sl-w-24 sl-rounded-full sl-bg-white/20 sl-blur-2xl"></div>
              </div>

              <!-- Content -->
              <div class="sl-p-6 sl-space-y-5">
                <div class="sl-space-y-1.5">
                  <label class="sl-block sl-text-sm sl-font-medium sl-text-slate-700">
                    反馈内容 <span class="sl-text-rose-500">*</span>
                  </label>
                  <textarea
                    class="sl-feedback-message sl-w-full sl-resize-none sl-rounded-xl sl-border-slate-200 sl-bg-white/80 sl-backdrop-blur-lg sl-px-4 sl-py-3 sl-text-sm sl-text-slate-900 sl-placeholder-sl-text-slate-400 sl-focus:sl-border-rose-500 sl-focus:sl-bg-white sl-focus:sl-outline-none sl-focus:sl-ring-1 sl-focus:sl-ring-rose-500 sl-transition-all sl-shadow-sm"
                    rows="4"
                    placeholder="${this.options.messagePlaceholder}"
                  ></textarea>
                </div>

                <div class="sl-space-y-1.5">
                  <label class="sl-block sl-text-sm sl-font-medium sl-text-slate-700">
                    联系方式 <span class="sl-text-rose-500">*</span>
                  </label>
                  <div class="sl-relative">
                    <input
                      type="email"
                      class="sl-feedback-contact sl-w-full sl-rounded-xl sl-border-slate-200 sl-bg-white/80 sl-backdrop-blur-lg sl-pl-11 sl-pr-4 sl-py-3 sl-text-sm sl-text-slate-900 sl-placeholder-sl-text-slate-400 sl-focus:sl-border-rose-500 sl-focus:sl-bg-white sl-focus:sl-outline-none sl-focus:sl-ring-1 sl-focus:sl-ring-rose-500 sl-transition-all sl-shadow-sm"
                      placeholder="${this.options.contactPlaceholder}"
                    />
                    <div class="sl-pointer-events-none sl-absolute sl-inset-y-0 sl-left-0 sl-flex sl-items-center sl-pl-3.5">
                      <svg class="sl-h-5 sl-w-5 sl-text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                  </div>
                  <p class="sl-error-message sl-text-xs sl-text-rose-500 sl-slide-down sl-mt-1 sl-hidden">
                    请填写有效的邮箱地址，以便我们联系您
                  </p>
                </div>

                <!-- Status Messages -->
                <div class="sl-status-message sl-rounded-lg sl-p-3 sl-text-sm sl-hidden">
                  <div class="sl-flex sl-items-center sl-gap-2">
                    <svg class="sl-success-icon sl-h-4 sl-w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
                    <svg class="sl-error-icon sl-h-4 sl-w-4 sl-hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    <span class="sl-status-text"></span>
                  </div>
                </div>

                <!-- Actions -->
                <button
                  class="sl-submit-btn sl-group sl-relative sl-flex sl-w-full sl-items-center sl-justify-center sl-gap-2 sl-overflow-hidden sl-rounded-xl sl-bg-gradient-to-r sl-from-orange-500 sl-to-rose-600 sl-px-4 sl-py-3 sl-text-sm sl-font-bold sl-text-white sl-shadow-lg sl-shadow-rose-500/25 sl-transition-all sl-duration-300 sl-hover:sl-shadow-rose-500/40 sl-focus:sl-outline-none sl-focus:sl-ring-2 sl-focus:sl-ring-rose-500 sl-focus:sl-ring-offset-2 sl-disabled:sl-cursor-not-allowed sl-disabled:sl-opacity-50 sl-disabled:sl-shadow-none"
                  disabled
                >
                  <div class="sl-absolute sl-inset-0 sl-bg-white/20 sl-opacity-0 sl-transition-opacity sl-duration-300 sl-group-hover:sl-opacity-100"></div>
                  <svg class="sl-loading-spinner sl-h-5 sl-w-5 sl-animate-spin sl-hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <span>${this.options.buttonText}</span>
                </button>
              </div>

              ${this.options.showPoweredBy ? `<div class="sl-border-t sl-border-slate-100 sl-p-3 sl-text-center sl-bg-slate-50/50 sl-rounded-b-2xl">
                   <p class="sl-text-[10px] sl-text-slate-400 sl-font-medium">${this.options.poweredByText}</p>
                 </div>` : ''}
            </div>
          </div>

          <!-- Trigger Button -->
          <button
            class="sl-trigger-btn sl-group sl-flex sl-h-14 sl-w-14 sl-items-center sl-justify-center sl-rounded-full sl-bg-gradient-to-br sl-from-orange-400 sl-to-rose-600 sl-text-white sl-shadow-lg sl-shadow-rose-500/30 sl-transition-all sl-duration-300 sl-hover:-sl-translate-y-1 sl-hover:sl-shadow-xl sl-hover:sl-shadow-rose-500/40 sl-focus:sl-outline-none sl-focus:sl-ring-4 sl-focus:sl-ring-orange-200 sl-active:sl-scale-95"
            aria-label="Toggle feedback form"
          >
            <div class="sl-relative">
              <svg
                class="sl-open-icon sl-h-7 sl-w-7 sl-transition-all sl-duration-300 sl-transform sl-absolute sl-top-1/2 sl-left-1/2 -sl-translate-x-1/2 -sl-translate-y-1/2 sl-opacity-100 sl-scale-100 sl-rotate-0"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
              <svg
                class="sl-close-icon sl-h-7 sl-w-7 sl-transition-all sl-duration-300 sl-transform sl-absolute sl-top-1/2 sl-left-1/2 -sl-translate-x-1/2 -sl-translate-y-1/2 sl-opacity-0 sl-scale-50 -sl-rotate-90"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </div>
          </button>
        </div>
      `;

      document.body.appendChild(this.element);

      // 获取表单元素引用
      this.panelEl = this.element.querySelector('.sl-feedback-panel');
      this.messageEl = this.element.querySelector('.sl-feedback-message');
      this.contactEl = this.element.querySelector('.sl-feedback-contact');
      this.submitBtnEl = this.element.querySelector('.sl-submit-btn');
      this.errorMessageEl = this.element.querySelector('.sl-error-message');
      this.statusMessageEl = this.element.querySelector('.sl-status-message');
      this.statusTextEl = this.element.querySelector('.sl-status-text');
      this.triggerBtnEl = this.element.querySelector('.sl-trigger-btn');
      this.successIconEl = this.element.querySelector('.sl-success-icon');
      this.errorIconEl = this.element.querySelector('.sl-error-icon');
      this.loadingSpinnerEl = this.element.querySelector('.sl-loading-spinner');

      // 更新初始值
      this.messageEl.value = this.form.message;
      this.contactEl.value = this.form.contact;

      // 添加CSS样式
      this.addStyles();
    }

    addStyles() {
      if (document.getElementById('sl-feedback-styles')) {
        return; // 样式已存在
      }

      const style = document.createElement('style');
      style.id = 'sl-feedback-styles';
      style.textContent = `
        /* Flexbox and layout utilities */
        .sl-flex { display: flex; }
        .sl-flex-col { flex-direction: column; }
        .sl-items-end { align-items: flex-end; }
        .sl-gap-4 { gap: 1rem; }
        .sl-gap-2 { gap: 0.5rem; }
        .sl-gap-3 { gap: 0.75rem; }
        .sl-w-full { width: 100%; }
        .sl-w-96 { width: 24rem; }
        .sl-h-14 { height: 3.5rem; }
        .sl-w-14 { width: 3.5rem; }
        .sl-h-7 { height: 1.75rem; }
        .sl-w-7 { width: 1.75rem; }
        .sl-h-5 { height: 1.25rem; }
        .sl-w-5 { width: 1.25rem; }
        .sl-h-4 { height: 1rem; }
        .sl-w-4 { width: 1rem; }
        .sl-h-24 { height: 6rem; }
        .sl-w-24 { width: 6rem; }
        
        .sl-relative { position: relative; }
        .sl-absolute { position: absolute; }
        .sl-inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
        .sl-inset-y-0 { top: 0; bottom: 0; }
        
        .sl-origin-bottom-right { transform-origin: bottom right; }
        .sl-top-1/2 { top: 50%; }
        .sl-left-1/2 { left: 50%; }
        .sl--translate-x-1/2 { transform: translateX(-50%); }
        .sl--translate-y-1/2 { transform: translateY(-50%); }
        .sl--right-6 { right: -1.5rem; }
        .sl--top-6 { top: -1.5rem; }
        .sl--left-6 { left: -1.5rem; }
        .sl--bottom-6 { bottom: -1.5rem; }
        
        .sl-z-\\${zIndex} { z-index: " + this.options.zIndex + "; }
        
        /* Spacing utilities */
        .sl-p-6 { padding: 1.5rem; }
        .sl-p-3 { padding: 0.75rem; }
        .sl-p-0 { padding: 0; }
        .sl-pt-3 { padding-top: 0.75rem; }
        .sl-pb-3 { padding-bottom: 0.75rem; }
        .sl-pl-3\.5 { padding-left: 0.875rem; }
        .sl-pl-11 { padding-left: 2.75rem; }
        .sl-pr-4 { padding-right: 1rem; }
        .sl-py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .sl-px-4 { padding-left: 1rem; padding-right: 1rem; }
        .sl-pl-1\.5 { padding-left: 0.375rem; }
        .sl-mt-1 { margin-top: 0.25rem; }
        .sl-mt-0 { margin-top: 0; }
        .sl-mb-1 { margin-bottom: 0.25rem; }
        .sl-mt-6 { margin-top: 1.5rem; }
        
        /* Rounded utilities */
        .sl-rounded-2xl { border-radius: 1rem; }
        .sl-rounded-xl { border-radius: 0.75rem; }
        .sl-rounded-full { border-radius: 9999px; }
        .sl-rounded-lg { border-radius: 0.5rem; }
        .sl-rounded-t-2xl { border-top-left-radius: 1rem; border-top-right-radius: 1rem; }
        .sl-rounded-b-2xl { border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem; }
        
        /* Color utilities */
        .sl-bg-white { background-color: white; }
        .sl-bg-slate-50 { background-color: #f8fafc; }
        .sl-bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
        .sl-from-orange-400 { --tw-gradient-from: #fb923c; }
        .sl-via-rose-500 { --tw-gradient-via: #f43f5e; }
        .sl-to-pink-600 { --tw-gradient-to: #db2777; }
        .sl-from-orange-500 { --tw-gradient-from: #f97316; }
        .sl-to-rose-600 { --tw-gradient-to: #e11d48; }
        .sl-bg-white\/20 { background-color: rgba(255, 255, 255, 0.2); }
        .sl-bg-yellow-300\/30 { background-color: rgba(254, 226, 83, 0.3); }
        .sl-bg-white\/20 { background-color: rgba(255, 255, 255, 0.2); }
        .sl-bg-green-50 { background-color: #f0fdf4; }
        .sl-bg-red-50 { background-color: #fef2f2; }
        .sl-bg-slate-50\/50 { background-color: rgba(248, 250, 252, 0.5); }
        
        .sl-text-white { color: white; }
        .sl-text-slate-900 { color: #0f172a; }
        .sl-text-slate-700 { color: #334155; }
        .sl-text-slate-400 { color: #94a3b8; }
        .sl-text-rose-500 { color: #f43f5e; }
        .sl-text-green-700 { color: #15803d; }
        .sl-text-red-700 { color: #b91c1c; }
        .sl-text-slate-900 { color: #0f172a; }
        
        .sl-placeholder-sl-text-slate-400::placeholder { color: #94a3b8; }
        
        /* Border utilities */
        .sl-border-slate-200 { border-color: #e2e8f0; }
        .sl-border-slate-100 { border-color: #e2e8f0; }
        .sl-ring-1 { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
        .sl-ring-slate-900\/5 { --tw-ring-color: rgb(15 23 42 / 0.05); }
        
        /* Shadow utilities */
        .sl-shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .sl-shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); }
        .sl-shadow-rose-500\/25 { box-shadow: 0 10px 15px -3px rgba(244, 63, 94, 0.25), 0 4px 6px -4px rgba(244, 63, 94, 0.25); }
        .sl-shadow-rose-500\/40 { box-shadow: 0 10px 15px -3px rgba(244, 63, 94, 0.4), 0 4px 6px -4px rgba(244, 63, 94, 0.4); }
        .sl-shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        
        /* Font utilities */
        .sl-font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; }
        .sl-font-semibold { font-weight: 600; }
        .sl-font-bold { font-weight: 700; }
        .sl-font-medium { font-weight: 500; }
        .sl-tracking-wide { letter-spacing: 0.025em; }
        .sl-text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .sl-text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .sl-text-xs { font-size: 0.75rem; line-height: 1rem; }
        .sl-text-\[10px\] { font-size: 10px; }
        
        /* Space utilities */
        .sl-space-y-5 > * + * { margin-top: 1.25rem; }
        .sl-space-y-1\.5 > * + * { margin-top: 0.375rem; }
        
        /* Text utilities */
        .sl-text-center { text-align: center; }
        
        /* Transition utilities */
        .sl-transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .sl-transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .sl-duration-300 { transition-duration: 300ms; }
        .sl-duration-200 { transition-duration: 200ms; }
        .sl-ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        .sl-ease-in { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }
        
        /* Transform utilities */
        .sl-transform { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y)); }
        .sl-scale-95 { --tw-scale-x: .95; --tw-scale-y: .95; }
        .sl-scale-100 { --tw-scale-x: 1; --tw-scale-y: 1; }
        .sl-scale-50 { --tw-scale-x: .5; --tw-scale-y: .5; }
        .sl-rotate-90 { --tw-rotate: 90deg; }
        .sl-rotate-0 { --tw-rotate: 0deg; }
        .sl--rotate-90 { --tw-rotate: -90deg; }
        .sl-translate-y-4 { --tw-translate-y: 1rem; }
        .sl-translate-y-0 { --tw-translate-y: 0px; }
        .sl--translate-y-1 { --tw-translate-y: -0.25rem; }
        .sl-scale-90 { --tw-scale-x: 0.9; --tw-scale-y: 0.9; }
        
        /* Opacity utilities */
        .sl-opacity-0 { opacity: 0; }
        .sl-opacity-100 { opacity: 1; }
        
        /* Animation utilities */
        .sl-animate-spin { animation: spin 1s linear infinite; }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Interaction utilities */
        .sl-cursor-not-allowed { cursor: not-allowed; }
        .sl-pointer-events-none { pointer-events: none; }
        
        /* Focus utilities */
        .sl-focus\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
        .sl-focus\:ring-1:focus { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
        .sl-focus\:ring-2:focus { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
        .sl-focus\:ring-rose-500:focus { --tw-ring-color: #f43f5e; }
        .sl-focus\:ring-orange-200:focus { --tw-ring-color: #fed7aa; }
        .sl-focus\:ring-offset-2 { --tw-ring-offset-width: 2px; }
        
        /* Hover utilities */
        .sl-hover\:-sl-translate-y-1:hover { --tw-translate-y: -0.25rem; }
        .sl-hover\:sl-shadow-xl:hover { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
        .sl-hover\:sl-shadow-rose-500\/40:hover { box-shadow: 0 20px 25px -5px rgba(244, 63, 94, 0.4), 0 8px 10px -6px rgba(244, 63, 94, 0.4); }
        .sl-group:hover .sl-opacity-100 { opacity: 1; }
        .sl-group:hover .sl-opacity-0 { opacity: 0; }
        
        /* Active utilities */
        .sl-active\:sl-scale-95:active { --tw-scale-x: 0.95; --tw-scale-y: 0.95; }
        
        /* Disabled utilities */
        .sl-disabled\:sl-cursor-not-allowed:disabled { cursor: not-allowed; }
        .sl-disabled\:sl-opacity-50:disabled { opacity: 0.5; }
        .sl-disabled\:sl-shadow-none:disabled { box-shadow: none; }
        
        /* Display utilities */
        .sl-hidden { display: none; }
        .sl-block { display: block; }
        
        /* Resize utilities */
        .sl-resize-none { resize: none; }
        
        /* Form utilities */
        .sl-textarea { display: block; width: 100%; padding: 0.5rem; font-size: 1rem; font-weight: 400; line-height: 1.5; color: #212529; background-color: #fff; background-clip: padding-box; border: 1px solid #ced4da; appearance: none; border-radius: 0.375rem; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
        
        /* Custom animations */
        .sl-slide-down {
          animation: slideDown 0.2s ease-out;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Position utilities */
        .sl-fixed { position: fixed; }
        .sl-bottom-6 { bottom: 1.5rem; }
        .sl-right-6 { right: 1.5rem; }
        .sl-top-6 { top: 1.5rem; }
        .sl-left-6 { left: 1.5rem; }
        .sl-bottom-0 { bottom: 0; }
        .sl-right-0 { right: 0; }
        .sl-top-0 { top: 0; }
        .sl-left-0 { left: 0; }
        
        /* Blur utilities */
        .sl-blur-2xl { filter: blur(40px); }
      `;
      document.head.appendChild(style);
    }

    bindEvents() {
      // 绑定触发按钮事件
      this.triggerBtnEl.addEventListener('click', () => {
        this.togglePanel();
      });

      // 绑定消息输入事件
      this.messageEl.addEventListener('input', (e) => {
        this.form.message = e.target.value;
        this.updateSubmitButtonState();
        if (this.options.enableLocalStorage) {
          this.saveDraft();
        }
      });

      // 绑定联系方式输入事件
      this.contactEl.addEventListener('input', (e) => {
        this.form.contact = e.target.value;
        this.validateContact();
        this.updateSubmitButtonState();
        if (this.options.enableLocalStorage) {
          this.saveDraft();
        }
      });

      // 绑定提交按钮事件
      this.submitBtnEl.addEventListener('click', () => {
        this.submit();
      });

      // 初始更新提交按钮状态
      this.updateSubmitButtonState();
    }

    togglePanel() {
      this.isOpen = !this.isOpen;
      
      if (this.isOpen) {
        this.openPanel();
      } else {
        this.closePanel();
      }
    }

    openPanel() {
      this.isOpen = true;
      this.panelEl.classList.remove('sl-hidden');
      
      // 触发过渡动画
      setTimeout(() => {
        this.panelEl.classList.remove('sl-opacity-0', 'sl-translate-y-4', 'sl-scale-95');
        this.panelEl.classList.add('sl-opacity-100', 'sl-translate-y-0', 'sl-scale-100');
      }, 10);
      
      // 切换图标
      const openIcon = this.element.querySelector('.sl-open-icon');
      const closeIcon = this.element.querySelector('.sl-close-icon');
      if (openIcon) openIcon.classList.add('sl-opacity-0', 'sl-scale-50', 'sl-rotate-90');
      if (closeIcon) closeIcon.classList.remove('sl-opacity-0', 'sl-scale-50', '-sl-rotate-90');
      if (openIcon) openIcon.classList.remove('sl-opacity-100', 'sl-scale-100', 'sl-rotate-0');
      if (closeIcon) closeIcon.classList.add('sl-opacity-100', 'sl-scale-100', 'sl-rotate-0');
    }

    closePanel() {
      // 关闭面板前的动画
      this.panelEl.classList.add('sl-opacity-0', 'sl-translate-y-4', 'sl-scale-95');
      this.panelEl.classList.remove('sl-opacity-100', 'sl-translate-y-0', 'sl-scale-100');
      
      // 在动画结束后隐藏元素
      setTimeout(() => {
        if (!this.isOpen) { // 确保仍然需要关闭
          this.panelEl.classList.add('sl-hidden');
        }
      }, 300);
      
      this.isOpen = false;
      
      // 切换图标
      const openIcon = this.element.querySelector('.sl-open-icon');
      const closeIcon = this.element.querySelector('.sl-close-icon');
      if (closeIcon) closeIcon.classList.add('sl-opacity-0', 'sl-scale-50', '-sl-rotate-90');
      if (openIcon) openIcon.classList.remove('sl-opacity-0', 'sl-scale-50', 'sl-rotate-90');
      if (closeIcon) closeIcon.classList.remove('sl-opacity-100', 'sl-scale-100', 'sl-rotate-0');
      if (openIcon) openIcon.classList.add('sl-opacity-100', 'sl-scale-100', 'sl-rotate-0');
    }

    updateSubmitButtonState() {
      const isValid = this.validateForm();
      this.submitBtnEl.disabled = !isValid;
    }

    validateForm() {
      // 检查消息是否为空
      if (!this.form.message.trim()) return false;
      
      // 检查联系方式是否为空
      if (!this.form.contact.trim()) return false;
      
      // 检查联系方式是否为有效邮箱
      if (!emailRegex.test(this.form.contact.trim())) return false;
      
      // 检查是否正在加载
      if (this.loading) return false;
      
      // 检查是否在防抖时间内
      const now = Date.now();
      if (now - this.lastSubmitAt < DEBOUNCE_MS) return false;
      
      return true;
    }

    validateContact() {
      const isValid = emailRegex.test(this.form.contact.trim());
      if (!isValid && this.form.contact.trim()) {
        this.errorMessageEl.classList.remove('sl-hidden');
      } else {
        this.errorMessageEl.classList.add('sl-hidden');
      }
    }

    async submit() {
      if (!this.validateForm()) return;
      
      this.loading = true;
      this.error = '';
      this.lastSubmitAt = Date.now();
      this.updateSubmitButtonState();
      
      // 显示加载状态
      this.loadingSpinnerEl.classList.remove('sl-hidden');
      this.submitBtnEl.querySelector('span').textContent = '';
      
      try {
        const payload = {
          message: this.form.message.trim(),
          contact: this.form.contact.trim(),
          pageUrl: this.form.pageUrl || window.location.href,
          userAgent: this.form.userAgent || navigator.userAgent
        };
        
        const response = await fetch(this.options.apiBase + '/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        this.lastResult = data;
        
        // 保存最后的结果
        if (this.options.enableLocalStorage) {
          localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(data));
        }
        
        if (data.status !== Status.SUCCESS) {
          this.showError(data);
        } else {
          this.showSuccess();
          // 清空表单
          this.form.message = '';
          this.form.contact = '';
          this.messageEl.value = '';
          this.contactEl.value = '';
          
          if (this.options.enableLocalStorage) {
            this.saveDraft(); // 清空草稿
          }
          
          // 如果启用了动画，在成功提交后自动关闭面板
          if (this.options.enableAnimation) {
            setTimeout(() => {
              if (this.isOpen) {
                this.togglePanel();
              }
            }, 2000);
          }
        }
      } catch (e) {
        this.showError({ status: Status.SERVER_ERROR, message: '网络异常，请稍后再试' });
      } finally {
        this.loading = false;
        this.updateSubmitButtonState();
        
        // 隐藏加载状态
        this.loadingSpinnerEl.classList.add('sl-hidden');
        this.submitBtnEl.querySelector('span').textContent = this.options.buttonText;
      }
    }

    showError(errorData) {
      const statusTips = {
        SUCCESS: '提交成功，感谢反馈',
        FAILED: '提交失败，请稍后再试',
        TOO_FREQUENT: '提交过于频繁，请稍后再试',
        CHANNEL_DISABLED: '渠道未启用',
        CHANNEL_NOT_CONFIGURED: '渠道未配置',
        ENDPOINT_NOT_CONFIGURED: '地址未配置',
        SERVER_ERROR: '服务异常，请稍后再试'
      };
      
      this.error = statusTips[errorData.status] || errorData.message || '未知错误';
      this.statusTextEl.textContent = this.error;
      this.statusMessageEl.classList.remove('sl-hidden', 'sl-bg-green-50', 'sl-text-green-700');
      this.statusMessageEl.classList.add('sl-bg-red-50', 'sl-text-red-700');
      this.successIconEl.classList.add('sl-hidden');
      this.errorIconEl.classList.remove('sl-hidden');
    }

    showSuccess() {
      const statusTips = {
        SUCCESS: '提交成功，感谢反馈',
        FAILED: '提交失败，请稍后再试',
        TOO_FREQUENT: '提交过于频繁，请稍后再试',
        CHANNEL_DISABLED: '渠道未启用',
        CHANNEL_NOT_CONFIGURED: '渠道未配置',
        ENDPOINT_NOT_CONFIGURED: '地址未配置',
        SERVER_ERROR: '服务异常，请稍后再试'
      };
      
      const successMsg = statusTips[this.lastResult?.status] || '提交成功，感谢反馈';
      this.statusTextEl.textContent = successMsg;
      this.statusMessageEl.classList.remove('sl-hidden', 'sl-bg-red-50', 'sl-text-red-700');
      this.statusMessageEl.classList.add('sl-bg-green-50', 'sl-text-green-700');
      this.errorIconEl.classList.add('sl-hidden');
      this.successIconEl.classList.remove('sl-hidden');
    }

    loadDraft() {
      if (!this.options.enableLocalStorage) return;
      
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          this.form.message = parsed.message || '';
          this.form.contact = parsed.contact || '';
          
          // 更新DOM中的值
          if (this.messageEl) this.messageEl.value = this.form.message;
          if (this.contactEl) this.contactEl.value = this.form.contact;
        }
        
        const last = localStorage.getItem(LAST_RESULT_KEY);
        if (last) {
          this.lastResult = JSON.parse(last);
        }
      } catch (e) {
        console.error('Load draft failed:', e);
      }
    }

    saveDraft() {
      if (!this.options.enableLocalStorage) return;
      
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ message: this.form.message, contact: this.form.contact })
        );
      } catch (e) {
        console.error('Save draft failed:', e);
      }
    }

    // 公共方法：允许外部程序化打开/关闭面板
    open() {
      if (!this.isOpen) {
        this.togglePanel();
      }
    }

    close() {
      if (this.isOpen) {
        this.togglePanel();
      }
    }

    // 公共方法：销毁组件
    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  // 自动初始化，如果页面上没有其他实例
  if (!window.ServiceLinkLiteFeedbackInstance) {
    window.ServiceLinkLiteFeedbackInstance = new ServiceLinkLiteFeedback();
  }

  return ServiceLinkLiteFeedback;
}));