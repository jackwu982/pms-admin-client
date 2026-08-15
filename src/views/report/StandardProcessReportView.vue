<template>
  <div>
    <BaseTableContainer>
      <template #header-left-content>
        <div class="w-210">
          <el-segmented v-model="filterStatus" :options="statusOptions" block @change="search" />
        </div>
      </template>

      <template #filter-content>
        <BaseSearchForm @search="search" @reset="resetSearch">
          <template #default>
            <el-form-item label="员工">
              <el-select
                v-model="filterUserId"
                filterable
                remote
                clearable
                reserve-keyword
                :remote-method="onUserFilter"
                :loading="userLoading"
                placeholder="全部员工"
                class="w-50!">
                <el-option v-for="u in userOptions" :key="u.id" :label="u.nickname" :value="u.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="标准工序">
              <el-select
                v-model="filterStandardProcessId"
                filterable
                remote
                clearable
                reserve-keyword
                :remote-method="onStandardProcessFilter"
                :loading="standardProcessLoading"
                placeholder="全部标准工序"
                class="w-50!">
                <el-option
                  v-for="sp in standardProcessOptions"
                  :key="sp.id"
                  :label="sp.name"
                  :value="sp.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="延时申请">
              <el-select v-model="filterDelayApply" placeholder="全部" class="w-50!">
                <el-option label="全部" value="" />
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </template>
        </BaseSearchForm>
      </template>

      <template #content>
        <el-table v-loading="loading" :data="entries" row-key="id">
          <el-table-column label="员工" min-width="120">
            <template #default="{ row }">{{ row.nickname ?? row.userId ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="标准工序" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ getProcessLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="预计工时" width="100" align="right">
            <template #default="{ row }">{{ row.estimatedHours ?? '-' }}h</template>
          </el-table-column>
          <el-table-column label="实际工时" width="100" align="right">
            <template #default="{ row }">{{ row.actualHours ?? '-' }}h</template>
          </el-table-column>
          <el-table-column label="延时申请" width="90">
            <template #default="{ row }">
              <span :class="row.delayApply ? 'text-yellow-500' : 'text-gray-400'">
                {{ row.delayApply ? '是' : '否' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="驳回原因" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ row.rejectReason || '-' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 1 || row.status === 3"
                type="success"
                link
                size="small"
                @click="handleApprove(row)">
                通过
              </el-button>
              <el-button
                v-if="row.status === 1 || row.status === 3"
                type="danger"
                link
                size="small"
                @click="openReject(row)">
                驳回
              </el-button>
            </template>
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

    <el-dialog
      v-model="showRejectModal"
      title="驳回申报"
      width="480px"
      :close-on-click-modal="false">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        maxlength="200"
        show-word-limit
        placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="showRejectModal = false">取消</el-button>
        <el-button type="danger" :loading="rejecting" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import dayjs from 'dayjs'
  import { ElMessage, ElMessageBox } from 'element-plus'

  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BasePagination from '@/components/base/BasePagination.vue'

  import { declarationApi } from '@/api/declaration'
  import { userApi } from '@/api/user'
  import { standardProcessApi } from '@/api/standardProcess'
  import type { Declaration } from '@/types/declarationType'

  const entries = ref<Declaration[]>([])
  const total = ref(0)
  const loading = ref(false)

  const pageNum = ref(1)
  const pageSize = ref(10)

  const filterStatus = ref<number | ''>('')
  const filterDelayApply = ref<boolean | ''>('')
  const filterUserId = ref<number | ''>('')
  const userOptions = ref<{ id: number; nickname: string }[]>([])
  const userLoading = ref(false)
  const filterStandardProcessId = ref<number | ''>('')
  const standardProcessOptions = ref<{ id: number; name: string }[]>([])
  const standardProcessLoading = ref(false)

  const statusOptions = [
    { label: '全部', value: '' },
    { label: '初审中', value: 1 },
    { label: '初审通过', value: 2 },
    { label: '终审中', value: 3 },
    { label: '终审通过', value: 4 },
    { label: '已驳回', value: 5 },
    { label: '已撤回', value: 6 },
  ]

  const showRejectModal = ref(false)
  const rejectId = ref<number | undefined>()
  const rejectReason = ref('')
  const rejecting = ref(false)

  function getProcessLabel(d: Declaration) {
    const sp = d.standardProcess
    if (!sp) return '未知工序'
    return sp.categoryName ? `【${sp.categoryName}】${sp.name}` : sp.name
  }

  function statusLabel(status?: number) {
    const map: Record<number, string> = {
      1: '初审中',
      2: '初审通过',
      3: '终审中',
      4: '终审通过',
      5: '已驳回',
      6: '已撤回',
    }
    return status ? map[status] || '未知' : '未知'
  }

  function statusTagType(status?: number) {
    const map: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
      1: 'warning',
      2: 'success',
      3: 'primary',
      4: 'success',
      5: 'danger',
      6: 'info',
    }
    return status ? map[status] || 'info' : 'info'
  }

  async function onUserFilter(query: string) {
    userLoading.value = true
    try {
      const kw = query?.trim() || ''
      const res: any = await userApi.list({ pageNum: 1, pageSize: 20, nickname: kw || undefined })
      userOptions.value = res.data?.list ?? []
    } finally {
      userLoading.value = false
    }
  }

  async function onStandardProcessFilter(query: string) {
    standardProcessLoading.value = true
    try {
      const kw = query?.trim() || ''
      const res: any = await standardProcessApi.list({
        pageNum: 1,
        pageSize: 20,
        name: kw || undefined,
      })
      standardProcessOptions.value = res.data?.list ?? []
    } finally {
      standardProcessLoading.value = false
    }
  }

  const loadData = () => {
    loading.value = true
    const params: Record<string, any> = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    }
    if (filterStatus.value !== '') params.status = filterStatus.value
    if (filterDelayApply.value !== '') params.delayApply = filterDelayApply.value
    if (filterUserId.value) params.userId = filterUserId.value
    if (filterStandardProcessId.value) params.standardProcessId = filterStandardProcessId.value

    declarationApi
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
    filterStatus.value = ''
    filterDelayApply.value = ''
    filterUserId.value = ''
    userOptions.value = []
    filterStandardProcessId.value = ''
    standardProcessOptions.value = []
    search()
  }

  async function handleApprove(d: Declaration) {
    try {
      await ElMessageBox.confirm(`确定要通过「${getProcessLabel(d)}」的申报吗？`, '审批确认', {
        confirmButtonText: '通过',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }

    try {
      await declarationApi.approve(d.id!)
      d.status = d.status === 1 ? 2 : 4
      ElMessage.success('审批通过')
    } catch {
      // error toast already shown by the shared axios interceptor
    }
  }

  function openReject(d: Declaration) {
    rejectId.value = d.id
    rejectReason.value = ''
    showRejectModal.value = true
  }

  async function submitReject() {
    if (!rejectReason.value.trim()) {
      ElMessage.warning('请输入驳回原因')
      return
    }

    rejecting.value = true
    try {
      await declarationApi.reject(rejectId.value!, rejectReason.value.trim())
      const item = entries.value.find((e) => e.id === rejectId.value)
      if (item) {
        item.status = 5
        item.rejectReason = rejectReason.value.trim()
      }
      ElMessage.success('已驳回')
      showRejectModal.value = false
    } catch {
      // error toast already shown by the shared axios interceptor
    } finally {
      rejecting.value = false
    }
  }

  const formatDate = (d?: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-')
</script>

<style lang="less" scoped></style>
