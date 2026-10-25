<template>
  <BaseTableContainer>
    <template #header-left-content>
      <span class="text-lg font-semibold">生产看板</span>
      <span class="ml-3 text-sm text-gray-500">生产中计划 · 共 {{ total }} 项</span>
    </template>
    <template #header-right-content>
      <el-button :loading="loading" @click="load">刷新进度</el-button>
    </template>
    <template #filter-content>
      <BaseSearchForm @search="search" @reset="reset">
        <el-form-item label="计划编号">
          <el-input v-model="params.planNo" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="params.productName" clearable @keyup.enter="search" />
        </el-form-item>
      </BaseSearchForm>
      <p class="text-xs leading-5 text-gray-500">
        标准工序按合格数量、非标准工序按上报工时计算，仅统计已通过上报和启用部件/工序。计划进度为各工序进度的平均值，每道工序最高计
        100%；未配置目标时暂不计算计划总进度。
      </p>
    </template>
    <template #content>
      <div v-loading="loading" class="min-h-40">
        <el-alert v-if="failed" title="看板加载失败" type="error" :closable="false" show-icon>
          <el-button link @click="load">点击重试</el-button>
        </el-alert>
        <el-empty v-else-if="!loading && !plans.length" description="暂无符合条件的生产中计划" />
        <div v-if="!failed && plans.length" class="mb-5">
          <div class="min-w-0 rounded-xl border border-gray-200 p-4">
            <h3 class="text-sm font-semibold">计划进度对比 · 当前页</h3>
            <BoardChart
              :option="charts.progress"
              description="当前页各生产计划进度，未配置目标的计划不计为零进度" />
          </div>
        </div>
        <section
          v-for="plan in plans"
          :key="plan.id"
          class="mb-5 rounded-xl border border-gray-200 p-5">
          <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="m-0 text-lg font-semibold">{{ plan.productName }}</h2>
              <div class="mt-2 text-sm text-gray-500">
                {{ plan.planNo }} · {{ plan.planStart || '未设置开始日期' }} ~
                {{ plan.planEnd || '未设置结束日期' }}
              </div>
            </div>
            <el-tag type="primary">生产中</el-tag>
          </div>
          <div
            class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-4 text-sm">
            <span>
              计划整体进度：
              <strong>{{ plan.progress == null ? '待配置目标' : `${plan.progress}%` }}</strong>
            </span>
            <span>
              已达目标 {{ plan.completedOperations }} / {{ plan.operations.length }} 道工序
            </span>
          </div>
          <el-empty v-if="!plan.operations.length" description="暂无启用工序" />
          <template v-else>
            <p class="text-xs text-gray-500">
              每条横柱代表一道工序；蓝色为进行中，绿色为已达目标。悬停可查看产品、部件、工序及完成数量或工时。
            </p>
            <div class="overflow-x-auto">
              <div class="min-w-[800px]">
                <BoardChart
                  :option="operationProgressChart(plan)"
                  :height="Math.max(300, Math.min(plan.operations.length, 8) * 76 + 90)"
                  :description="`${plan.planNo} 各工序进度，包含产品、部件、工序、累计完成和计划目标`" />
              </div>
            </div>
          </template>
        </section>
      </div>
      <BasePagination
        v-model:page-num="params.pageNum"
        v-model:page-size="params.pageSize"
        :total="total"
        @current-change="load"
        @size-change="search" />
    </template>
  </BaseTableContainer>
</template>
<script setup lang="ts">
  import { computed, ref, reactive, onMounted, onUnmounted } from 'vue'
  import { productionBoardApi } from '@/api/productionBoard'
  import type { PlanProgress } from '@/types/productionBoardType'
  import BoardChart from './BoardChart.vue'
  import { planCharts, operationProgressChart } from '@/utils/boardCharts'
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
  function search() {
    params.pageNum = 1
    void load()
  }
  function reset() {
    params.planNo = ''
    params.productName = ''
    search()
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
