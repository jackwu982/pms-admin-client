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
                class="w-50!" />
            </el-form-item>
          </template>
        </BaseSearchForm>
      </template>

      <template #content>
        <el-table v-loading="loading" :data="taskRows" row-key="id" class="mt-3">
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="px-6 py-3">
                <el-table
                  :data="row.subTasks"
                  row-key="id"
                  size="small"
                  empty-text="暂无子任务，请点击任务右侧的新增子任务">
                  <el-table-column type="expand">
                    <template #default="{ row: subTask }">
                      <ProcessTable
                        :processes="subTask.processes"
                        @edit="(p) => openEditProcess(row as Task, p)" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="name" label="子任务名称" min-width="160" />
                  <el-table-column label="工序数" width="80">
                    <template #default="{ row: subTask }">{{ subTask.processes.length }}</template>
                  </el-table-column>
                  <el-table-column label="负责人" min-width="140">
                    <template #default="{ row: subTask }">{{
                      (subTask.managers || []).map((m: Manager) => m.nickname).join('、') || '-'
                    }}</template>
                  </el-table-column>
                  <el-table-column label="起止日期" min-width="220">
                    <template #default="{ row: subTask }">
                      {{ subTask.startDate || '...' }} ~ {{ subTask.endDate || '...' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="90">
                    <template #default="{ row: subTask }">
                      <span
                        :class="subTask.published !== false ? 'text-green-600' : 'text-gray-400'">
                        {{ subTask.published !== false ? '已上架' : '已下架' }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" fixed="right" width="160">
                    <template #default="{ row: subTask }">
                      <el-button
                        type="primary"
                        link
                        size="small"
                        @click="openSubTaskDialog(row as Task, subTask as SubTask)">
                        编辑
                      </el-button>
                      <el-button
                        type="primary"
                        link
                        size="small"
                        @click="openCreateProcess(row as Task, subTask as SubTask)">
                        新增工序
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div v-if="row.unassignedProcesses.length" class="mt-4">
                  <div class="text-sm text-gray-500">
                    未归属子任务的工序（编辑工序可选择所属子任务）
                  </div>
                  <ProcessTable
                    :processes="row.unassignedProcesses"
                    @edit="(p) => openEditProcess(row as Task, p)" />
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="name" label="任务名称" min-width="160" show-overflow-tooltip />
          <el-table-column label="子任务数" width="90">
            <template #default="{ row }">{{ row.subTasks.length }}</template>
          </el-table-column>
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
          <el-table-column label="操作" fixed="right" width="260">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
              <el-button
                type="primary"
                link
                size="small"
                :loading="copyingTaskId === row.id"
                :disabled="copyingTaskId != null"
                @click="copyTask(row as Task)"
                >复制</el-button
              >
              <el-button
                type="danger"
                link
                size="small"
                :loading="deletingTaskId === row.id"
                :disabled="deletingTaskId != null"
                @click="deleteTask(row as Task)"
                >删除</el-button
              >
              <el-button type="primary" link size="small" @click="openSubTaskDialog(row as Task)">
                新增子任务
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

    <SubTaskDialog
      v-if="showSubTaskDialog"
      :task-id="subTaskTaskId"
      :sub-task="editingSubTask"
      @closed="showSubTaskDialog = false"
      @saved="handleSubTaskSaved" />

    <ProcessDialog
      v-if="showProcessDialog"
      :task-id="processTaskId"
      :sub-task-id="processSubTaskId"
      :sub-tasks="processSubTasks"
      :process="editingProcess"
      @closed="closeProcessDialog"
      @saved="handleProcessSaved" />
  </div>
</template>

<script setup lang="ts">
  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BasePagination from '@/components/base/BasePagination.vue'
  import SubTaskDialog from '@/components/task/SubTaskDialog.vue'
  import { buildTaskHierarchy } from '@/utils/taskHierarchy'
  import TaskDialog from '@/components/task/TaskDialog.vue'
  import ProcessTable from '@/components/task/ProcessTable.vue'
  import ProcessDialog from '@/components/task/ProcessDialog.vue'

  import { taskApi } from '@/api/task'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { Manager, Process, SubTask, Task } from '@/types/taskType'
  import { Plus } from '@element-plus/icons-vue'
  import { computed, onMounted, reactive, ref } from 'vue'

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
  const taskRows = computed(() => tasks.value.map(buildTaskHierarchy))
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

  const deletingTaskId = ref<number>()

  async function deleteTask(task: Task) {
    if (task.id == null || deletingTaskId.value != null) return
    try {
      await ElMessageBox.confirm(
        `确定删除任务“${task.name}”？删除后将不再显示，已有工时记录会保留。`,
        '删除任务',
        {
          type: 'warning',
          confirmButtonText: '删除',
          cancelButtonText: '取消',
        }
      )
      deletingTaskId.value = task.id
      await taskApi.delete(task.id)
      ElMessage.success('任务已删除')
      if (tasks.value.length === 1 && params.pageNum > 1) params.pageNum -= 1
      loadTasks()
    } catch {
      // Cancellation needs no message; API errors use the shared interceptor.
    } finally {
      deletingTaskId.value = undefined
    }
  }

  const copyingTaskId = ref<number>()

  async function copyTask(task: Task) {
    if (task.id == null || copyingTaskId.value != null) return
    try {
      const { value } = await ElMessageBox.prompt(
        '将复制全部子任务、工序、部门和负责人，并保留上下架状态。',
        '复制任务',
        {
          inputValue: `${task.name.slice(0, 17)}-副本`,
          inputPlaceholder: '请输入副本名称',
          inputValidator: (value) =>
            (!!value?.trim() && value.trim().length <= 20) || '请输入1至20个字符的任务名称',
          confirmButtonText: '复制',
          cancelButtonText: '取消',
          closeOnClickModal: false,
        }
      )
      copyingTaskId.value = task.id
      await taskApi.copy(task.id, value.trim())
      ElMessage.success('任务复制成功')
      params.pageNum = 1
      loadTasks()
    } catch {
      // Cancellation needs no message; API failures are handled by the shared interceptor.
    } finally {
      copyingTaskId.value = undefined
    }
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

  const showSubTaskDialog = ref(false)
  const subTaskTaskId = ref(0)
  const editingSubTask = ref<SubTask>()

  const openSubTaskDialog = (task: Task, subTask?: SubTask) => {
    if (task.id == null) return
    subTaskTaskId.value = task.id
    editingSubTask.value = subTask
    showSubTaskDialog.value = true
  }

  const handleSubTaskSaved = () => {
    showSubTaskDialog.value = false
    loadTasks()
  }

  // process dialog
  const showProcessDialog = ref(false)
  const processTaskId = ref<number>(0)
  const processSubTaskId = ref<number>()
  const processSubTasks = ref<SubTask[]>([])
  const editingProcess = ref<Process | undefined>()

  const openCreateProcess = (task: Task, subTask: SubTask) => {
    if (task.id == null || subTask.id == null) return
    processTaskId.value = task.id
    processSubTaskId.value = subTask.id
    processSubTasks.value = task.subTasks ?? []
    editingProcess.value = undefined
    showProcessDialog.value = true
  }

  const openEditProcess = (task: Task, process: Process) => {
    if (task.id == null) return
    processTaskId.value = task.id
    processSubTasks.value = task.subTasks ?? []
    processSubTaskId.value = processSubTasks.value.find(
      (s) => String(s.id) === String(process.subTaskId)
    )?.id
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
