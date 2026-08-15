<template>
  <el-dialog
    v-model="visible"
    :title="form.id ? '编辑分类' : '新增分类'"
    width="480px"
    :close-on-click-modal="false"
    :before-close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="分类名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入分类名称"
          :maxlength="20"
          show-word-limit
          @keyup.enter="save" />
      </el-form-item>

      <el-form-item label="发布状态">
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

  import { categoryApi } from '@/api/category'
  import type { Category } from '@/types/categoryType'

  const props = defineProps<{
    category?: Category
  }>()

  const emits = defineEmits(['closed', 'saved'])

  const visible = ref(true)
  const saving = ref(false)

  const handleClose = () => {
    emits('closed')
  }

  const formRef = ref<FormInstance>()
  const form = reactive<{
    id?: number
    name: string
    published: boolean
  }>({
    id: undefined,
    name: '',
    published: false,
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  }

  async function save() {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    const payload = {
      name: form.name.trim(),
      published: form.published,
    }

    saving.value = true
    try {
      if (form.id) {
        await categoryApi.update({ id: form.id, ...payload })
        ElMessage.success('编辑成功')
      } else {
        await categoryApi.create(payload)
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
    const c = props.category
    if (c) {
      form.id = c.id
      form.name = c.name ?? ''
      form.published = c.published ?? false
    }
  })
</script>

<style lang="less" scoped></style>
