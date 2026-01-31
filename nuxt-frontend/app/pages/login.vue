<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const error = ref('')
const route = useRoute()
const router = useRouter()

const login = async () => {
    error.value = ''
    try {
        const runtimeConfig = useRuntimeConfig()
        // 判断是否为开发环境
        let isDev = process.env.NODE_ENV === "development";

        // 动态计算 API 基础路径
        // 1. 开发环境下指向 localhost:4567
        // 2. 浏览器环境下默认使用 /api (相对路径)
        // 3. 服务端渲染时尝试配置或回退
        const apiBase = (() => {
           if (isDev) return 'http://localhost:4567/api'
           if (typeof window !== 'undefined') return '/api'
           const runtimeBase = (runtimeConfig.public as any)?.apiBase as string | undefined
           return (runtimeBase || '/api').replace(/\/$/, '')
        })()

        // 发起登录请求
        const res = await fetch(`${apiBase}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.value, password: password.value })
        })

        // 处理非 200 响应
        if (!res.ok) {
            if (res.status === 401) {
                // 401 表示用户名或密码错误
                throw new Error('用户名或密码错误')
            }
            throw new Error('登录失败')
        }


        // 解析响应 JSON
        const data = await res.json()
        const token = data.token

      console.log('登录成功', data)

        // 设置 auth cookie，用于后续请求鉴权
        // useCookie 是 Nuxt 提供的组合式函数，自动处理 SSR/CSR cookie 同步
        // 设置 7 天有效期
        const auth = useCookie('auth', { maxAge: 60 * 60 * 24 * 7 })
        auth.value = token

        // 获取重定向地址，默认为首页
        const redirect = route.query.redirect as string || '/'
        // 跳转页面
        router.push(redirect)

    } catch (e: any) {
        error.value = e.message || '登录失败'
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    登录系统
                </h2>
            </div>
            <form class="mt-8 space-y-6" @submit.prevent="login">
                <input type="hidden" name="remember" value="true">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label for="username" class="sr-only">用户名</label>
                        <input id="username" name="username" type="text" v-model="username" required
                            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="用户名">
                    </div>
                    <div>
                        <label for="password" class="sr-only">密码</label>
                        <input id="password" name="password" type="password" v-model="password" required
                            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="密码">
                    </div>
                </div>

                <div v-if="error" class="text-red-500 text-sm text-center">
                    {{ error }}
                </div>

                <div>
                    <button type="submit"
                        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        登录
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

