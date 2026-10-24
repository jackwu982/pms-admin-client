<template>
  <BaseTableContainer>
    <template #header-left-content><span class="font-semibold">上报记录</span></template>
    <template #header-right-content>
      <el-button :loading="loading" @click="load">刷新</el-button>
    </template>
    <template #filter-content>
      <BaseSearchForm @search="search" @reset="reset">
        <el-form-item label="计划编号">
          <el-input v-model="params.planNo" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="上报人">
          <el-input v-model="params.reporterName" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" :empty-values="[null, undefined]" class="w-32!">
            <el-option label="全部" value="" />
            <el-option
              v-for="item in reportStatuses"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
      </BaseSearchForm>
    </template>
    <template #content>
      <el-button v-if="failed" link type="primary" @click="load">记录加载失败，点击重试</el-button>
      <el-table v-loading="loading" :data="records" row-key="id" empty-text="暂无上报记录">
        <el-table-column type="expand">
          <template #default="{ row }">
            <el-descriptions :column="2" border class="m-4">
              <el-descriptions-item label="工序类型">
                {{ operationType(row.standardFlag) }}
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">
                {{ row.remark || '无' }}
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </el-table-column>
        <el-table-column prop="reporterName" label="上报人" min-width="100" />
        <el-table-column label="上报时间" min-width="170">
          <template #default="{ row }">{{ dayjsFormat(row.reportTime) || '-' }}</template>
        </el-table-column>
        <el-table-column label="生产计划" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.planNo || `计划 #${row.planId}` }}</template>
        </el-table-column>
        <el-table-column prop="productName" label="产品" min-width="140" show-overflow-tooltip />
        <el-table-column label="部件" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.partName || `部件 #${row.planPartId}` }}</template>
        </el-table-column>
        <el-table-column label="工序" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.processName || `工序 #${row.planProcessId}` }}
          </template>
        </el-table-column>
        <el-table-column label="完成数量" width="100" align="right">
          <template #default="{ row }">{{ row.standardFlag === 0 ? '-' : row.reportQty }}</template>
        </el-table-column>
        <el-table-column label="合格数量" width="100" align="right">
          <template #default="{ row }">
            {{ row.standardFlag === 0 ? '-' : row.qualifiedQty }}
          </template>
        </el-table-column>
        <el-table-column label="不良数量" width="100" align="right">
          <template #default="{ row }">{{ row.standardFlag === 0 ? '-' : row.defectQty }}</template>
        </el-table-column>
        <el-table-column prop="workHours" label="工时（小时）" width="120" align="right" />
        <el-table-column label="状态" width="100" fixed="right">
          <template #default="{ row }">
            <el-tag :type="reportStatuses.find((s) => s.value === row.status)?.type ?? 'info'">
              {{ reportStatuses.find((s) => s.value === row.status)?.label ?? '未知' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
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
  import { onMounted, reactive, ref } from 'vue'
  import { planOperationReportApi } from '@/api/planOperationReport'
  import { reportStatuses, type PlanOperationReport } from '@/types/planOperationReportType'
  import { useDayjs } from '@/util/dayjs'

  const { dayjsFormat } = useDayjs()
  const params = reactive({
    pageNum: 1,
    pageSize: 10,
    planNo: '',
    reporterName: '',
    status: '' as number | '',
  })
  const records = ref<PlanOperationReport[]>([])
  const total = ref(0)
  const loading = ref(false)
  const failed = ref(false)
  let request = 0
  async function load() {
    const current = ++request
    loading.value = true
    failed.value = false
    try {
      const res = await planOperationReportApi.list({
        ...params,
        planNo: params.planNo.trim() || undefined,
        reporterName: params.reporterName.trim() || undefined,
        status: params.status === '' ? undefined : params.status,
      })
      if (current !== request) return
      records.value = res.data.list ?? []
      total.value = res.data.total ?? 0
    } catch {
      if (current === request) {
        records.value = []
        total.value = 0
        failed.value = true
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
    Object.assign(params, { planNo: '', reporterName: '', status: '' })
    search()
  }
  function operationType(flag?: number) {
    return flag === 1 ? '标准工序' : flag === 0 ? '非标准工序' : '未知'
  }
  onMounted(load)
</script>
