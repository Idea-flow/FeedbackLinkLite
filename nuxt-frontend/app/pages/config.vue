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

const isDirty = computed(() => JSON.stringify(form) !== JSON.stringify(original))

const validate = () => {
  error.value = ''
  if (!form.dingTalk.webhook.trim()) {
    error.value = '钉钉 webhook 必填'
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
    success.value = ''
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
<!--  <div class="bg-red-500">-->
<!--    dagdag-->
<!--  </div>-->

  <div class="min-h-screen bg-slate-50 py-10">
    <div class="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-0">
      <div class="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 p-6 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900">服务配置</h1>
            <p class="text-sm text-slate-600">配置反馈通道与频控策略，实时生效</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span class="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 shadow-sm">
              <svg class="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18"/><path d="M7 12h10"/><path d="M5 19h14"/></svg>
              接口基址：{{ apiBase }}
            </span>
            <span
              class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-white shadow-sm"
              :class="form.enabled ? 'bg-green-500' : 'bg-slate-400'"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path v-if="form.enabled" d="m5 13 4 4L19 7" />
                <path v-else d="M18 6 6 18M6 6l12 12" />
              </svg>
              {{ form.enabled ? '反馈已启用' : '反馈未启用' }}
            </span>
          </div>
        </div>
        <div v-if="error || success || loading" class="flex flex-wrap gap-2 text-sm">
          <div v-if="error" class="flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-red-700">
            <svg class="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0Z"/></svg>
            <span>{{ error }}</span>
          </div>
          <div v-if="success" class="flex items-center gap-2 rounded-md border border-green-100 bg-green-50 px-3 py-2 text-green-700">
            <svg class="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
            <span>{{ success }}</span>
          </div>
          <div v-if="loading" class="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-blue-700">
            <svg class="h-4 w-4 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span>加载中...</span>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-slate-900">反馈开关</p>
                <p class="text-sm text-slate-600">总开关控制是否对外提供反馈能力</p>
              </div>
              <label class="inline-flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" v-model="form.enabled" class="h-4 w-4" />
                {{ form.enabled ? '已启用' : '未启用' }}
              </label>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-lg font-semibold text-slate-900">钉钉配置</p>
                <p class="text-sm text-slate-600">Webhook 必填，Secret 可空（仅在启用签名时使用）</p>
              </div>
              <span class="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">必填：Webhook</span>
            </div>
            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-sm font-medium text-slate-800">Webhook *</label>
                <input
                  v-model="form.dingTalk.webhook"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-colors"
                  placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                />
                <p class="text-xs text-slate-500">使用钉钉机器人提供的完整 webhook 地址</p>
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-slate-800">Secret (可选)</label>
                <input
                  v-model="form.dingTalk.secret"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-colors"
                  placeholder="未启用签名可留空"
                />
                <p class="text-xs text-slate-500">开启签名校验时填写密钥，否则可留空</p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-lg font-semibold text-slate-900">频控</p>
                <p class="text-sm text-slate-600">防止滥用，按分钟限制请求次数</p>
              </div>
              <label class="inline-flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" v-model="form.rateLimit.enabled" class="h-4 w-4" />
                {{ form.rateLimit.enabled ? '已启用' : '未启用' }}
              </label>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-800">每分钟限制次数 *</label>
              <div class="flex items-center gap-3">
                <input
                  type="number"
                  v-model.number="form.rateLimit.limitPerMinute"
                  class="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-colors"
                  min="1"
                />
                <span class="text-xs text-slate-500">需为正整数</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <p class="text-sm font-semibold text-slate-900">操作</p>
            <button
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="saving || loading || !isDirty"
              @click="saveConfig"
            >
              <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <span v-if="saving">保存中...</span>
              <span v-else>保存配置</span>
            </button>
            <button
              class="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="saving || loading"
              @click="resetToServer"
            >
              重置为服务器值
            </button>
            <p class="text-xs text-slate-500">仅当有改动时可保存，保存后以服务器返回值为准。</p>
          </div>

          <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <p class="font-semibold text-slate-900">提示</p>
            <ul class="mt-2 list-disc space-y-1 pl-4">
              <li>Webhook 必填且需为钉钉机器人地址。</li>
              <li>Secret 可留空，启用签名校验时填写机器人提供的密钥。</li>
              <li>频控阈值需为正整数，关闭频控以允许无限制访问。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

