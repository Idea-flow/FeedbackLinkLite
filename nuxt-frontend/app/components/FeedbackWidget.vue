<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

// 简易状态枚举与后端保持一致
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
  contact?: string
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
// 运行时可配置接口地址：优先 NUXT_PUBLIC_API_BASE，其次 window.__SL_API_BASE__，默认 /api
const runtimeConfig = useRuntimeConfig()
const apiBase = computed(() => {
  const runtimeBase = (runtimeConfig.public as any)?.apiBase as string | undefined
  const windowBase = typeof window !== 'undefined' ? (window as any).__SL_API_BASE__ : ''
  return (runtimeBase || windowBase || '/api').replace(/\/$/, '')
})
const withBase = (path: string) => `${apiBase.value}${path}`

console.log('apiBase', apiBase.value)

const isOpen = ref(false)
const isHovered = ref(false)
const loading = ref(false)
const config = reactive<FeedbackConfig>({})
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
  if (form.contact && !emailRegex.test(form.contact.trim())) return false // Make contact optional if needed by logic, but UI says required
  // Fix logic: contact is labeled as "邮箱必填" in UI, so enforce it
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
    TOO_FREQUENT: '提交过于频繁，请稍后再试',
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

const fetchConfig = async () => {
  // 配置判断已移除，保留空实现避免接口依赖
  return
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

// Close widget on outside click logic could be added here, but keep it simple for now

onMounted(() => {
  loadDraft()
  fetchConfig()
})
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans text-slate-900">
    <!-- Feedback Panel -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="isOpen"
        class="w-96 origin-bottom-right rounded-2xl bg-white p-0 shadow-2xl ring-1 ring-slate-900/5 focus:outline-none"
        tabindex="-1"
      >
        <!-- Header -->
        <div class="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 p-6 text-white">
          <div class="relative z-10">
            <h3 class="text-lg font-semibold tracking-wide">帮助我们改进</h3>
            <p class="mt-1 text-sm text-white/90">您的反馈是我们前进的动力</p>
          </div>
          <!-- Decorative circle -->
          <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-300/30 blur-2xl"></div>
          <div class="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/20 blur-2xl"></div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-5">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700">
              反馈内容 <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="form.message"
              @input="saveDraft"
              class="w-full resize-none rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all shadow-sm"
              rows="4"
              placeholder="请详细描述您遇到的问题或建议..."
            ></textarea>
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700">
              联系方式 <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="form.contact"
                @input="saveDraft"
                type="email"
                class="w-full rounded-xl border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all shadow-sm"
                placeholder="您的邮箱地址"
              />
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
            </div>
            <p v-if="form.contact && !emailRegex.test(form.contact)" class="text-xs text-rose-500 slide-down mt-1">
              请填写有效的邮箱地址，以便我们联系您
            </p>
          </div>

          <!-- Status Messages -->
          <div v-if="statusTip || error" class="rounded-lg p-3 text-sm" :class="lastResult?.status === Status.SUCCESS ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
            <div class="flex items-center gap-2">
              <svg v-if="lastResult?.status === Status.SUCCESS" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
              <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              <span>{{ statusTip || error }}</span>
            </div>
          </div>

          <!-- Actions -->
          <button
            class="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition-all duration-300 hover:shadow-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            :disabled="!canSubmit"
            @click="submit"
          >
            <div class="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <svg v-if="loading" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span v-else>提交反馈</span>
          </button>
        </div>

        <!-- Footer info -->
        <div class="border-t border-slate-100 p-3 text-center bg-slate-50/50 rounded-b-2xl">
             <p class="text-[10px] text-slate-400 font-medium">Powered by ServiceLinkLite</p>
        </div>
      </div>
    </Transition>

    <!-- Trigger Button -->
    <button
      class="group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-600 text-white shadow-lg shadow-rose-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/40 focus:outline-none focus:ring-4 focus:ring-orange-200 active:scale-95"
      @click="isOpen = !isOpen"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      aria-label="Toggle feedback form"
    >
      <div class="relative">
        <svg
          class="h-7 w-7 transition-all duration-300 transform absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          :class="isOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
        <svg
          class="h-7 w-7 transition-all duration-300 transform absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          :class="isOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </div>
    </button>
  </div>
</template>

<style scoped>
/* Optional: specific transition overrides if Tailwind classes aren't enough */
.slide-down {
  animation: slideDown 0.2s ease-out;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

