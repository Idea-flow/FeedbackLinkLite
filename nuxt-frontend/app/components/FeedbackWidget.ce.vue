<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

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

onMounted(() => {
  loadDraft()
  console.log('最终API请求地址:', withBase('/feedback'))
})
</script>

<template>
  <div class="feedback-widget-container">
    <!-- Feedback Panel -->
    <div v-show="isOpen" class="feedback-popup swing-in-bottom-fwd">
      <!-- Header -->
      <div class="popup-header">
        <div class="header-content">
          <h3>帮助我们改进</h3>
          <p>您的反馈是我们前进的动力</p>
        </div>
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
/* CSS Reset for Widget - scoped to shadow root if used as CE, but good to be explicit */
:host {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
  position: relative;
  z-index: 2147483647;
}

.feedback-widget-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
  pointer-events: none; /* Let clicks pass through container area */
}

.feedback-widget-container > * {
  pointer-events: auto; /* Re-enable clicks on children */
}

/* Modal */
.feedback-popup {
  width: 384px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.05); /* ring-slate-900/5 */
  transform-origin: bottom right;
}

/* Animations */
.swing-in-bottom-fwd {
	animation: swing-in-bottom-fwd 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

@keyframes swing-in-bottom-fwd {
  0% { transform: rotateX(100deg); transform-origin: bottom; opacity: 0; }
  100% { transform: rotateX(0); transform-origin: bottom; opacity: 1; }
}

/* Header */
.popup-header {
  position: relative;
  background: linear-gradient(135deg, #fb923c, #f43f5e, #db2777);
  padding: 24px;
  color: white;
  overflow: hidden;
}
.header-content {
  position: relative;
  z-index: 10;
}
.header-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  margin: 0;
}
.header-content p {
  margin-top: 4px;
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0;
}
.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(24px);
}
.circle-1 {
  background-color: rgba(253, 224, 71, 0.3);
  width: 96px;
  height: 96px;
  top: -24px;
  right: -24px;
}
.circle-2 {
  background-color: rgba(255, 255, 255, 0.2);
  width: 96px;
  height: 96px;
  bottom: -24px;
  left: -24px;
}

/* Body */
.popup-body {
  padding: 24px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
}
.required {
  color: #f43f5e;
}

.input-control {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #0f172a;
  transition: all 0.2s;
  box-sizing: border-box;
}
.input-control::placeholder {
  color: #94a3b8;
}
.input-control:focus {
  background-color: white;
  border-color: #f43f5e;
  outline: none;
  box-shadow: 0 0 0 1px #f43f5e;
}
.textarea {
  resize: none;
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
  color: #94a3b8;
  pointer-events: none;
}
.error-text {
  color: #f43f5e;
  font-size: 0.75rem;
  margin-top: 4px;
}

/* Status Message */
.status-message {
  border-radius: 8px;
  padding: 12px;
  font-size: 0.875rem;
  margin-bottom: 20px;
}
.status-success {
  background-color: #f0fdf4;
  color: #15803d;
}
.status-error {
  background-color: #fef2f2;
  color: #b91c1c;
}
.status-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Button */
.submit-button {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(to right, #f97316, #e11d48);
  padding: 12px 16px;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.25);
  transition: all 0.3s;
}
.submit-button:hover {
  box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.4);
}
.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}
.button-hover-effect {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.2);
  opacity: 0;
  transition: opacity 0.3s;
}
.submit-button:hover .button-hover-effect {
  opacity: 1;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer */
.popup-footer {
  border-top: 1px solid #f1f5f9;
  padding: 12px;
  text-align: center;
  background-color: rgba(248, 250, 252, 0.5);
}
.popup-footer p {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
  margin: 0;
}

/* Trigger Button */
.trigger-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fb923c, #e11d48);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.3);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.trigger-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(225, 29, 72, 0.4);
}
.trigger-button:active {
  transform: scale(0.95);
}
.icon-wrapper {
  position: relative;
  width: 50px;
  height: 50px;
}
.icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s;
}
.combined-enter-active,
.combined-leave-active {
  transition: opacity 0.3s ease;
}

.icon.visible {
  opacity: 1;
  transform: translate(-50%, -50%) rotate(0);
}
.icon.hidden {
  opacity: 0;
  transform: translate(-50%, -50%) rotate(90deg);
}
/* Specific tweaks */
.icon-close.hidden {
  transform: translate(-50%, -50%) rotate(-90deg);
}

</style>

