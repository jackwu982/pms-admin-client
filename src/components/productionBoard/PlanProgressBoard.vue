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
        <div v-if="!failed && plans.length" class="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div class="min-w-0 rounded-xl border border-gray-200 p-4">
            <h3 class="text-sm font-semibold">计划进度对比 · 当前页</h3>
            <BoardChart
              :option="charts.progress"
              description="当前页各生产计划进度，未配置目标的计划不计为零进度" />
          </div>
          <div class="min-w-0 rounded-xl border border-gray-200 p-4">
            <h3 class="text-sm font-semibold">计划状态分布 · 当前页</h3>
            <BoardChart
              :option="charts.status"
              description="当前页已达目标、进行中和待配置目标的计划数量" />
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
          <div class="mb-4 rounded-lg bg-gray-50 p-4">
            <div class="mb-2 flex flex-wrap justify-between gap-2 text-sm">
              <span>计划总进度</span>
              <span>
                已达目标 {{ plan.completedOperations }} / {{ plan.operations.length }} 道工序
              </span>
            </div>
            <el-progress
              v-if="plan.progress != null"
              :percentage="Number(plan.progress)"
              :stroke-width="12" />
            <div v-else class="text-sm text-amber-600">
              {{
                plan.operations.length
                  ? `${plan.missingTargets} 道工序未配置有效目标`
                  : '暂无启用工序'
              }}
            </div>
          </div>
          <el-table :data="plan.operations" row-key="id" empty-text="暂无启用工序">
            <el-table-column
              prop="productName"
              label="所属产品"
              min-width="150"
              show-overflow-tooltip />
            <el-table-column prop="partName" label="部件" min-width="130" show-overflow-tooltip />
            <el-table-column
              prop="processName"
              label="工序"
              min-width="140"
              show-overflow-tooltip />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                {{ row.standardFlag === 1 ? '标准工序' : '非标准工序' }}
              </template>
            </el-table-column>
            <el-table-column label="累计完成 / 计划目标" min-width="190">
              <template #default="{ row }">
                {{ row.actual }} / {{ row.target > 0 ? row.target : '未配置' }}
                {{ row.standardFlag === 1 ? '件（合格）' : '小时' }}
              </template>
            </el-table-column>
            <el-table-column label="工序进度" min-width="220">
              <template #default="{ row }">
                <el-progress
                  v-if="row.progress != null"
                  :percentage="Number(row.progress)"
                  :status="row.progress >= 100 ? 'success' : undefined" />
                <span v-else class="text-amber-600">待配置目标</span>
              </template>
            </el-table-column>
          </el-table>
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
