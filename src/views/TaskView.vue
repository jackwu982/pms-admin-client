<template>
  <div>
    <BaseTableContainer>
      <template #header-left-content>
        <div class="w-90">
          <!-- 30 -->
          <el-segmented v-model="params.published" :options="options" block @change="onSearch" />
        </div>
      </template>
      <template #header-right-content>
        <el-button :icon="Plus" type="primary" @click="openDialog()">新增任务</el-button>
      </template>

      <template #filter-content>
        <BaseSearchForm @search="onSearch" @reset="onReset">
          <template #default>
            <el-form-item label="任务名称">
              <el-input
                v-model="params.name"
                placeholder="请输入任务名称"
                clearable
                class="w-44!" />
            </el-form-item>
          </template>
        </BaseSearchForm>
      </template>

      <template #content>
        <el-table v-loading="loading" :data="tasks" row-key="id" class="mt-3">
          <el-table-column type="expand">
            <template #default="{ row }">
              <ProcessTable :processes="row.processes" @edit="(p) => openEditProcess(row, p)" />
            </template>
          </el-table-column>

          <el-table-column prop="name" label="任务名称" min-width="160" show-overflow-tooltip />
          <el-table-column label="工序数" width="80">
            <template #default="{ row }">{{ row.processes?.length ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <span :class="row.published !== false ? 'text-green-600' : 'text-gray-400'">
                {{ row.published !== false ? '已上架' : '已下架' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="可见部门" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              {{ (row.departments || []).map((d: any) => d.name).join('、') || '全部可见' }}
            </template>
          </el-table-column>
          <el-table-column label="起止日期" width="300">
            <template #default="{ row }">
              {{ row.startDate || '...' }} ~ {{ row.endDate || '...' }}
            </template>
          </el-table-column>
          <el-table-column label="管理人" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              {{ (row.managers || []).map((m: any) => m.nickname).join('、') }}
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="150">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
              <el-button type="primary" link size="small" @click="openCreateProcess(row)">
                新增工序
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <BasePagination
          :total="total"
          v-model:page-num="params.pageNum"
          v-model:page-size="params.pageSize"
          @size-change="loadTasks"
          @current-change="loadTasks" />
      </template>
    </BaseTableContainer>

    <TaskDialog v-if="showDialog" :task="editingTask" @closed="closeDialog" @saved="handleSaved" />

    <ProcessDialog
      v-if="showProcessDialog"
      :task-id="processTaskId"
      :process="editingProcess"
      @closed="closeProcessDialog"
      @saved="handleProcessSaved" />
  </div>
</template>

<script setup lang="ts">
  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BasePagination from '@/components/base/BasePagination.vue'
  import TaskDialog from '@/components/task/TaskDialog.vue'
  import ProcessTable from '@/components/task/ProcessTable.vue'
  import ProcessDialog from '@/components/task/ProcessDialog.vue'

  import { taskApi } from '@/api/task'
  import type { Process, Task } from '@/types/taskType'
  import { Plus } from '@element-plus/icons-vue'
  import { onMounted, reactive, ref } from 'vue'

  interface SearchParams {
    pageNum: number
    pageSize: number
    name: string
    published: boolean | ''
  }

  const params = reactive<SearchParams>({
    pageNum: 1,
    pageSize: 10,
    name: '',
    published: '',
  })
  const options = [
    {
      label: '全部',
      value: '',
    },
    {
      label: '上架中',
      value: true,
    },
    {
      label: '已下架',
      value: false,
    },
  ]

  const tasks = ref<Task[]>([])
  const total = ref(0)
  const loading = ref(false)

  const loadTasks = () => {
    loading.value = true
    const query: Record<string, any> = {
      pageNum: params.pageNum,
      pageSize: params.pageSize,
    }
    if (params.name.trim()) query.name = params.name.trim()
    if (params.published !== '') query.published = params.published

    taskApi
      .list(query)
      .then((res: any) => {
        const { list, total: t } = res.data || {}
        tasks.value = list ?? []
        total.value = t ?? 0
      })
      .finally(() => {
        loading.value = false
      })
  }

  onMounted(loadTasks)

  const onSearch = () => {
    params.pageNum = 1
    loadTasks()
  }

  const onReset = () => {
    params.name = ''
    params.published = ''
    onSearch()
  }

  // create / edit dialog
  const showDialog = ref(false)
  const editingTask = ref<Task | undefined>()

  const openDialog = (task?: any) => {
    editingTask.value = task
    showDialog.value = true
  }

  const closeDialog = () => {
    showDialog.value = false
  }

  const handleSaved = () => {
    showDialog.value = false
    loadTasks()
  }

  // process dialog
  const showProcessDialog = ref(false)
  const processTaskId = ref<number>(0)
  const editingProcess = ref<Process | undefined>()

  const openCreateProcess = (task: any) => {
    processTaskId.value = task.id
    editingProcess.value = undefined
    showProcessDialog.value = true
  }

  const openEditProcess = (task: any, process: Process) => {
    processTaskId.value = task.id
    editingProcess.value = process
    showProcessDialog.value = true
  }

  const closeProcessDialog = () => {
    showProcessDialog.value = false
  }

  const handleProcessSaved = () => {
    showProcessDialog.value = false
    loadTasks()
  }
</script>

<style lang="less" scoped></style>
