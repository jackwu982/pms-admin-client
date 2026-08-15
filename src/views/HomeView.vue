<template>
  <div class="mx-auto max-w-240 px-6 py-10 pb-15">
    <!-- Hero Section -->
    <div
      class="relative mb-10 overflow-hidden rounded-[20px] p-10! pl-12!"
      style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)">
      <!-- glow -->
      <div
        class="pointer-events-none absolute -top-20 -right-15 h-65 w-65 rounded-full"
        style="
          background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
        "></div>

      <div class="relative z-1">
        <el-icon :size="64" class="mt-6"><IconWelcome /></el-icon>
        <h1 class="mb-3 text-[32px] font-bold tracking-[-0.5px] text-white">{{ greeting }}</h1>
        <p class="mb-1.5 text-base text-white/70">欢迎使用PMS平台</p>
        <p class="text-sm text-white/45">高效管理 项目</p>
      </div>
    </div>

    <!-- Feature Cards -->
    <div class="mb-8 grid grid-cols-4 gap-5">
      <div
        v-for="card in featureCards"
        :key="card.label"
        class="group flex cursor-pointer items-center gap-4 rounded-[14px] border border-gray-100 bg-white px-6 py-5 transition-all duration-250 hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
        @click="navigateTo(card.route)">
        <div
          class="flex h-11 w-11 min-w-11 items-center justify-center rounded-xl text-white"
          :style="{ background: card.color }">
          <component :is="card.icon" class="h-5.5" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="mb-1 block font-semibold text-gray-800">{{ card.label }}</span>
          <span class="block text-xs text-gray-400">{{ card.desc }}</span>
        </div>
        <el-icon
          class="-translate-x-2 text-gray-300 opacity-0 transition-all duration-250 group-hover:translate-x-0 group-hover:opacity-100">
          <ArrowRight />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { localStore } from '@/composables/store'
  import { ArrowRight, User } from '@element-plus/icons-vue'
  import IconWelcome from '@/components/icons/IconWelcome.vue'

  const router = useRouter()

  const user = localStore.get('user') || {}
  const username = user.name || user.username || ''

  const greeting = computed(() => {
    const hour = new Date().getHours()
    const timeGreet = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'
    return username ? `${timeGreet}，${username}` : `${timeGreet}，欢迎回来`
  })

  const featureCards = [
    {
      label: '用户管理',
      desc: '管理平台用户与权限',
      color: 'linear-gradient(135deg, #f5af19, #f12711)',
      icon: User,
      route: '/user',
    },
  ]

  const navigateTo = (route: string) => {
    router.push(route)
  }
</script>
