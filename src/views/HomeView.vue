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

      <div class="absolute top-6 right-6 z-2">
        <el-button
          text
          class="text-white/70 transition-colors hover:text-white"
          @click="handleLogout">
          退出登录
        </el-button>
      </div>

      <div class="relative z-1">
        <el-icon :size="64" class="mt-6"><IconWelcome /></el-icon>
        <h1 class="mb-3 text-[32px] font-bold tracking-[-0.5px] text-white">{{ greeting }}</h1>
        <p class="mb-1.5 text-base text-white/70">欢迎使用PMS平台</p>
        <p class="text-sm text-white/45">项目任务、标准工序、工时上报与统计一体化管理平台</p>
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
  import { ArrowRight, OfficeBuilding, User } from '@element-plus/icons-vue'
  import IconWelcome from '@/components/icons/IconWelcome.vue'
  import IconTask from '@/components/icons/IconTask.vue'
  import IconModel from '@/components/icons/IconModel.vue'
  import IconStatistics from '@/components/icons/IconStatistics.vue'
  import IconOrder from '@/components/icons/IconOrder.vue'

  const router = useRouter()

  const user = localStore.get('user') || {}
  const username = user.nickname || user.username || ''

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
    {
      label: '部门管理',
      desc: '管理部门组织架构',
      color: 'linear-gradient(135deg, #667eea, #764ba2)',
      icon: OfficeBuilding,
      route: '/department',
    },
    {
      label: '任务管理',
      desc: '管理项目任务与工序',
      color: 'linear-gradient(135deg, #11998e, #38ef7d)',
      icon: IconTask,
      route: '/task',
    },
    {
      label: '工序管理',
      desc: '管理分类与标准工序',
      color: 'linear-gradient(135deg, #fc4a1a, #f7b733)',
      icon: IconModel,
      route: '/process-category',
    },
    {
      label: '工时统计',
      desc: '工时数据多维统计',
      color: 'linear-gradient(135deg, #36d1dc, #5b86e5)',
      icon: IconStatistics,
      route: '/statistics',
    },
    {
      label: '上报记录',
      desc: '查看员工上报记录',
      color: 'linear-gradient(135deg, #c471f5, #fa71cd)',
      icon: IconOrder,
      route: '/report-hours',
    },
  ]

  const navigateTo = (route: string) => {
    router.push(route)
  }

  const handleLogout = () => {
    router.push({ name: 'logout' })
  }
</script>
