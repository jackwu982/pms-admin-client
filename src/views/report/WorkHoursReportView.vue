<template>
  <div>
    <BaseTableContainer>
      <template #header-right-content>
        <el-button :loading="exporting" @click="exportData">导出</el-button>
      </template>

      <template #filter-content>
        <BaseSearchForm @search="search" @reset="resetSearch">
          <template #default>
            <el-form-item label="员工">
              <el-select
                v-model="filterEmpId"
                filterable
                remote
                clearable
                reserve-keyword
                :remote-method="onEmpFilter"
                :loading="empLoading"
                placeholder="全部员工"
                class="w-48!">
                <el-option v-for="e in empOptions" :key="e.id" :label="e.nickname" :value="e.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="任务">
              <el-select
                v-model="filterTaskId"
                filterable
                remote
                clearable
                reserve-keyword
                :remote-method="onTaskFilter"
                :loading="taskLoading"
                placeholder="全部任务"
                class="w-48!">
                <el-option v-for="t in taskOptions" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="filterDateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                :shortcuts="DATE_SHORTCUTS"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                class="w-56!"
                @change="onDateChange" />
            </el-form-item>
          </template>
        </BaseSearchForm>
      </template>

      <template #content>
        <el-table v-loading="loading" :data="entries" row-key="id">
          <el-table-column prop="nickname" label="员工" min-width="120" />
          <el-table-column prop="taskName" label="任务" min-width="140" show-overflow-tooltip />
          <el-table-column prop="processName" label="工序" min-width="140" show-overflow-tooltip />
          <el-table-column label="工时" width="90">
            <template #default="{ row }">{{ row.hours }}h</template>
          </el-table-column>
          <el-table-column label="备注" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.remark || '-' }}</template>
          </el-table-column>
          <el-table-column label="日期" width="120">
            <template #default="{ row }">{{ row.date || '-' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
          </el-table-column>
        </el-table>

        <BasePagination
          :total="total"
          v-model:page-num="pageNum"
          v-model:page-size="pageSize"
          @size-change="loadData"
          @current-change="loadData" />
      </template>
    </BaseTableContainer>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import dayjs from 'dayjs'
  import * as XLSX from 'xlsx'

  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BasePagination from '@/components/base/BasePagination.vue'

  import { timeEntryApi } from '@/api/timeEntry'
  import { userApi } from '@/api/user'
  import { taskApi } from '@/api/task'
  import type { TimeEntry } from '@/types/timeEntryType'

  import { DATE_SHORTCUTS } from '@/util/dateShortcuts'

  const entries = ref<TimeEntry[]>([])
  const total = ref(0)
  const loading = ref(false)
  const exporting = ref(false)

  const pageNum = ref(1)
  const pageSize = ref(10)

  // filters
  const filterEmpId = ref<number | ''>('')
  const empOptions = ref<{ id: number; nickname: string }[]>([])
  const empLoading = ref(false)

  const filterTaskId = ref<number | ''>('')
  const taskOptions = ref<{ id: number; name: string }[]>([])
  const taskLoading = ref(false)

  const filterDateRange = ref<[string, string] | null>(null)

  function onDateChange() {
    search()
  }

  async function onEmpFilter(query: string) {
    empLoading.value = true
    try {
      const kw = query?.trim() || ''
      const res: any = await userApi.list({ pageNum: 1, pageSize: 20, nickname: kw || undefined })
      empOptions.value = res.data?.list ?? []
    } finally {
      empLoading.value = false
    }
  }

  async function onTaskFilter(query: string) {
    taskLoading.value = true
    try {
      const kw = query?.trim() || ''
      const res: any = await taskApi.list({ pageNum: 1, pageSize: 20, name: kw || undefined })
      taskOptions.value = res.data?.list ?? []
    } finally {
      taskLoading.value = false
    }
  }

  const loadData = () => {
    loading.value = true
    const params: Record<string, any> = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    }
    if (filterEmpId.value) params.userId = filterEmpId.value
    if (filterTaskId.value) params.taskId = filterTaskId.value
    if (filterDateRange.value?.[0]) params.startDate = filterDateRange.value[0]
    if (filterDateRange.value?.[1]) params.endDate = filterDateRange.value[1]

    timeEntryApi
      .list(params)
      .then((res: any) => {
        const { list, total: t } = res.data || {}
        entries.value = list ?? []
        total.value = t ?? 0
      })
      .finally(() => {
        loading.value = false
      })
  }

  onMounted(loadData)

  const search = () => {
    pageNum.value = 1
    loadData()
  }

  const resetSearch = () => {
    filterEmpId.value = ''
    empOptions.value = []
    filterTaskId.value = ''
    taskOptions.value = []
    filterDateRange.value = null
    search()
  }

  const formatDate = (d?: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-')

  async function exportData() {
    exporting.value = true
    try {
      const exportPageSize = 500
      const baseParams: Record<string, any> = { pageSize: exportPageSize }
      if (filterEmpId.value) baseParams.userId = filterEmpId.value
      if (filterTaskId.value) baseParams.taskId = filterTaskId.value
      if (filterDateRange.value?.[0]) baseParams.startDate = filterDateRange.value[0]
      if (filterDateRange.value?.[1]) baseParams.endDate = filterDateRange.value[1]

      const all: TimeEntry[] = []
      let p = 1
      let hasMore = true
      while (hasMore) {
        const res: any = await timeEntryApi.list({ ...baseParams, pageNum: p })
        const list = res.data?.list ?? []
        all.push(...list)
        hasMore = list.length === exportPageSize
        p++
      }

      const rows = all.map((e) => ({
        员工: e.nickname || '',
        任务: e.taskName || '',
        工序: e.processName || '',
        工时: e.hours ?? 0,
        备注: e.remark || '',
        日期: e.date || '',
        创建时间: formatDate(e.createTime),
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '全局上报')
      XLSX.writeFile(wb, `全局上报_${dayjs().format('YYYYMMDD')}.xlsx`)
    } finally {
      exporting.value = false
    }
  }
</script>

<style lang="less" scoped></style>
