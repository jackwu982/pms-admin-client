<template>
  <BaseTableContainer>
    <template #header-left-content>
      <span class="text-lg font-semibold">报表 · 计划与工序进度</span>
    </template>
    <template #header-right-content>
      <el-button :loading="loading" @click="load">刷新</el-button>
    </template>
    <template #filter-content>
      <BaseSearchForm @search="search" @reset="reset">
        <el-form-item label="计划编号">
          <el-input v-model="params.planNo" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="params.productName" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" clearable placeholder="全部" class="w-36!">
            <el-option
              v-for="(label, value) in planStatuses"
              :key="value"
              :value="value"
              :label="label" />
          </el-select>
        </el-form-item>
      </BaseSearchForm>
      <p class="text-xs leading-5 text-gray-500">
        整体进度为启用工序进度的平均值，每道工序最高计
        100%。标准工序按合格数量、非标准工序按已通过上报工时计算。无启用工序或目标未配置完整时，暂不计算整体进度。
        展开计划可查看产品下各部件、工序的累计完成情况。
      </p>
    </template>
    <template #content>
      <div v-loading="loading">
        <el-alert
          v-if="failed"
          title="报表加载失败，请刷新重试"
          type="error"
          :closable="false"
          class="mb-4!" />
        <div v-if="rows.length" class="mb-4 rounded-xl border border-gray-200 p-4">
          <h3 class="text-sm font-semibold">计划整体进度对比 · 当前页</h3>
          <BoardChart :option="chart.progress" description="当前页生产计划整体进度对比" />
        </div>
        <el-table :data="rows" row-key="id" empty-text="暂无符合条件的生产计划">
          <el-table-column type="expand">
            <template #default="{ row: plan }">
              <section class="bg-gray-50 px-5 py-4">
                <h3 class="mt-0 text-base font-semibold">{{ plan.planNo }} · 产品工序进度</h3>
                <el-empty v-if="!plan.operations.length" description="暂无启用工序" />
                <template v-else>
                  <div class="mb-4 overflow-x-auto rounded-xl border border-gray-200 bg-white p-4">
                    <div class="min-w-[800px]">
                      <BoardChart
                        :option="operationProgressChart(plan as PlanProgress)"
                        :height="Math.max(260, Math.min(plan.operations.length, 8) * 65 + 70)"
                        :description="`${plan.planNo} 各产品部件下的工序进度与累计完成量`" />
                    </div>
                  </div>
                  <el-table :data="plan.operations" row-key="id">
                    <el-table-column prop="productName" label="产品" min-width="160" />
                    <el-table-column prop="partName" label="部件" min-width="160" />
                    <el-table-column prop="processName" label="工序" min-width="180" />
                    <el-table-column label="类型" width="110">
                      <template #default="{ row }">
                        {{ row.standardFlag === 1 ? '标准工序' : '非标准工序' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="累计完成 / 计划目标" min-width="210">
                      <template #default="{ row }">
                        {{ row.actual }} /
                        {{ row.target != null && row.target > 0 ? row.target : '未配置' }}
                        {{ row.standardFlag === 1 ? '件（合格）' : '小时' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="工序整体进度" min-width="200">
                      <template #default="{ row }">
                        <el-progress
                          v-if="row.progress != null"
                          :percentage="Number(row.progress)"
                          :status="Number(row.progress) >= 100 ? 'success' : undefined" />
                        <span v-else class="text-amber-600">待配置目标</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </template>
              </section>
            </template>
          </el-table-column>
          <el-table-column prop="planNo" label="计划编号" min-width="150" />
          <el-table-column
            prop="productName"
            label="产品名称"
            min-width="200"
            show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">{{ planStatuses[row.status] ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="计划日期" min-width="220">
            <template #default="{ row }">
              {{ row.planStart || '未设置' }} ~ {{ row.planEnd || '未设置' }}
            </template>
          </el-table-column>
          <el-table-column label="整体进度" min-width="200">
            <template #default="{ row }">
              <el-progress
                v-if="row.progress != null"
                :percentage="Number(row.progress)"
                :status="Number(row.progress) >= 100 ? 'success' : undefined" />
              <span v-else class="text-gray-400">
                {{ row.operations.length ? '待配置目标' : '暂无启用工序' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="已达目标 / 启用工序" width="180">
            <template #default="{ row }">
              {{ row.completedOperations }} / {{ row.operations.length }}
            </template>
          </el-table-column>
          <el-table-column prop="missingTargets" label="未配置目标工序" width="150" />
        </el-table>
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
  import { computed, reactive, ref, onMounted, onUnmounted } from 'vue'
  import { productionBoardApi } from '@/api/productionBoard'
  import type { PlanProgress } from '@/types/productionBoardType'
  import { planStatuses } from '@/types/productionPlanType'
  import { planCharts, operationProgressChart } from '@/utils/boardCharts'
  import BoardChart from '@/components/productionBoard/BoardChart.vue'
  const params = reactive({
    pageNum: 1,
    pageSize: 10,
    planNo: '',
    productName: '',
    status: undefined as number | undefined,
  })
  const rows = ref<PlanProgress[]>([])
  const total = ref(0)
  const loading = ref(false)
  const failed = ref(false)
  const chart = computed(() => planCharts(rows.value))
  let request = 0
  async function load() {
    const current = ++request
    loading.value = true
    failed.value = false
    try {
      const res = await productionBoardApi.report({
        ...params,
        planNo: params.planNo.trim() || undefined,
        productName: params.productName.trim() || undefined,
        status: params.status === 0 ? 0 : params.status || undefined,
      })
      if (current !== request) return
      rows.value = res.data.list ?? []
      total.value = res.data.total ?? 0
    } catch {
      if (current === request) {
        failed.value = true
        rows.value = []
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
    params.status = undefined
    search()
  }
  onMounted(load)
  onUnmounted(() => {
    request++
  })
</script>
