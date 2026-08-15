<template>
  <div>
    <BaseTableContainer>
      <template #header-left-content>
        <div class="w-90">
          <el-segmented v-model="publishedFilter" :options="options" block @change="onSearch" />
        </div>
      </template>

      <template #header-right-content>
        <el-button :icon="Plus" type="primary" @click="openDialog()"> 新增工序 </el-button>
      </template>

      <template #filter-content>
        <BaseSearchForm @search="onSearch" @reset="onReset">
          <template #default>
            <el-form-item label="名称">
              <el-input v-model="name" placeholder="请输入工序名称" clearable class="w-44!" />
            </el-form-item>
            <el-form-item label="分类">
              <el-select
                v-model="categoryId"
                filterable
                remote
                clearable
                reserve-keyword
                :remote-method="onCategoryFilter"
                :loading="categoryLoading"
                placeholder="全部"
                class="w-50!">
                <el-option v-for="c in categoryOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </template>
        </BaseSearchForm>
      </template>

      <template #content>
        <el-table v-loading="loading" :data="processes" row-key="id" class="mt-3">
          <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
          <el-table-column label="所属分类" min-width="120">
            <template #default="{ row }">{{ row.category.name }}</template>
          </el-table-column>
          <el-table-column label="标准工时(h)" width="110">
            <template #default="{ row }">{{ row.standardHours ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="工序要求" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description || '-' }}</template>
          </el-table-column>
          <el-table-column label="发布状态" width="100">
            <template #default="{ row }">
              <span :class="row.published ? 'text-green-600' : 'text-gray-400'">
                {{ row.published ? '已发布' : '未发布' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ dayjsFormat(row.createTime) || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="120">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <BasePagination
          :total="total"
          v-model:page-num="pageNum"
          v-model:page-size="pageSize"
          @size-change="loadProcesses"
          @current-change="loadProcesses" />
      </template>
    </BaseTableContainer>

    <StandardProcessDialog
      v-if="showDialog"
      :process="editingProcess"
      @closed="closeDialog"
      @saved="handleSaved" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useDayjs } from '@/util/dayjs'

  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BasePagination from '@/components/base/BasePagination.vue'
  import StandardProcessDialog from '@/components/process/StandardProcessDialog.vue'

  import { standardProcessApi } from '@/api/standardProcess'
  import { categoryApi } from '@/api/category'

  import type { StandardProcess } from '@/types/standardProcessType'
  import { Plus } from '@element-plus/icons-vue'

  const { dayjsFormat } = useDayjs()

  const processes = ref<StandardProcess[]>([])
  const total = ref(0)
  const loading = ref(false)
  const publishedFilter = ref<boolean | ''>('')
  const name = ref('')
  const categoryId = ref<number | ''>('')
  const categoryOptions = ref<{ id: number; name: string }[]>([])
  const categoryLoading = ref(false)
  const pageNum = ref(1)
  const pageSize = ref(10)

  const options = [
    { label: '全部', value: '' },
    { label: '已发布', value: true },
    { label: '未发布', value: false },
  ]

  const loadProcesses = () => {
    loading.value = true
    const query: Record<string, any> = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    }
    if (name.value.trim()) query.name = name.value.trim()
    if (categoryId.value) query.categoryId = categoryId.value
    if (publishedFilter.value !== '') query.published = publishedFilter.value

    standardProcessApi
      .list(query)
      .then((res: any) => {
        const { list, total: t } = res.data || {}
        processes.value = list ?? []
        total.value = t ?? 0
      })
      .finally(() => {
        loading.value = false
      })
  }

  const onCategoryFilter = async (query: string) => {
    categoryLoading.value = true
    try {
      const kw = query?.trim() || ''
      const res: any = await categoryApi.list({ pageNum: 1, pageSize: 20, name: kw || undefined })
      categoryOptions.value = (res.data?.list ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
      }))
    } finally {
      categoryLoading.value = false
    }
  }

  onMounted(() => {
    loadProcesses()
  })

  const onSearch = () => {
    pageNum.value = 1
    loadProcesses()
  }

  const onReset = () => {
    name.value = ''
    categoryId.value = ''
    publishedFilter.value = ''
    onSearch()
  }

  // create / edit dialog
  const showDialog = ref(false)
  const editingProcess = ref<StandardProcess | undefined>()

  const openDialog = (process?: any) => {
    editingProcess.value = process
    showDialog.value = true
  }

  const closeDialog = () => {
    showDialog.value = false
  }

  const handleSaved = () => {
    showDialog.value = false
    loadProcesses()
  }

  const handleDelete = async (process: any) => {
    try {
      await ElMessageBox.confirm(`确定要删除工序「${process.name}」吗？`, '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }

    try {
      await standardProcessApi.delete(String(process.id))
      ElMessage.success('删除成功')
      loadProcesses()
    } catch {
      // error toast already shown by the shared axios interceptor
    }
  }
</script>

<style lang="less" scoped></style>
