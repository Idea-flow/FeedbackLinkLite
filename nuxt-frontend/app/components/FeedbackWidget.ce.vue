<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

const Status = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  TOO_FREQUENT: 'TOO_FREQUENT',
  CHANNEL_DISABLED: 'CHANNEL_DISABLED',
  CHANNEL_NOT_CONFIGURED: 'CHANNEL_NOT_CONFIGURED',
  ENDPOINT_NOT_CONFIGURED: 'ENDPOINT_NOT_CONFIGURED',
  SERVER_ERROR: 'SERVER_ERROR'
} as const

type FeedbackStatus = typeof Status[keyof typeof Status]

interface FeedbackConfig {
  enabledChannels?: string[]
  rateLimit?: number
  messageRequired?: boolean
}

interface FeedbackRequest {
  message: string
  contact: string
  pageUrl?: string
  userAgent?: string
}

interface FeedbackResponse {
  status: FeedbackStatus
  message?: string
}

const STORAGE_KEY = 'servicelinklite_feedback'
const LAST_RESULT_KEY = 'servicelinklite_feedback_last'
const THEME_KEY = 'servicelinklite_feedback_theme'
const DEBOUNCE_MS = 3000

const emailRegex = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/

// Use a prop or window variable for API base
const props = defineProps({
  apiBase: {
    type: String,
    default: ''
  }
})

const apiBaseUrl = computed(() => {
  if (props.apiBase) return props.apiBase
  const windowBase = typeof window !== 'undefined' ? (window as any).__SL_API_BASE__ || '' : ''
  
  // 如果windowBase有值则使用它，否则使用当前页面的协议+主机名作为基础地址
  if (windowBase) {
    return windowBase.replace(/\/$/, '')
  }
  
  // 默认使用当前页面的协议和主机名作为API基础地址
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`
  }
  
  return ''
})

const withBase = (path: string) => {
  if (apiBaseUrl.value) {
    // 确保基础URL以/结尾，且路径不以/开头（避免重复斜杠）
    const basePath = apiBaseUrl.value.endsWith('/') ? apiBaseUrl.value.slice(0, -1) : apiBaseUrl.value
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${basePath}${cleanPath}`
  }
  // 如果没有基础URL，直接返回路径（允许相对路径）
  return path
}


const isOpen = ref(false)
const isHovered = ref(false)
const loading = ref(false)
// const config = reactive<FeedbackConfig>({}) // Removed unused config loading
const form = reactive<FeedbackRequest>({
  message: '',
  contact: '',
  pageUrl: '',
  userAgent: ''
})
const lastResult = ref<FeedbackResponse | null>(null)
const error = ref('')
const lastSubmitAt = ref(0)

// Theme Logic
const themeMode = ref<'light' | 'dark' | 'system'>('system')
const systemDark = ref(false)

const currentTheme = computed(() => {
  if (themeMode.value === 'system') {
    return systemDark.value ? 'dark' : 'light'
  }
  return themeMode.value
})

const toggleTheme = () => {
  const modes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
  const nextIndex = (modes.indexOf(themeMode.value) + 1) % modes.length
  const nextMode = modes[nextIndex]
  if (nextMode) {
    themeMode.value = nextMode
    localStorage.setItem(THEME_KEY, themeMode.value)
  }
}

const themeIcon = computed(() => {
  if (themeMode.value === 'light') return 'sun'
  if (themeMode.value === 'dark') return 'moon'
  return 'monitor' // system
})

const canSubmit = computed(() => {
  if (!form.message.trim()) return false
  if (!form.contact.trim()) return false
  if (!emailRegex.test(form.contact.trim())) return false
  if (loading.value) return false
  const now = Date.now()
  return now - lastSubmitAt.value >= DEBOUNCE_MS
})

