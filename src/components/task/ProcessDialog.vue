<template>
  <el-dialog
    v-model="visible"
    :title="form.id ? '编辑工序' : '新增工序'"
    :width="680"
    top="5vh"
    :close-on-click-modal="false"
    :before-close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="工序名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入工序名称"
          :maxlength="30"
          show-word-limit />
      </el-form-item>

      <div class="flex gap-3">
        <el-form-item label="难度系数" class="flex-1">
          <el-input-number
            v-model="form.difficulty"
            :min="0"
            :precision="1"
            :step="0.1"
            controls-position="right"
            class="w-full" />
        </el-form-item>
        <el-form-item label="总工时(h)" class="flex-1">
          <el-input-number
            v-model="form.totalHours"
            :min="0"
            :precision="1"
            :step="0.1"
            controls-position="right"
            class="w-full" />
        </el-form-item>
      </div>

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

      <el-form-item label="工序负责人">
        <el-select
          v-model="form.managers"
          multiple
          filterable
          remote
          reserve-keyword
          :remote-method="onManagerFilter"
          :loading="form._managerLoading"
          value-key="id"
          placeholder="搜索选择负责人"
          class="w-full">
          <el-option v-for="m in form._managerOptions" :key="m.id" :label="m.nickname" :value="m" />
        </el-select>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          maxlength="150"
          show-word-limit
          placeholder="备注（最多150字）" />
      </el-form-item>

      <div class="flex gap-6">
        <el-form-item label="标准工序">
          <el-switch v-model="form.standardFlag" />
        </el-form-item>
        <el-form-item v-if="form.standardFlag" label="标准工时(h)">
          <el-input-number
            v-model="form.standardHours"
            :min="0"
            :precision="3"
            :step="0.001"
            controls-position="right"
            class="w-24!" />
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

  import { processApi } from '@/api/process'
  import { userApi } from '@/api/user'
  import type { Manager, Process, ProcessForm } from '@/types/taskType'

  const props = defineProps<{
    taskId: number
    process?: Process
  }>()

  const emits = defineEmits(['closed', 'saved'])

  const visible = ref(true)
  const saving = ref(false)

  const handleClose = () => {
    emits('closed')
  }

  const formRef = ref<FormInstance>()
  const form = reactive<ProcessForm>({
    id: undefined,
    name: '',
    difficulty: 1,
    totalHours: 0,
    remark: '',
    published: true,
    standardFlag: false,
    standardHours: null,
    startDate: null,
    endDate: null,
    managers: [],
    _managerOptions: [],
    _managerLoading: false,
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入工序名称', trigger: 'blur' }],
  }

  async function onManagerFilter(query: string) {
    form._managerLoading = true
    try {
      const kw = query?.trim() || ''
      const res: any = await userApi.list({ pageNum: 1, pageSize: 20, keyword: kw || undefined })
      const remote: Manager[] = (res.data?.list ?? []).map((u: any) => ({
        id: u.id,
        nickname: u.nickname,
      }))
      const seen = new Set(form.managers.map((m) => m.id))
      form._managerOptions = [...form.managers, ...remote.filter((m) => !seen.has(m.id))]
    } finally {
      form._managerLoading = false
    }
  }

  async function save() {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    if (form.standardFlag && (form.standardHours == null || form.standardHours <= 0)) {
      ElMessage.warning('标准工序必须填写标准工时')
      return
    }

    const payload = {
      name: form.name.trim(),
      difficulty: form.difficulty,
      totalHours: form.totalHours,
      remark: form.remark,
      published: form.published,
      standardFlag: form.standardFlag,
      standardHours: form.standardFlag ? form.standardHours : null,
      startDate: form.startDate,
      endDate: form.endDate,
      managers: form.managers,
    }

    saving.value = true
    try {
      if (form.id) {
        await processApi.update({ id: form.id, taskId: props.taskId, ...payload })
      } else {
        await processApi.create({ taskId: props.taskId, ...payload })
      }
      ElMessage.success('保存成功')
      emits('saved')
      visible.value = false
    } catch {
      // error toast already shown by the shared axios interceptor
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    const p = props.process
    if (p) {
      form.id = p.id
      form.name = p.name ?? ''
      form.difficulty = p.difficulty ?? 1
      form.totalHours = p.totalHours ?? 0
      form.remark = p.remark ?? ''
      form.published = p.published !== false
      form.standardFlag = p.standardFlag ?? false
      form.standardHours = p.standardHours ?? null
      form.startDate = p.startDate ?? null
      form.endDate = p.endDate ?? null
      form.managers = cloneDeep(p.managers ?? [])
      form._managerOptions = cloneDeep(p.managers ?? [])
    }
    onManagerFilter('')
  })
</script>

<style lang="less" scoped></style>
