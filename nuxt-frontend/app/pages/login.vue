<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const error = ref('')
const route = useRoute()
const router = useRouter()

// 引入手绘风格字体
// useHead({
//   link: [
//     { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
//     { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
//     { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap' }
//   ]
// })

const login = async () => {
    error.value = ''
    try {
        const runtimeConfig = useRuntimeConfig()
        let isDev = process.env.NODE_ENV === "development";

        const apiBase = (() => {
           if (isDev) return 'http://localhost:4567/api'
           if (typeof window !== 'undefined') return '/api'
           const runtimeBase = (runtimeConfig.public as any)?.apiBase as string | undefined
           return (runtimeBase || '/api').replace(/\/$/, '')
        })()

        const res = await fetch(`${apiBase}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.value, password: password.value })
        })

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('用户名或密码错误')
            }
            throw new Error('登录失败')
        }

        const data = await res.json()
        const token = data.token

        const auth = useCookie('auth', { maxAge: 60 * 60 * 24 * 7 })
        auth.value = token

        const redirect = route.query.redirect as string || '/'
        router.push(redirect)

    } catch (e: any) {
        error.value = e.message || '登录失败'
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-[#fdfbf7] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-hand">
        <!-- 背景装饰 -->
        <div class="absolute inset-0 z-0 opacity-10"
             style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;">
        </div>

        <!-- 装饰性涂鸦 -->
        <div class="absolute top-10 left-10 w-24 h-24 border-4 border-black rounded-full opacity-20 transform -rotate-12 pointer-events-none hidden md:block"></div>
        <div class="absolute bottom-10 right-10 w-32 h-16 border-4 border-black border-dashed opacity-20 transform rotate-6 pointer-events-none hidden md:block"></div>

        <div class="max-w-md w-full space-y-8 z-10">
            <!-- 卡片容器 -->
            <div class="bg-white border-4 border-black p-10 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform transition-transform hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] card-shape">
                <!-- 顶部图钉装饰 -->
                <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-20"></div>

                <div class="text-center">
                    <h2 class="mt-2 text-4xl font-extrabold text-gray-900 tracking-wider transform -rotate-2">
                        登录系统
                    </h2>
                    <p class="mt-2 text-sm text-gray-600 font-bold">
                        Welcome back! Please login.
                    </p>
                </div>

                <form class="mt-8 space-y-6" @submit.prevent="login">
                    <input type="hidden" name="remember" value="true">
                    <div class="space-y-4">
                        <div class="relative group">
                            <label for="username" class="block text-sm font-bold text-gray-700 mb-1 ml-1" style="transform: rotate(-1deg);">用户名</label>
                            <input id="username" name="username" type="text" v-model="username" required
                                class="appearance-none block w-full px-4 py-3 border-2 border-black placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-0 focus:border-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white transform group-hover:rotate-1"
                                style="border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;"
                                placeholder="输入您的用户名">
                        </div>
                        <div class="relative group">
                            <label for="password" class="block text-sm font-bold text-gray-700 mb-1 ml-1" style="transform: rotate(1deg);">密码</label>
                            <input id="password" name="password" type="password" v-model="password" required
                                class="appearance-none block w-full px-4 py-3 border-2 border-black placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-0 focus:border-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white transform group-hover:-rotate-1"
                                style="border-radius: 225px 15px 255px 15px / 15px 255px 15px 225px;"
                                placeholder="输入您的密码">
                        </div>
                    </div>

                    <div v-if="error" class="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-2 rounded relative transform rotate-1" role="alert">
                        <strong class="font-bold">Oops! </strong>
                        <span class="block sm:inline">{{ error }}</span>
                    </div>

                    <div>
                        <button type="submit"
                            class="group relative w-full flex justify-center py-3 px-4 border-2 border-black text-xl font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-0 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-x-1.5 active:translate-y-1.5 transform overflow-hidden">
                            <span class="relative z-10 group-hover:scale-110 transition-transform">即刻登录</span>
                            <!-- 按钮内部纹理 -->
                            <div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')]"></div>
                        </button>
                    </div>
                </form>
            </div>

            <p class="text-center text-xs text-slate-500 font-bold opacity-60">
                ServiceLink Lite &copy; 2026
            </p>
        </div>
    </div>
</template>

<style scoped>
.font-hand {
    font-family: 'Patrick Hand', cursive, sans-serif;
}

.card-shape {
    border-radius: 2px 20px 5px 25px;
}

/* 输入框聚焦时的晃动动画 */
input:focus {
    animation: wiggle 0.5s ease-in-out;
}

@keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-1deg); }
    75% { transform: rotate(1deg); }
}
</style>

