<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

interface DingTalkConfig {
  webhook: string
  secret: string
}

interface RateLimitConfig {
  enabled: boolean
  limitPerMinute: number
}

interface FeedbackConfig {
  enabled: boolean
  dingTalk: DingTalkConfig
  rateLimit: RateLimitConfig
}

const runtimeConfig = useRuntimeConfig()
const apiBase = computed(() => {
  const runtimeBase = (runtimeConfig.public as any)?.apiBase as string | undefined
  const windowBase = typeof window !== 'undefined' ? (window as any).__SL_API_BASE__ : ''
  return (runtimeBase || windowBase || '/api').replace(/\/$/, '')
})
const withBase = (path: string) => `${apiBase.value}${path}`

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive<FeedbackConfig>({
  enabled: true,
  dingTalk: { webhook: '', secret: '' },
  rateLimit: { enabled: true, limitPerMinute: 10 }
})
const original = reactive<FeedbackConfig>({
  enabled: true,
  dingTalk: { webhook: '', secret: '' },
  rateLimit: { enabled: true, limitPerMinute: 10 }
})

const validate = () => {
  error.value = ''
  if (!form.dingTalk.webhook.trim()) {
    error.value = '钉钉 webhook 必填'
    return false
  }
  if (!form.dingTalk.secret.trim()) {
    error.value = '钉钉 secret 必填'
    return false
  }
  if (form.rateLimit.limitPerMinute <= 0) {
    error.value = '频控阈值需为正整数'
    return false
  }
  return true
}

const loadConfig = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(withBase('/config'))
    if (!res.ok) throw new Error('load config failed')
    const data = await res.json()
    Object.assign(form, data)
    Object.assign(original, JSON.parse(JSON.stringify(data)))
  } catch (e: any) {
    error.value = '加载配置失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

const resetToServer = () => {
  Object.assign(form, JSON.parse(JSON.stringify(original)))
  success.value = ''
  error.value = ''
}

const saveConfig = async () => {
  if (!validate()) return
  saving.value = true
  success.value = ''
  error.value = ''
  try {
    const res = await fetch(withBase('/config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (!res.ok) throw new Error('save failed')
    const data = await res.json()
    Object.assign(original, JSON.parse(JSON.stringify(data)))
    success.value = '保存成功'
  } catch (e: any) {
    error.value = '保存失败，请稍后再试'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  2132143
  25
  <div class="min-h-screen bg-gray-50 py-10">
    <div class="mx-auto max-w-3xl bg-white shadow rounded-lg p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">服务配置</h1>
          <p class="text-sm text-gray-500">配置后端反馈相关参数</p>
        </div>
        <div class="text-sm text-gray-500">接口基址：{{ apiBase }}</div>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700">反馈开关</label>
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.enabled" class="h-4 w-4" /> 启用反馈
        </label>
      </div>

      <div class="space-y-3">
        <div class="text-lg font-semibold">钉钉配置</div>
        <div class="space-y-1">
          <label class="text-sm text-gray-600">Webhook *</label>
          <input v-model="form.dingTalk.webhook" class="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring" />
        </div>
        <div class="space-y-1">
          <label class="text-sm text-gray-600">Secret *</label>
          <input v-model="form.dingTalk.secret" class="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring" />
        </div>
      </div>

      <div class="space-y-3">
        <div class="text-lg font-semibold">频控</div>
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.rateLimit.enabled" class="h-4 w-4" /> 启用频控
        </label>
        <div class="space-y-1">
          <label class="text-sm text-gray-600">每分钟限制次数 *</label>
          <input
            type="number"
            v-model.number="form.rateLimit.limitPerMinute"
            class="w-40 rounded border px-3 py-2 text-sm focus:outline-none focus:ring"
            min="1"
          />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="rounded bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50"
          :disabled="saving || loading"
          @click="saveConfig"
        >
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
        <button class="text-sm text-gray-600 underline" @click="resetToServer">重置为服务器值</button>
        <div v-if="loading" class="text-sm text-gray-500">加载中...</div>
        <div v-if="success" class="text-sm text-green-600">{{ success }}</div>
        <div v-if="error" class="text-sm text-red-600">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