const statusTip = computed(() => {
  if (!lastResult.value) return ''
  const map: Record<FeedbackStatus, string> = {
    SUCCESS: '提交成功，感谢反馈',
    FAILED: '提交失败，请稍后再试',
    TOO_FREQUENT: '提交过于频繁，请稍后(1小时)再试',
    CHANNEL_DISABLED: '渠道未启用',
    CHANNEL_NOT_CONFIGURED: '渠道未配置',
    ENDPOINT_NOT_CONFIGURED: '地址未配置',
    SERVER_ERROR: '服务异常，请稍后再试'
  }
  return map[lastResult.value.status]
})

const loadDraft = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      form.message = parsed.message || ''
      form.contact = parsed.contact || ''
    }
    const last = localStorage.getItem(LAST_RESULT_KEY)
    if (last) {
      lastResult.value = JSON.parse(last)
    }
  } catch (e) {
    console.error('load draft failed', e)
  }
}

const saveDraft = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ message: form.message, contact: form.contact })
    )
  } catch (e) {
    console.error('save draft failed', e)
  }
}

const submit = async () => {
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  lastSubmitAt.value = Date.now()
  try {
    const payload: FeedbackRequest = {
      message: form.message.trim(),
      contact: form.contact.trim(),
      pageUrl: form.pageUrl || window.location.href,
      userAgent: form.userAgent || navigator.userAgent
    }
    const res = await fetch(withBase('/feedback'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data: FeedbackResponse = await res.json()
    lastResult.value = data
    localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(data))
    if (data.status !== Status.SUCCESS) {
      error.value = statusTip.value
    } else {
      form.message = ''
      form.contact = ''
      saveDraft()
    }
  } catch (e) {
    error.value = '网络异常，请稍后再试'
  } finally {
    loading.value = false
  }
}

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}
const handleMouseEnter = () => { isHovered.value = true }
const handleMouseLeave = () => { isHovered.value = false }

const updateSystemTheme = (e: MediaQueryListEvent) => {
  systemDark.value = e.matches
}

onMounted(() => {
  loadDraft()
  console.log('最终API请求地址:', withBase('/feedback'))
  
  // Theme init
  const storedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | 'system' | null
  if (storedTheme) themeMode.value = storedTheme
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = mediaQuery.matches
  mediaQuery.addEventListener('change', updateSystemTheme)
})

onUnmounted(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.removeEventListener('change', updateSystemTheme)
})
</script>

<template>
  <div class="feedback-widget-container" :class="currentTheme">
    <!-- Feedback Panel -->
    <div v-show="isOpen" class="feedback-popup swing-in-bottom-fwd">
      <!-- Header -->
      <div class="popup-header">
        <div class="header-content">
          <h3>帮助我们改进</h3>
          <p>您的反馈是我们前进的动力</p>
        </div>
        
        <!-- Theme Toggle -->
        <button class="theme-toggle" @click="toggleTheme" :title="`切换主题 (${themeMode})`">
          <svg v-if="themeIcon === 'sun'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
          <svg v-else-if="themeIcon === 'moon'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </button>

        <!-- Decorative circles -->
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
      </div>

      <!-- Content -->
      <div class="popup-body">
        <div class="form-group">
          <label>
            反馈内容 <span class="required">*</span>
          </label>
          <textarea
            v-model="form.message"
            @input="saveDraft"
            class="input-control textarea"
            rows="4"
            placeholder="请详细描述您遇到的问题或建议..."
          ></textarea>
        </div>

        <div class="form-group">
          <label>
            联系方式 <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              v-model="form.contact"
              @input="saveDraft"
              type="email"
              class="input-control contact-input"
              placeholder="您的邮箱地址"
            />
            <div class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
          </div>
          <p v-if="form.contact && !emailRegex.test(form.contact)" class="error-text">
            请填写有效的邮箱地址
          </p>
        </div>

        <!-- Status Messages -->
        <div v-if="statusTip || error" class="status-message" :class="lastResult?.status === Status.SUCCESS ? 'status-success' : 'status-error'">
            <div class="status-content">
              <svg v-if="lastResult?.status === Status.SUCCESS" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              <span>{{ statusTip || error }}</span>
            </div>
        </div>

        <!-- Actions -->
        <button
          class="submit-button"
          :disabled="!canSubmit"
          @click="submit"
        >
          <div class="button-hover-effect"></div>
          <span v-if="loading" class="spinner"></span>
          <span v-else>提交反馈</span>
        </button>
      </div>

      <!-- Footer info -->
      <div class="popup-footer">
           <p>Powered by ServiceLinkLite</p>
      </div>
    </div>

    <!-- Trigger Button -->
    <button
      class="trigger-button"
      @click="toggleOpen"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      aria-label="Toggle feedback form"
    >
      <div class="icon-wrapper">
        <svg
          class="icon icon-close"
          :class="{ 'visible': isOpen, 'hidden': !isOpen }"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
        <svg
          class="icon icon-open"
          :class="{ 'visible': !isOpen, 'hidden': isOpen }"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </div>
    </button>
  </div>
