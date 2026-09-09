<template>
  <el-dialog
    v-model="visible"
    :title="form.id ? '编辑子任务' : '新增子任务'"
    width="680"
    :close-on-click-modal="false"
    :before-close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="子任务名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入子任务名称"
          show-word-limit
          :maxlength="32" />
      </el-form-item>

      <el-form-item label="子任务负责人">
        <el-select
          v-model="form.managers"
          multiple
          filterable
          remote
          reserve-keyword
          :remote-method="onManagerFilter"
          :loading="managerLoading"
          value-key="id"
          placeholder="请搜索选择管理人"
          class="w-full">
          <el-option v-for="m in managerOptions" :key="m.id" :label="m.nickname" :value="m" />
        </el-select>
      </el-form-item>

      <div class="flex gap-3">
        <el-form-item label="开始日期" class="flex-1">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="w-full" />
        </el-form-item>
        <el-form-item label="截止日期" class="flex-1">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="w-full" />
        </el-form-item>
      </div>

      <el-form-item label="上架">
        <el-switch v-model="form.published" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { cloneDeep } from 'lodash-es'

  import { subTaskApi } from '@/api/subTask'
  import { userApi } from '@/api/user'
  import type { Manager, SubTask } from '@/types/taskType'

  const props = defineProps<{
    taskId: number
    subTask?: SubTask
  }>()

  const emits = defineEmits(['closed', 'saved'])

  const visible = ref(true)
  const saving = ref(false)

  const handleClose = () => {
    emits('closed')
  }

  const form = reactive<{
    id?: number
    name: string
    published: boolean
    managers: Manager[]
    startDate: string | null
    endDate: string | null
  }>({
    id: undefined,
    name: '',
    published: true,
    managers: [],
    startDate: null,
    endDate: null,
  })

  const formRef = ref<FormInstance>()
  const rules: FormRules = {
    name: [{ required: true, message: '请输入子任务名称', trigger: 'blur' }],
  }

  const managerOptions = ref<Manager[]>([])
  const managerLoading = ref(false)

  async function onManagerFilter(query: string) {
    managerLoading.value = true
    try {
      const kw = query?.trim() || ''
      const res: any = await userApi.list({ pageNum: 1, pageSize: 20, keyword: kw || undefined })
      const remote: Manager[] = (res.data?.list ?? []).map((u: any) => ({
        id: u.id,
        nickname: u.nickname,
      }))
      const seen = new Set(form.managers.map((m) => m.id))
      managerOptions.value = [...form.managers, ...remote.filter((m) => !seen.has(m.id))]
    } finally {
      managerLoading.value = false
    }
  }

  async function save() {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    if (!form.name.trim()) {
      ElMessage.warning('请输入子任务名称')
      return
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      ElMessage.warning('截止日期不能早于开始日期')
      return
    }

    const taskPayload = {
      name: form.name.trim(),
      published: form.published,
      taskId: props.taskId,
      managers: form.managers,
      startDate: form.startDate,
      endDate: form.endDate,
    }

    saving.value = true
    try {
      if (form.id) {
        await subTaskApi.update({ id: form.id, ...taskPayload })
        ElMessage.success('编辑成功')
      } else {
        await subTaskApi.create(taskPayload)
        ElMessage.success('创建成功')
      }

      emits('saved')
      visible.value = false
    } catch {
      // error toast already shown by the shared axios interceptor
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    const t = props.subTask
    if (t) {
      form.id = t.id
      form.name = t.name ?? ''
      form.published = t.published !== false
      form.managers = cloneDeep(t.managers ?? [])
      managerOptions.value = cloneDeep(t.managers ?? [])
      form.startDate = t.startDate ?? null
      form.endDate = t.endDate ?? null
    }
    onManagerFilter('')
  })
</script>

<style lang="less" scoped></style>
