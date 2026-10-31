<template>
  <section class="dashboard-panel" v-loading="loading">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="m-0 text-base font-semibold">设备保养提醒</h2>
      <el-button size="small" :loading="loading" @click="load">刷新</el-button>
    </div>
    <p class="text-xs text-gray-500">
      <span class="text-red-600">已逾期 {{ overdue }}</span>
      ·
      <span class="text-amber-600">7 天内到期 {{ upcoming }}</span>
      · 保养信息待完善 {{ incomplete }} · 负数表示逾期
    </p>
    <el-alert v-if="failed" title="保养提醒加载失败，请刷新重试" type="error" :closable="false" />
    <el-empty v-else-if="!loading && !rows.length" description="暂无需要提醒的设备" />
    <BoardChart
      v-else
      :option="charts.due"
      description="设备距保养到期的剩余天数，负数表示逾期；缺失保养信息计入待完善数量" />
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { productionBoardApi, type MaintenanceReminder } from '@/api/productionBoard'
  import BoardChart from './BoardChart.vue'
  import { maintenanceCharts } from '@/utils/boardCharts'
  const charts = computed(() => maintenanceCharts(rows.value))
  const rows = ref<MaintenanceReminder[]>([]),
    date = ref(''),
    loading = ref(false),
    failed = ref(false)
  const overdue = computed(
    () => rows.value.filter((r) => r.remainingDays != null && r.remainingDays < 0).length
  )
  const upcoming = computed(
    () => rows.value.filter((r) => r.remainingDays != null && r.remainingDays >= 0).length
  )
  const incomplete = computed(() => rows.value.filter((r) => r.remainingDays == null).length)
  let request = 0
  let timer: ReturnType<typeof setInterval> | undefined
  async function load() {
    const current = ++request
    loading.value = true
    try {
      const res = await productionBoardApi.maintenanceReminders()
      if (current === request) {
        rows.value = res.data.list
        date.value = res.data.date
        failed.value = false
      }
    } catch {
      if (current === request) {
        failed.value = true
        rows.value = []
      }
    } finally {
      if (current === request) loading.value = false
    }
  }
  onMounted(() => {
    void load()
    timer = setInterval(() => {
      if (!loading.value && !document.hidden) void load()
    }, 60000)
  })
  onUnmounted(() => {
    request++
    clearInterval(timer)
  })
</script>
