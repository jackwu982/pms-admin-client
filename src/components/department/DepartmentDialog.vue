<template>
  <el-dialog
    v-model="visible"
    :title="form.id ? '编辑部门' : '新增部门'"
    width="480px"
    :close-on-click-modal="false"
    :before-close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="部门名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入部门名称" clearable />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  import { departmentApi } from '@/api/department'
  import type { Department } from '@/types/departmentType'
  import { cloneDeep } from 'lodash-es'

  const { department } = defineProps<{
    department?: Department
  }>()

  const emits = defineEmits(['closed', 'saved'])

  onMounted(() => {
    if (department) {
      form.value = cloneDeep(department)
    }
  })

  const visible = ref(true)
  const handleClose = () => {
    emits('closed')
  }

  const formRef = ref<FormInstance>()
  const saving = ref(false)

  const form = ref<Department>({
    id: 0,
    name: '',
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  }

  const handleSave = () => {
    formRef.value?.validate((valid) => {
      if (!valid) return

      saving.value = true
      const { id } = form.value
      let promise = null
      if (id) {
        promise = departmentApi.update(form.value)
      } else {
        promise = departmentApi.create(form.value)
      }

      promise
        .then((res: any) => {
          ElMessage.success('保存成功')
          emits('saved', res.data)
          visible.value = false
        })
        .catch(() => {
          // error toast is already handled by the shared axios interceptor
        })
        .finally(() => {
          saving.value = false
        })
    })
  }
</script>

<style lang="less" scoped></style>
