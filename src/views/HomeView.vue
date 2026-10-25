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
        <p class="text-sm text-white/45">生产计划、工时上报、销售单与标准产品管理平台</p>
      </div>
    </div>

    <!-- Feature Cards -->
    <section
      v-for="(group, index) in featureGroups"
      :key="group.title"
      :class="index ? 'mt-8 border-t border-gray-200 pt-8' : ''">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">{{ group.title }}</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          v-for="card in group.cards"
          :key="card.label"
          class="group flex cursor-pointer items-center gap-4 rounded-[14px] border border-gray-100 bg-white px-6 py-5 text-left transition-all duration-250 hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
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
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { localStore } from '@/composables/store'
  import { ArrowRight, OfficeBuilding, User, Tools, ChatDotRound } from '@element-plus/icons-vue'
  import IconWelcome from '@/components/icons/IconWelcome.vue'
  import IconTask from '@/components/icons/IconTask.vue'
  import IconProduct from '@/components/icons/IconProduct.vue'
  import IconOrder from '@/components/icons/IconOrder.vue'

  const router = useRouter()

  const user = localStore.get('user') || {}
  const username = user.nickname || user.username || ''

  const greeting = computed(() => {
    const hour = new Date().getHours()
    const timeGreet = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'
    return username ? `${timeGreet}，${username}` : `${timeGreet}，欢迎回来`
  })

  const featureGroups = [
    {
      title: '业务管理',
      cards: [
        {
          label: '预计产能',
          desc: '按标准工时和人员投入测算生产天数',
          color: '#407ba5',
          icon: IconTask,
          route: '/capacity',
        },
        {
          label: '维修单管理',
          desc: '记录维修工时、故障原因与材料明细',
          color: '#a07849',
          icon: Tools,
          route: '/repair-order',
        },
        {
          label: '设备管理',
          desc: '维护设备、保养周期与负责人',
          color: '#568681',
          icon: Tools,
          route: '/equipment',
        },
        {
          label: '投诉建议',
          desc: '查看员工提交的投诉与建议',
          color: '#9673b1',
          icon: ChatDotRound,
          route: '/feedback',
        },
        {
          label: '生产看板',
          desc: '查看生产计划及各工序进度',
          color: '#297da1',
          icon: IconTask,
          route: '/production-board',
        },
        {
          label: '生产计划',
          desc: '管理生产安排、部件工序与计划人员',
          color: '#16877b',
          icon: IconTask,
          route: '/production-plan',
        },
        {
          label: '上报记录',
          desc: '查询员工完成数量与上报工时',
          color: '#7960be',
          icon: IconTask,
          route: '/plan-operation-report',
        },
        {
          label: '销售单管理',
          desc: '管理销售单及产品信息',
          color: '#ca7a29',
          icon: IconOrder,
          route: '/sale-order',
        },
        {
          label: '标准产品管理',
          desc: '维护标准产品、部件和工序',
          color: '#3978ba',
          icon: IconProduct,
          route: '/product',
        },
      ],
    },
    {
      title: '组织管理',
      cards: [
        {
          label: '部门管理',
          desc: '维护部门组织架构',
          color: '#6670a6',
          icon: OfficeBuilding,
          route: '/department',
        },
        {
          label: '员工管理',
          desc: '管理员工信息与部门归属',
          color: '#ad744a',
          icon: User,
          route: '/user',
        },
      ],
    },
  ]

  const navigateTo = (route: string) => {
    router.push(route)
  }

  const handleLogout = () => {
    router.push({ name: 'logout' })
  }
</script>
