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

// 引入手绘风格字体
// useHead({
//   link: [
//     { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
//     { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
//     { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap' }
//   ]
// })

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
  <div class="min-h-screen bg-[#fdfbf7] py-10 font-hand relative overflow-hidden">
     <!-- 背景装饰 -->
    <div class="absolute inset-0 z-0 opacity-10"
         style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;">
    </div>

    <!-- 装饰性元素 -->
    <div class="absolute top-20 right-20 w-32 h-32 border-4 border-black rounded-full opacity-10 pointer-events-none hidden lg:block"></div>
    <div class="absolute bottom-40 left-10 w-20 h-20 border-4 border-black transform rotate-45 opacity-10 pointer-events-none hidden lg:block"></div>

    <div class="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-0 relative z-10">

      <!-- 顶部 Header 卡片 -->
      <div class="flex flex-col gap-4 rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 tracking-wide">服务配置</h1>
            <p class="text-lg text-gray-600 font-bold mt-1">配置面板</p>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-sm font-bold">
            <span class="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-blue-100 px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18"/><path d="M7 12h10"/><path d="M5 19h14"/></svg>
              API 基础地址: {{ apiBase }}
            </span>
            <span
                class="inline-flex items-center gap-2 rounded-lg border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                :class="form.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path v-if="form.enabled" d="m5 13 4 4L19 7" />
                <path v-else d="M18 6 6 18M6 6l12 12" />
              </svg>
              {{ form.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
        </div>

        <!-- 全局状态提示 -->
        <div v-if="error || success || loading" class="flex flex-wrap gap-3 font-bold">
          <div v-if="error" class="flex items-center gap-2 rounded-lg border-2 border-black bg-red-100 px-4 py-2 text-red-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0Z"/></svg>
            <span>{{ error }}</span>
          </div>
          <div v-if="loading" class="flex items-center gap-2 rounded-lg border-2 border-black bg-blue-100 px-4 py-2 text-blue-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span>加载中...</span>
          </div>
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-3">
        <!-- 左侧配置区域 -->
        <div class="space-y-8 lg:col-span-2">

          <!-- 反馈开关 -->
          <div class="rounded-xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-200">
            <div class="absolute -right-6 -top-6 w-20 h-20 bg-yellow-200 rounded-full border-2 border-black opacity-50 group-hover:scale-110 transition-transform"></div>

            <div class="flex items-center justify-between relative z-10">
              <div>
                <p class="text-xl font-bold text-gray-900">系统状态</p>
                <p class="text-base text-gray-600 font-bold mt-1">接收反馈?</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer select-none">
                <input type="checkbox" v-model="form.enabled" class="sr-only peer">
                <div class="w-14 h-8 bg-gray-200 peer-focus:outline-none border-2 border-black rounded-full peer peer-checked:bg-green-400 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
                <div class="absolute left-1 top-1 bg-white border-2 border-black rounded-full h-6 w-6 transition-all peer-checked:translate-x-6"></div>
              </label>
            </div>
          </div>

          <!-- 钉钉配置 -->
          <div class="rounded-xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div class="flex items-center justify-between border-b-2 border-dashed border-gray-200 pb-4">
              <div>
                <p class="text-xl font-bold text-gray-900">钉钉集成</p>
                <p class="text-base text-gray-600 font-bold mt-1">配置您的机器人</p>
              </div>
              <span class="rounded-lg border-2 border-black bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">需要 Webhook</span>
            </div>
            <div class="space-y-5">
              <div class="space-y-2 group">
                <label class="text-base font-bold text-gray-800 ml-1 block group-hover:-translate-y-0.5 transition-transform">Webhook URL *</label>
                <input
                    v-model="form.dingTalk.webhook"
                    class="w-full rounded-lg border-2 border-black px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-gray-50 focus:bg-white"
                    placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                />
              </div>
              <div class="space-y-2 group">
                <label class="text-base font-bold text-gray-800 ml-1 block group-hover:-translate-y-0.5 transition-transform">密钥 (可选)</label>
                <input
                    v-model="form.dingTalk.secret"
                    class="w-full rounded-lg border-2 border-black px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-gray-50 focus:bg-white"
                    placeholder="Leave empty if signing is disabled"
                />
              </div>
            </div>
          </div>

          <!-- 频控配置 -->
          <div class="rounded-xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xl font-bold text-gray-900">频率限制</p>
                <p class="text-base text-gray-600 font-bold mt-1">防止滥用</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer select-none">
                <input type="checkbox" v-model="form.rateLimit.enabled" class="sr-only peer">
                <div class="w-12 h-7 bg-gray-200 peer-focus:outline-none border-2 border-black rounded-full peer peer-checked:bg-blue-400 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
                <div class="absolute left-1 top-1 bg-white border-2 border-black rounded-full h-5 w-5 transition-all peer-checked:translate-x-5"></div>
              </label>
            </div>

            <div class="p-4 bg-gray-50 border-2 border-black rounded-lg space-y-4 border-dashed">
              <div class="space-y-2">
                <label class="text-sm font-bold text-gray-800">最大请求数</label>
                <div class="flex items-center gap-3">
                  <input
                      type="number"
                      v-model.number="form.rateLimit.maxRequests"
                      class="w-full md:w-48 rounded-lg border-2 border-black px-3 py-2 text-gray-900 focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                      min="1"
                  />
                  <span class="text-sm font-bold text-gray-500">每时间窗口</span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-bold text-gray-800">时间窗口 (分钟)</label>
                <div class="flex items-center gap-3">
                  <input
                      type="number"
                      :value="form.rateLimit.windowMinutes"
                      class="w-full md:w-48 rounded-lg border-2 border-gray-300 px-3 py-2 text-gray-500 bg-gray-100 cursor-not-allowed font-bold"
                      readonly
                  />
                  <span class="text-sm font-bold text-gray-400">固定</span>
                </div>
              </div>
            </div>
          </div>

           <!-- 账户安全设置 -->
          <div v-if="form.auth" class="rounded-xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xl font-bold text-gray-900">安全设置</p>
                <p class="text-base text-gray-600 font-bold mt-1">管理员凭据</p>
              </div>
              <span class="rounded-lg border-2 border-black bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">需要重新登录</span>
            </div>
            <div class="space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="space-y-2 group">
                    <label class="text-base font-bold text-gray-800 ml-1">用户名 *</label>
                    <input
                        v-model="form.auth.username"
                        class="w-full rounded-lg border-2 border-black px-4 py-3 text-base focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  </div>
                  <div class="space-y-2 group">
                    <label class="text-base font-bold text-gray-800 ml-1">密码 *</label>
                    <input
                        v-model="form.auth.password"
                        type="text"
                        class="w-full rounded-lg border-2 border-black px-4 py-3 text-base focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  </div>
              </div>
              <div class="space-y-2 group">
                <label class="text-base font-bold text-gray-800 ml-1">认证令牌 *</label>
                <input
                    v-model="form.auth.token"
                    class="w-full rounded-lg border-2 border-black px-4 py-3 text-base text-gray-600 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
                <p class="text-sm font-bold text-gray-500 mt-1">⚠️ 更改此选项会使当前会话失效。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧操作栏 -->
        <div class="space-y-8">
          <div class="rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4 sticky top-6">
            <p class="text-xl font-bold text-gray-900 border-b-2 border-black pb-2">操作</p>

            <button
                class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-blue-500 px-6 py-3 text-lg font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-blue-400 hover:-translate-y-0.5 active:translate-y-0 active:translate-x-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="saving || loading || !isDirty"
                @click="saveConfig"
            >
              <svg v-if="saving" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <span v-if="saving">保存中...</span>
              <span v-else>保存更改</span>
            </button>

            <button
                class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-6 py-3 text-lg font-bold text-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0 active:translate-x-0.5 active:shadow-none disabled:opacity-50"
                :disabled="saving || loading"
                @click="resetToServer"
            >
              重置
            </button>

            <div class="p-3 bg-blue-50 border-2 border-black rounded-lg mt-4">
              <p class="text-xs font-bold text-blue-800 leading-relaxed text-center">
                更改将在保存后立即生效。
              </p>
            </div>
          </div>

          <div class="rounded-xl border-4 border-black border-dashed bg-transparent p-6 text-sm font-bold text-gray-600">
            <p class="text-lg text-black mb-2">💡 使用技巧</p>
            <ul class="list-disc space-y-2 pl-4 marker:text-black">
              <li>Webhooks 必须以 https:// 开头</li>
              <li>密钥仅用于签名请求</li>
              <li>频率限制每小时重置</li>
              <li>请妥善保管您的令牌！</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast-pop">
      <div
          v-if="toastVisible && toastMessage"
          class="fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-lg border-4 border-black bg-green-100 px-6 py-4 text-green-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <div class="bg-green-500 rounded-full p-1 border-2 border-black text-white">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
        </div>
        <span class="font-bold text-lg">{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.font-hand {
    font-family: 'Patrick Hand', cursive, sans-serif;
}

/* Toast Animation */
.toast-pop-enter-active {
  animation: bg-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}
.toast-pop-leave-active {
  animation: bg-out 0.3s ease-in both;
}

@keyframes bg-in {
  0% { transform: translateY(-100px) rotate(-5deg); opacity: 0; }
  100% { transform: translateY(0) rotate(0deg); opacity: 1; }
}

@keyframes bg-out {
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(100px); opacity: 0; }
}

/* Input Shake/Wiggle on focus (optional enhancement) */
input:focus {
    animation: wiggle 0.4s ease-in-out;
}

@keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-0.5deg); }
    75% { transform: rotate(0.5deg); }
}
</style>
