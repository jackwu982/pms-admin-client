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
      <el-table
        v-loading="loading"
        :data="records"
        row-key="id"
        empty-text="暂无上报记录"
        class="report-table"
        :row-class-name="
          ({ row }: { row: PlanOperationReport }) => (row.status === 0 ? 'pending-report' : '')
        ">
        <el-table-column label="上报人 / 时间" width="170">
          <template #default="{ row }">
            <div class="cell-primary">{{ row.reporterName || '未记录姓名' }}</div>
            <div class="cell-secondary tabular">
              {{ dayjsFormat(row.reportTime) || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="产品 / 生产计划" min-width="180">
          <template #default="{ row }">
            <div class="cell-primary wrap-text">{{ row.productName || '未记录产品' }}</div>
            <div class="cell-secondary wrap-text">计划 · {{ row.planNo || `#${row.planId}` }}</div>
          </template>
        </el-table-column>
        <el-table-column label="工序 / 部件" min-width="155">
          <template #default="{ row }">
            <div class="cell-primary wrap-text">
              {{ row.processName || `工序 #${row.planProcessId}` }}
            </div>
            <div class="cell-secondary wrap-text">
              {{ row.partName || `部件 #${row.planPartId}` }}
            </div>
            <span class="process-type">{{ operationType(row.standardFlag) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上报数量" width="150" align="right">
          <template #header>
            <div>上报数量</div>
            <div class="quantity-grid quantity-labels">
              <span>完成</span>
              <span>合格</span>
              <span>不良</span>
            </div>
          </template>
          <template #default="{ row }">
            <div v-if="row.standardFlag !== 0" class="quantity-grid tabular">
              <span>{{ row.reportQty ?? '-' }}</span>
              <span>{{ row.qualifiedQty ?? '-' }}</span>
              <span :class="{ 'defect-count': row.defectQty > 0 }">{{ row.defectQty ?? '-' }}</span>
            </div>
            <span v-else class="cell-secondary">不适用</span>
          </template>
        </el-table-column>
        <el-table-column label="工时" width="95" align="right">
          <template #default="{ row }">
            <div class="hours-value tabular">
              {{ row.workHours }}
              <span class="hours-unit">h</span>
            </div>
            <div class="cell-secondary">
              {{
                row.standardFlag === 1
                  ? '折算工时'
                  : row.standardFlag === 0
                    ? '实际工时'
                    : '上报工时'
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="备注 / 驳回原因" min-width="220">
          <template #default="{ row }">
            <div v-if="row.remark" class="record-note">
              <span class="cell-secondary">备注：</span>
              {{ row.remark }}
            </div>
            <div v-if="row.status === 2 && row.rejectReason" class="record-rejection">
              <span>驳回原因：</span>
              {{ row.rejectReason }}
            </div>
            <span
              v-if="!row.remark && !(row.status === 2 && row.rejectReason)"
              class="cell-secondary">
              —
            </span>
          </template>
        </el-table-column>
        <el-table-column label="审核信息" width="170">
          <template #default="{ row }">
            <template v-if="row.auditTime || row.auditUserId">
              <div class="cell-primary tabular">
                {{ dayjsFormat(row.auditTime) || '未记录时间' }}
              </div>
              <div v-if="row.auditUserId" class="cell-secondary wrap-text">
                审核人 ID · {{ row.auditUserId }}
              </div>
            </template>
            <span v-else class="cell-secondary">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" fixed="right">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="light"
              :type="reportStatuses.find((s) => s.value === row.status)?.type ?? 'info'">
              {{ reportStatuses.find((s) => s.value === row.status)?.label ?? '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核操作" width="112" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button
                link
                type="success"
                :loading="reviewingId === row.id"
                :disabled="reviewingId != null"
                @click="review(row as PlanOperationReport, 'approve')">
                通过
              </el-button>
              <el-button
                link
                type="danger"
                :disabled="reviewingId != null"
                @click="review(row as PlanOperationReport, 'reject')">
                驳回
              </el-button>
            </template>
            <span v-else class="cell-secondary">{{ row.status === 3 ? '不可审核' : '—' }}</span>
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
  import { ElMessage, ElMessageBox } from 'element-plus'
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
  const reviewingId = ref<number>()
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
  async function review(record: PlanOperationReport, action: 'approve' | 'reject') {
    if (reviewingId.value != null || record.status !== 0) return
    const label = action === 'approve' ? '通过' : '驳回'
    let rejectReason: string | undefined
    try {
      if (action === 'reject') {
        const result = await ElMessageBox.prompt(
          `确定驳回上报记录“${record.id}”吗？拒绝理由可选填。`,
          '驳回上报记录',
          {
            type: 'warning',
            inputType: 'textarea',
            inputPlaceholder: '拒绝理由（选填，最多255字）',
            inputValidator: (value: string) => value.length <= 255 || '拒绝理由不能超过255字',
            confirmButtonText: '驳回',
            cancelButtonText: '取消',
          }
        )
        rejectReason = result.value.trim() || undefined
      } else {
        await ElMessageBox.confirm(`确定通过上报记录“${record.id}”吗？`, '通过上报记录', {
          type: 'warning',
          confirmButtonText: '通过',
          cancelButtonText: '取消',
        })
      }
    } catch {
      return
    }
    reviewingId.value = record.id
    try {
      if (action === 'reject') await planOperationReportApi.reject(record.id, rejectReason)
      else await planOperationReportApi.approve(record.id)
      ElMessage.success(`上报记录已${label}`)
      await load()
    } catch {
      // The shared API client displays request errors; reload concurrent cancellations.
      await load()
    } finally {
      reviewingId.value = undefined
    }
  }
  onMounted(load)
</script>

<style scoped>
  .report-table {
    --el-table-header-bg-color: #f5f7fb;
    --el-table-row-hover-bg-color: #f6f9fe;
  }
  .report-table :deep(td.el-table__cell) {
    padding: 13px 0;
    vertical-align: middle;
  }
  .report-table :deep(.pending-report) {
    --el-table-tr-bg-color: #fffdf7;
  }
  .cell-primary {
    color: #25364d;
    font-weight: 500;
    line-height: 22px;
  }
  .cell-secondary {
    margin-top: 3px;
    color: #738094;
    font-size: 12px;
    line-height: 19px;
  }
  .wrap-text {
    overflow-wrap: anywhere;
  }
  .tabular {
    font-variant-numeric: tabular-nums;
  }
  .process-type {
    display: inline-block;
    margin-top: 4px;
    padding: 0 5px;
    background: #f0f3f7;
    border-radius: 3px;
    color: #738094;
    font-size: 11px;
    line-height: 18px;
  }
  .quantity-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .quantity-labels {
    margin-top: 4px;
    font-size: 11px;
    font-weight: 400;
    color: #738094;
  }
  .defect-count {
    color: #b45309;
    font-weight: 600;
  }
  .hours-value {
    color: #245d8b;
    font-size: 15px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .hours-unit {
    margin-left: 3px;
    font-size: 11px;
    font-weight: 400;
    color: #738094;
  }
  .record-note,
  .record-rejection {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    line-height: 21px;
  }
  .record-rejection {
    color: #b4534a;
  }
  .record-note + .record-rejection {
    margin-top: 6px;
  }
</style>