</template>

<style>
/* Theme Variables - Apple Glassmorphism (Orange Accent) */
.feedback-widget-container {
  /* Light Mode (Default) */
  --primary-color: #FF9500; /* Apple System Orange */
  --primary-gradient: linear-gradient(135deg, #FF9500, #FFB340);
  --accent-glow: radial-gradient(circle at top right, rgba(255, 149, 0, 0.15), transparent 70%);
  
  --bg-color: #ffffff;
  --bg-glass: rgba(250, 250, 250, 0.72);
  --text-color: #1D1D1F;
  --text-muted: #86868B;
  
  --border-color: rgba(0, 0, 0, 0.08);
  --input-bg: rgba(0, 0, 0, 0.04);
  --input-border: transparent;
  --input-focus-ring: rgba(255, 149, 0, 0.3);
  
  --shadow-color: rgba(0, 0, 0, 0.1);
  --shadow-lg: 
    0 24px 48px -12px rgba(0, 0, 0, 0.18),
    0 0 0 1px rgba(0, 0, 0, 0.05); /* Inner border via shadow */
    
  --footer-bg: transparent;
  --footer-text: #86868B;
  
  --error-color: #FF3B30;
  --success-bg: rgba(52, 199, 89, 0.1);
  --success-text: #34C759;
  --error-bg: rgba(255, 59, 48, 0.1);
  --error-text: #FF3B30;

  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Dark Mode Overrides */
.feedback-widget-container.dark {
  --primary-color: #FF9F0A;
  --primary-gradient: linear-gradient(135deg, #FF9F0A, #FFB340);
  --accent-glow: radial-gradient(circle at top right, rgba(255, 159, 10, 0.2), transparent 70%);
  
  --bg-color: #000000;
  --bg-glass: rgba(30, 30, 30, 0.72);
  --text-color: #F5F5F7;
  --text-muted: #86868B;
  
  --border-color: rgba(255, 255, 255, 0.12);
  --input-bg: rgba(255, 255, 255, 0.08);
  --input-border: transparent;
  --input-focus-ring: rgba(255, 159, 10, 0.3);
  
  --shadow-color: rgba(0, 0, 0, 0.5);
  --shadow-lg: 
    0 24px 48px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.12); /* Inner border via shadow */
    
  --footer-bg: transparent;
  --footer-text: #86868B;
  
  --success-bg: rgba(48, 209, 88, 0.15);
  --success-text: #30D158;
  --error-bg: rgba(255, 69, 58, 0.15);
  --error-text: #FF453A;
}

.feedback-widget-container > * {
  pointer-events: auto;
}

/* Modal */
.feedback-popup {
  width: 360px;
  background-color: var(--bg-glass);
  background-image: var(--accent-glow);
  backdrop-filter: saturate(180%) blur(24px);
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  transform-origin: bottom right;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); /* Apple-like spring */
}

/* Animations */
.swing-in-bottom-fwd {
  animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes slide-up-fade {
  0% { transform: translateY(20px) scale(0.95); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

/* Header */
.popup-header {
  position: relative;
  background: transparent; /* Removed solid gradient */
  padding: 24px 24px 12px 24px;
  color: var(--text-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.header-content {
  position: relative;
  z-index: 10;
}
.header-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--text-color);
}
.header-content p {
  margin-top: 4px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 0;
}
.theme-toggle {
  position: relative;
  z-index: 20;
  background: var(--input-bg);
  border: none;
  border-radius: 50%; /* Circle button */
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}
.theme-toggle:hover {
  background: rgba(128, 128, 128, 0.15);
  color: var(--text-color);
  transform: scale(1.05);
}
/* Removed decorative circles as they clash with clean glass style */
.circle { display: none; }

/* Body */
.popup-body {
  padding: 12px 24px 24px 24px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 8px;
  margin-left: 4px; /* Align with input rounded corners */
}
.required {
  color: var(--primary-color);
}

.input-control {
  width: 100%;
  border-radius: 16px;
  border: 1px solid transparent;
  background-color: var(--input-bg);
  padding: 14px 16px;
  font-size: 0.9375rem;
  color: var(--text-color);
  transition: all 0.2s;
  box-sizing: border-box;
}
.input-control::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
}
.input-control:focus {
  background-color: var(--bg-color);
  outline: none;
  box-shadow: 0 0 0 2px var(--input-focus-ring);
}
.textarea {
  resize: none;
  min-height: 120px;
}
.input-wrapper {
  position: relative;
}
.contact-input {
  padding-left: 44px;
}
.input-icon {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  padding-left: 14px;
  color: var(--text-muted);
  pointer-events: none;
  transition: color 0.3s;
}
.input-control:focus + .input-icon {
  color: var(--primary-color);
}
.error-text {
  color: var(--error-color);
  font-size: 0.75rem;
  margin-top: 6px;
  font-weight: 500;
  margin-left: 4px;
}

/* Status Message */
.status-message {
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 0.875rem;
  margin-bottom: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
}
/* ... rest matches ... */

/* Button */
.submit-button {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  border-radius: 100px; /* Pill shape */
  background: var(--text-color); /* Contrast button */
  padding: 14px 16px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--bg-color); /* Inverted text */
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.feedback-widget-container.dark .submit-button {
    background: var(--primary-color); /* In dark mode, use primary color for button visibility */
    color: #000;
}
.submit-button:hover {
  transform: scale(1.02);
  opacity: 0.9;
}
.submit-button:active {
  transform: scale(0.98);
}
.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
  transform: none;
}
.button-hover-effect {
  display: none; /* Removed complex effect for cleaner look */
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(128, 128, 128, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Footer */
.popup-footer {
  border-top: none;
  padding: 8px 12px 16px;
  text-align: center;
  background-color: transparent;
}
.popup-footer p {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
  opacity: 0.6;
}

/* Trigger Button */
.trigger-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-glass);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  color: var(--text-color);
  border: 1px solid rgba(128, 128, 128, 0.1);
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.trigger-button:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(0,0,0,0.16);
  background: var(--bg-color);
}
.trigger-button:active {
  transform: scale(0.9);
}
.icon-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
}
.icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.combined-enter-active,
.combined-leave-active {
  transition: opacity 0.3s ease;
}

.icon.visible {
  opacity: 1;
  transform: translate(-50%, -50%) rotate(0) scale(1);
}
.icon.hidden {
  opacity: 0;
  transform: translate(-50%, -50%) rotate(90deg) scale(0.5);
}
/* Specific tweaks */
.icon-close.hidden {
  transform: translate(-50%, -50%) rotate(-90deg) scale(0.5);
}

</style>