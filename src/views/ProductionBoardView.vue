<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-xl font-semibold">生产看板</h1>
      <span class="text-xs text-gray-500">数据每分钟自动刷新</span>
    </div>
    <el-tabs v-model="active">
      <el-tab-pane label="生产计划进度" name="plans" />
      <el-tab-pane label="今日上报记录" name="reports" />
      <el-tab-pane label="设备保养提醒" name="maintenance" />
    </el-tabs>
    <PlanProgressBoard v-if="active === 'plans'" />
    <TodayReportsBoard v-else-if="active === 'reports'" />
    <MaintenanceBoard v-else />
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import PlanProgressBoard from '@/components/productionBoard/PlanProgressBoard.vue'
  import TodayReportsBoard from '@/components/productionBoard/TodayReportsBoard.vue'
  import MaintenanceBoard from '@/components/productionBoard/MaintenanceBoard.vue'
  const active = ref('plans')
</script>
