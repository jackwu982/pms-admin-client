<template>
  <BaseTableContainer>
    <template #header-left-content><h2 class="text-lg font-semibold">工时统计</h2></template>
    <template #header-right-content>
      <el-button :loading="exporting" @click="exportStatistics">
        {{ exporting ? exportProgress : '导出员工、任务、部门统计' }}
      </el-button>
    </template>
    <template #filter-content>
      <BaseSearchForm @search="load" @reset="reset">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            :shortcuts="DATE_SHORTCUTS"
            start-placeholder="开始日期"
            end-placeholder="结束日期" />
        </el-form-item>
      </BaseSearchForm>
      <p class="mt-1 text-xs leading-6 text-gray-500">
        按上报日期统计已通过记录，工时沿用上报时保存的数值。任务对应生产计划，部门按员工当前所属部门归集。
      </p>
    </template>
    <template #content>
      <div v-loading="loading">
        <el-alert
          v-if="failed"
          title="统计加载失败，请重新查询"
          type="error"
          :closable="false"
          class="mb-4!" />
        <div class="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <div v-for="card in cards" :key="card.label" class="rounded-xl bg-gray-50 p-5">
            <div class="text-sm text-gray-500">{{ card.label }}</div>
            <div class="mt-2 text-2xl font-semibold">{{ failed ? '—' : card.value }}</div>
          </div>
        </div>
        <el-tabs v-model="dimension" @tab-change="page = 1">
          <el-tab-pane label="按员工" name="employee" />
          <el-tab-pane label="按任务" name="task" />
          <el-tab-pane label="按部门" name="department" />
        </el-tabs>
        <el-table
          :key="dimension"
          :data="visibleGroups"
          row-key="id"
          empty-text="该时间范围内暂无工时上报记录">
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="px-6 py-3">
                <el-table :data="row.details" size="small" border>
                  <el-table-column
                    v-if="dimension === 'department'"
                    prop="employeeName"
                    label="员工"
                    min-width="120" />
                  <el-table-column
                    v-if="dimension !== 'task'"
                    prop="planNo"
                    label="任务（生产计划）"
                    min-width="160" />
                  <el-table-column prop="productName" label="产品" min-width="160" />
                  <el-table-column prop="partName" label="部件" min-width="150" />
                  <el-table-column prop="processName" label="工序" min-width="150" />
                  <el-table-column prop="reportCount" label="上报次数" width="100" align="right" />
                  <el-table-column label="工时（小时）" width="140" align="right">
                    <template #default="{ row: detail }">{{ formatHours(detail.hours) }}</template>
                  </el-table-column>
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" :label="dimensionLabel" min-width="180" />
          <el-table-column
            v-if="dimension === 'employee'"
            prop="departmentName"
            label="部门"
            min-width="140" />
          <el-table-column v-else prop="employeeCount" label="参与人数" width="100" align="right" />
          <el-table-column
            v-if="dimension !== 'task'"
            prop="taskCount"
            label="涉及任务"
            width="100"
            align="right" />
          <el-table-column prop="reportCount" label="上报次数" width="100" align="right" />
          <el-table-column label="总工时（小时）" width="160" align="right">
            <template #default="{ row }">{{ formatHours(row.hours) }}</template>
          </el-table-column>
          <el-table-column label="工时占比" width="200">
            <template #default="{ row }">
              <el-progress :percentage="row.percent" :stroke-width="6" />
            </template>
          </el-table-column>
        </el-table>
        <BasePagination
          :total="groups.length"
          v-model:page-num="page"
          v-model:page-size="pageSize"
          @size-change="page = 1" />
      </div>
    </template>
  </BaseTableContainer>
</template>
<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { workHourStatisticsApi } from '@/api/workHourStatistics'
  import type { WorkHourRow, WorkHourDimension } from '@/types/workHourStatistics'
  import { groupWorkHours, summarizeWorkHours } from '@/utils/workHourStatistics'
  import { DATE_SHORTCUTS } from '@/util/dateShortcuts'
  const exporting = ref(false)
  const exportProgress = ref('准备导出')
  let disposed = false
  onUnmounted(() => {
    disposed = true
  })
  async function exportStatistics() {
    if (exporting.value) return
    const startDate = dateRange.value?.[0]
    const endDate = dateRange.value?.[1]
    if (startDate && endDate && startDate > endDate) {
      ElMessage.warning('开始日期不能晚于结束日期')
      return
    }
    exporting.value = true
    exportProgress.value = '正在读取数据'
    try {
      const { fetchAllWorkHours, workHourWorkbook } = await import('@/utils/workHourExport')
      const data = await fetchAllWorkHours(
        async (pageNum, pageSize) => {
          if (disposed) throw new Error('页面已关闭')
          const res = await workHourStatisticsApi.listPage({
            startDate,
            endDate,
            pageNum,
            pageSize,
          })
          return res.data
        },
        (loaded, total) => {
          exportProgress.value = `已读取 ${loaded} / ${total}`
        }
      )
      if (disposed) return
      if (!data.length) {
        ElMessage.info('该日期范围内暂无可导出的数据')
        return
      }
      const XLSX = await import('xlsx')
      if (disposed) return
      XLSX.writeFile(
        workHourWorkbook(data, startDate, endDate),
        `工时统计_${startDate || '不限'}_${endDate || '不限'}.xlsx`
      )
      ElMessage.success('已导出三个维度的汇总和明细')
    } catch {
      if (!disposed) ElMessage.error('导出失败，请重试；未生成不完整文件')
    } finally {
      exporting.value = false
    }
  }
  const dateRange = ref<[string, string] | null>(
    DATE_SHORTCUTS.find((s) => s.text === '本周')?.value() ?? null
  )
  const rows = ref<WorkHourRow[]>([]),
    loading = ref(false),
    failed = ref(false)
  const dimension = ref<WorkHourDimension>('employee'),
    page = ref(1),
    pageSize = ref(10)
  const summary = computed(() => summarizeWorkHours(rows.value))
  const formatHours = (value: number) => Number(value).toFixed(3)
  const cards = computed(() => [
    { label: '总工时（小时）', value: formatHours(summary.value.hours) },
    { label: '参与人数', value: summary.value.employees },
    { label: '涉及任务', value: summary.value.tasks },
    { label: '涉及部门', value: summary.value.departments },
  ])
  const groups = computed(() => groupWorkHours(rows.value, dimension.value))
  const visibleGroups = computed(() =>
    groups.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
  )
  const dimensionLabel = computed(
    () => ({ employee: '员工', task: '任务（生产计划）', department: '部门' })[dimension.value]
  )
  let request = 0
  async function load() {
    if (dateRange.value && dateRange.value[0] > dateRange.value[1]) {
      ElMessage.warning('开始日期不能晚于结束日期')
      return
    }
    const current = ++request
    loading.value = true
    failed.value = false
    rows.value = []
    page.value = 1
    try {
      const res = await workHourStatisticsApi.list({
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1],
      })
      if (current === request) rows.value = res.data
    } catch {
      if (current === request) failed.value = true
    } finally {
      if (current === request) loading.value = false
    }
  }
  function reset() {
    dateRange.value = null
    void load()
  }
  onMounted(load)
</script>
<style lang="less" scoped></style>
