<script setup lang="ts">
import config from '~/components/config.vue'

const auth = useCookie('auth')
const route = useRoute()

// 简单的鉴权逻辑，如果没有 auth cookie 则重定向到登录页
if (!auth.value) {
    if (process.client) {
        window.location.href = '/login?redirect=' + encodeURIComponent(route.fullPath)
    } else {
        navigateTo('/login?redirect=' + encodeURIComponent(route.fullPath))
    }
}
</script>

<template>
  <config />
</template>

<style scoped>

</style>