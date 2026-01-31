<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

interface DingTalkConfig {
  webhook: string
  secret: string
}

interface RateLimitConfig {
  enabled: boolean
  maxRequests: number
}

interface AuthConfig {
  username?: string
  password?: string
  token?: string
}

interface FeedbackConfig {
  enabled: boolean
  dingTalk: DingTalkConfig
  rateLimit: RateLimitConfig
  auth?: AuthConfig
}

const runtimeConfig = useRuntimeConfig()
let isDev = process.env.NODE_ENV === "development";

const apiBase = computed(() => {


  if (isDev){
    console.log('config-isDev-http://localhost:4567/api')
    return 'http://localhost:4567/api'
  }else {
    console.log('config-is-online')
  }

  // 在客户端环境下，根据当前域名动态生成 API 地址
  if (typeof window !== 'undefined') {
    // 其他情况下默认使用相对路径 /api
    return '/api'
  }

  
  // 在服务端渲染时使用运行时配置
  const runtimeBase = (runtimeConfig.public as any)?.apiBase as string | undefined
  const windowBase = typeof window !== 'undefined' ? (window as any).__SL_API_BASE__ : ''
  return (runtimeBase || windowBase || '/api').replace(/\/$/, '')
})
const withBase = (path: string) => `${apiBase.value}${path}`

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const toastMessage = ref('')
const toastVisible = ref(false)
const toastTimer = ref<number | null>(null)

// 新增显示Toast的方法
const showToast = (message: string) => {
  toastMessage.value = message
  toastVisible.value = true

  if (toastTimer.value) {
    clearTimeout(toastTimer.value)
  }

  toastTimer.value = window.setTimeout(() => {
    toastVisible.value = false
    toastMessage.value = ''
    toastTimer.value = null
  }, 2800)
}

const form = reactive<FeedbackConfig>({
  enabled: true,
  dingTalk: { webhook: '', secret: '' },
  rateLimit: { enabled: true, maxRequests: 10 },
  auth: { username: '', password: '', token: '' }
})
const original = reactive<FeedbackConfig>({
  enabled: true,
  dingTalk: { webhook: '', secret: '' },
  rateLimit: { enabled: true, maxRequests: 10 },
  auth: { username: '', password: '', token: '' }
})

const isDirty = computed(() => JSON.stringify(form) !== JSON.stringify(original))

const validate = () => {
  error.value = ''
  if (!form.dingTalk.webhook.trim()) {
    error.value = '钉钉 webhook 必填'
    return false
  }
  if (form.rateLimit.maxRequests <= 0) {
    error.value = '频控阈值需为正整数'
    return false
  }
  if (form.auth) {
    if (!form.auth.username?.trim()) {
        error.value = '用户名不能为空'
        return false
    }
    if (!form.auth.password?.trim()) {
        error.value = '密码不能为空'
        return false
    }
    if (!form.auth.token?.trim()) {
        error.value = 'Token 不能为空'
        return false
    }
  }
  return true
}

const loadConfig = async () => {
  loading.value = true
  error.value = ''
  try {
    // 跨域请求必须携带凭证 (credentials: 'include') 才能发送 Cookie
    const res = await fetch(withBase('/config'), {
      credentials: 'include'
    })

    // 拦截 401 未授权
    if (res.status === 401) {
       // 清除cookie并跳转
       const auth = useCookie('auth')
       auth.value = null
       window.location.href = '/login'
       return
    }

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
  error.value = ''
}

const saveConfig = async () => {
  if (!validate()) return
  saving.value = true
  error.value = ''
  try {
    const res = await fetch(withBase('/config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
      credentials: 'include' // 允许发送 Cookie
    })

    // 拦截 401 未授权
    if (res.status === 401) {
       const auth = useCookie('auth')
       auth.value = null
       window.location.href = '/login'
       return
    }

    if (!res.ok) throw new Error('save failed')
    const data = await res.json()
    Object.assign(original, JSON.parse(JSON.stringify(data)))
    showToast('保存成功')
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
                <p class="text-sm text-slate-600">防止滥用，在时间窗口内限制最大请求数</p>
              </div>
              <label class="inline-flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" v-model="form.rateLimit.enabled" class="h-4 w-4" />
                {{ form.rateLimit.enabled ? '已启用' : '未启用' }}
              </label>
            </div>
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-800">时间窗口内最大请求数 *</label>
                <div class="flex items-center gap-3">
                  <input
                      type="number"
                      v-model.number="form.rateLimit.maxRequests"
                      class="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-colors"
                      min="1"
                  />
                  <span class="text-xs text-slate-500">需为正整数</span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-800">时间窗口（分钟）</label>
                <div class="flex items-center gap-3">
                  <input
                      type="number"
                      :value="form.rateLimit.windowMinutes"
                      class="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-colors bg-slate-100"
                      readonly
                  />
                  <span class="text-xs text-slate-500">只读，不可修改</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 账户安全设置 -->
          <div v-if="form.auth" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-lg font-semibold text-slate-900">账户安全</p>
                <p class="text-sm text-slate-600">修改登录后台的用户名、密码及鉴权 Token</p>
              </div>
              <span class="rounded-full border border-yellow-100 bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">修改后需重新登录</span>
            </div>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-sm font-medium text-slate-800">用户名 *</label>
                    <input
                        v-model="form.auth.username"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-colors"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-sm font-medium text-slate-800">密码 *</label>
                    <input
                        v-model="form.auth.password"
                        type="text"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-colors"
                    />
                  </div>
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-slate-800">鉴权 Token *</label>
                <input
                    v-model="form.auth.token"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition-colors"
                />
                <p class="text-xs text-slate-500">修改 Token 会导致当前会话失效，下次请求需要重新登录。</p>
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

    <!-- 保存成功提示 -->
    <Transition name="toast-fade">
      <div
          v-if="toastVisible && toastMessage"
          class="fixed top-6 right-6 flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-green-700 shadow-lg ring-1 ring-green-100 backdrop-blur-sm bg-white/80"
          style="z-index: 9999"
      >
        <svg class="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
