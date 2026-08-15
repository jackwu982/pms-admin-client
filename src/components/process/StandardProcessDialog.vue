<template>
  <el-dialog
    v-model="visible"
    :title="form.id ? '编辑工序' : '新增工序'"
    width="520px"
    :close-on-click-modal="false"
    :before-close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="工序名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入工序名称"
          :maxlength="50"
          show-word-limit
          @keyup.enter="save" />
      </el-form-item>

      <el-form-item label="所属分类" prop="categoryId">
        <el-select
          v-model="form.categoryId"
          filterable
          remote
          reserve-keyword
          :remote-method="onCategoryFilter"
          :loading="categoryLoading"
          placeholder="请选择分类"
          class="w-full">
          <el-option v-for="c in categoryOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="单次标准工时 (小时)">
        <el-input-number
          v-model="form.standardHours"
          :min="0"
          :precision="2"
          :step="0.01"
          controls-position="right"
          placeholder="请输入标准工时"
          class="w-full" />
      </el-form-item>

      <el-form-item label="工序要求">
        <el-input
          v-model="form.description"
          placeholder="请输入工序要求"
          :maxlength="200"
          show-word-limit />
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

  import { standardProcessApi } from '@/api/standardProcess'
  import { categoryApi } from '@/api/category'
  import type { StandardProcess } from '@/types/standardProcessType'

  const props = defineProps<{
    process?: StandardProcess
  }>()

  const emits = defineEmits(['closed', 'saved'])

  const visible = ref(true)
  const saving = ref(false)
  const categoryOptions = ref<{ id: number; name: string }[]>([])
  const categoryLoading = ref(false)

  const handleClose = () => {
    emits('closed')
  }

  const formRef = ref<FormInstance>()
  const form = reactive<{
    id?: number
    name: string
    categoryId?: number
    standardHours: number | null
    description: string
    published: boolean
  }>({
    id: undefined,
    name: '',
    categoryId: undefined,
    standardHours: null,
    description: '',
    published: false,
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入工序名称', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
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

  async function save() {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      standardHours: form.standardHours,
      description: form.description.trim(),
      published: form.published,
    }

    saving.value = true
    try {
      if (form.id) {
        await standardProcessApi.update({ id: form.id, ...payload })
        ElMessage.success('编辑成功')
      } else {
        await standardProcessApi.create(payload)
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

  onMounted(async () => {
    const p = props.process
    const category = p?.category
    if (p) {
      form.id = p.id
      form.name = p.name ?? ''
      form.categoryId = p.categoryId ?? category?.id
      form.standardHours = p.standardHours ?? null
      form.description = p.description ?? ''
      form.published = p.published ?? false
    }
    await onCategoryFilter('')
    if (category) {
      const exists = categoryOptions.value.some((c) => c.id === category.id)
      if (!exists) {
        categoryOptions.value.unshift({ id: category.id, name: category.name })
      }
    }
  })
</script>

<style lang="less" scoped></style>
