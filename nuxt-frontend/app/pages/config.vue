<script setup lang="ts">
import config from '~/components/config.vue'
const auth = useCookie('auth')

// 没有认证时不渲染组件
const hasAuth = computed(() => {
  return !!auth.value
})

</script>

<template>
  <div v-if="hasAuth">
    <config />
  </div>
  <div v-else class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <p class="text-lg font-bold">您没有权限访问此页面</p>
      <NuxtLink to="/login?redirect=config" class="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        请登录
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>

</style>