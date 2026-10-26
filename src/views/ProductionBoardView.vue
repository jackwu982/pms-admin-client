<template>
  <div ref="board" class="production-dashboard" :class="{ 'is-fullscreen': fullscreen }">
    <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="m-0 text-xl font-semibold">生产看板</h1>
        <p class="mt-1 mb-0 text-xs text-gray-500">数据每分钟自动刷新</p>
      </div>
      <el-button @click="toggleFullscreen">{{ fullscreen ? '退出全屏' : '全屏展示' }}</el-button>
    </header>
    <div class="overview-grid">
      <PlanProgressBoard />
      <MaintenanceBoard />
    </div>
    <TodayReportsBoard class="mt-4" />
  </div>
</template>
<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import PlanProgressBoard from '@/components/productionBoard/PlanProgressBoard.vue'
  import TodayReportsBoard from '@/components/productionBoard/TodayReportsBoard.vue'
  import MaintenanceBoard from '@/components/productionBoard/MaintenanceBoard.vue'
  const board = ref<HTMLElement>()
  const fullscreen = ref(false)
  const syncFullscreen = () => {
    fullscreen.value = document.fullscreenElement === board.value
  }
  async function toggleFullscreen() {
    try {
      if (fullscreen.value) await document.exitFullscreen()
      else await board.value?.requestFullscreen()
    } catch {
      ElMessage.warning('无法进入全屏，请使用支持全屏的浏览器重试')
    }
  }
  onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
  onUnmounted(() => document.removeEventListener('fullscreenchange', syncFullscreen))
</script>
<style scoped lang="less">
  .production-dashboard {
    --board-chart-height: 280px;
    background: #f5f7fa;
    padding: 16px;
    border-radius: 12px;
  }
  .production-dashboard.is-fullscreen {
    --board-chart-height: clamp(200px, calc((100vh - 330px) / 2), 480px);
    width: 100%;
    height: 100%;
    overflow: auto;
    border-radius: 0;
    padding: 20px;
  }
  .overview-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  :deep(.dashboard-panel) {
    min-width: 0;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
  }
  :deep(.board-chart) {
    height: var(--board-chart-height) !important;
  }
  @media (max-width: 900px) {
    .overview-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
