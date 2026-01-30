<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

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

onMounted(() => {
  loadDraft()
  fetchConfig()
})
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50">
    <button
      class="rounded-full bg-blue-600 text-white px-4 py-2 shadow-lg hover:bg-blue-700 transition"
      @click="isOpen = !isOpen"
    >
      {{ isOpen ? '关闭反馈' : '我要反馈' }}
    </button>

    <div
      v-if="isOpen"
      class="mt-3 w-80 rounded-xl border border-gray-200 bg-white shadow-xl p-4 space-y-3"
    >
      <div class="text-lg font-semibold">问题反馈</div>
      <div class="space-y-1">
        <label class="text-sm text-gray-600">反馈内容 *</label>
        <textarea
          v-model="form.message"
          @input="saveDraft"
          class="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring"
          rows="3"
          placeholder="请描述遇到的问题"
        ></textarea>
      </div>
      <div class="space-y-1">
        <label class="text-sm text-gray-600">联系方式（邮箱必填）</label>
        <input
          v-model="form.contact"
          @input="saveDraft"
          class="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring"
          placeholder="请输入邮箱"
        />
        <p v-if="form.contact && !emailRegex.test(form.contact)" class="text-xs text-red-600">请填写有效邮箱地址</p>
      </div>

      <div class="space-y-2">
        <button
          class="w-full rounded bg-blue-600 text-white py-2 text-sm disabled:opacity-50"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ loading ? '提交中...' : '提交反馈' }}
        </button>
        <div v-if="statusTip" class="text-sm" :class="lastResult?.status === Status.SUCCESS ? 'text-green-600' : 'text-red-600'">
          {{ statusTip }}
        </div>
        <div v-if="error" class="text-sm text-red-600">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

