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
    <TodayReportsBoard />
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
    display: grid;
    grid-template-rows: auto minmax(250px, 1fr) minmax(250px, 1fr);
    gap: 16px;
    height: calc(100dvh - 40px);
    min-height: 660px;
    box-sizing: border-box;
    background: #f5f7fa;
    padding: 16px;
    border-radius: 12px;
  }
  .production-dashboard.is-fullscreen {
    width: 100%;
    height: 100%;
    overflow: auto;
    border-radius: 0;
    padding: 20px;
  }
  .production-dashboard > header {
    margin-bottom: 0;
  }
  .overview-grid {
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  :deep(.dashboard-panel) {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
  }
  :deep(.board-chart) {
    flex: 1;
    min-height: 0;
    height: 0 !important;
  }
  :deep(.dashboard-panel > :not(.board-chart):not(.report-scroll):not(.el-empty)) {
    flex-shrink: 0;
  }
  :deep(.today-board) {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  :deep(.today-grid) {
    flex: 1;
    min-height: 0;
  }
  :deep(.report-scroll) {
    flex: 1;
    min-height: 0;
    height: 0;
  }
  @media (max-width: 900px) {
    .production-dashboard {
      height: auto;
      grid-template-rows: auto auto auto;
    }
    .overview-grid {
      grid-template-columns: 1fr;
    }
    :deep(.board-chart),
    :deep(.report-scroll) {
      flex: none;
      height: 280px !important;
    }
  }
</style>
