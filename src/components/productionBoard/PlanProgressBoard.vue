<template>
  <section class="dashboard-panel" v-loading="loading">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="m-0 text-base font-semibold">计划进度对比 · 当前页</h2>
      <el-button size="small" :loading="loading" @click="load">刷新</el-button>
    </div>
    <p class="text-xs text-gray-500">
      生产中计划 · 共 {{ total }} 项 · 未配置目标的计划暂不计算进度
    </p>
    <el-alert v-if="failed" title="计划进度加载失败，请刷新重试" type="error" :closable="false" />
    <el-empty v-else-if="!loading && !plans.length" description="暂无生产中计划" />
    <BoardChart v-else :option="charts.progress" description="当前页各生产计划进度" />
    <el-pagination
      v-model:current-page="params.pageNum"
      :page-size="params.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      hide-on-single-page
      @current-change="load" />
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, reactive, onMounted, onUnmounted } from 'vue'
  import { productionBoardApi } from '@/api/productionBoard'
  import type { PlanProgress } from '@/types/productionBoardType'
  import BoardChart from './BoardChart.vue'
  import { planCharts } from '@/utils/boardCharts'
  const charts = computed(() => planCharts(plans.value))
  const plans = ref<PlanProgress[]>([])
  const total = ref(0)
  const loading = ref(false)
  const failed = ref(false)
  const params = reactive({ pageNum: 1, pageSize: 10, planNo: '', productName: '' })
  let request = 0
  async function load() {
    const current = ++request
    loading.value = true
    failed.value = false
    try {
      const res = await productionBoardApi.list({
        ...params,
        planNo: params.planNo.trim() || undefined,
        productName: params.productName.trim() || undefined,
      })
      if (current !== request) return
      plans.value = res.data.list ?? []
      total.value = res.data.total ?? 0
    } catch {
      if (current === request) {
        failed.value = true
        plans.value = []
        total.value = 0
      }
    } finally {
      if (current === request) loading.value = false
    }
  }
  let refreshTimer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    void load()
    refreshTimer = setInterval(() => {
      if (!loading.value && !document.hidden) void load()
    }, 60000)
  })
  onUnmounted(() => {
    clearInterval(refreshTimer)
    request++
  })
</script>
