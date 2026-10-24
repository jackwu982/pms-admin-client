<template>
  <el-dialog
    :model-value="true"
    :title="`${editor.record ? '编辑' : '新增'}${label}`"
    width="min(680px, 94vw)"
    :close-on-click-modal="false"
    :before-close="close">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving">
      <el-form-item v-if="editor.kind !== 'product'" label="所属产品">
        <el-input :model-value="editor.product.name" disabled />
      </el-form-item>
      <el-form-item v-if="editor.kind === 'operation'" label="所属部件">
        <el-input :model-value="editor.part.name" disabled />
      </el-form-item>
      <el-form-item :label="`${label}名称`" prop="name">
        <el-input v-model="form.name" :maxlength="100" show-word-limit />
      </el-form-item>
      <template v-if="editor.kind === 'product'">
        <el-form-item label="型号">
          <el-input v-model="form.model" :maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="form.spec" :maxlength="32" show-word-limit />
        </el-form-item>
      </template>
      <template v-if="editor.kind === 'operation'">
        <el-form-item label="标准工序">
          <el-switch v-model="form.standardFlag" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="标准工时（分钟）" prop="stdTime">
          <el-input-number v-model="form.stdTime" :min="0" :max="99999999.99" :precision="2" />
        </el-form-item>
      </template>
      <el-form-item label="启用">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          :maxlength="255"
          show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="close">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { productApi, partApi, operationApi } from '@/api/product'
  import type { CatalogEditor } from '@/types/productType'

  const props = defineProps<{ editor: CatalogEditor }>()
  const emit = defineEmits<{ closed: []; saved: [] }>()
  const label = { product: '产品', part: '部件', operation: '工序' }[props.editor.kind]
  const record = props.editor.record
  const form = reactive({
    name: record?.name ?? '',
    status: record?.status ?? 1,
    remark: record?.remark ?? '',
    model: props.editor.kind === 'product' ? (props.editor.record?.model ?? '') : '',
    spec: props.editor.kind === 'product' ? (props.editor.record?.spec ?? '') : '',
    standardFlag: props.editor.kind === 'operation' ? (props.editor.record?.standardFlag ?? 0) : 0,
    stdTime: props.editor.kind === 'operation' ? (props.editor.record?.stdTime ?? 0) : 0,
  })
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const rules: FormRules = {
    name: [{ required: true, whitespace: true, message: `请输入${label}名称`, trigger: 'blur' }],
    stdTime: [
      {
        validator: (_rule, value, callback) => {
          if (
            props.editor.kind === 'operation' &&
            (!Number.isFinite(value) || value < 0 || (form.standardFlag === 1 && value <= 0))
          ) {
            callback(new Error('请输入有效工时，标准工序的工时必须大于 0'))
          } else callback()
        },
        trigger: 'change',
      },
    ],
  }

  function close() {
    if (!saving.value) emit('closed')
  }

  async function save() {
    if (saving.value || !(await formRef.value?.validate().catch(() => false))) return
    saving.value = true
    const common = { name: form.name.trim(), status: form.status, remark: form.remark }
    try {
      const editor = props.editor
      if (editor.kind === 'product') {
        const payload = { ...common, model: form.model, spec: form.spec }
        if (record) await productApi.update({ ...payload, id: record.id })
        else await productApi.create(payload)
      } else if (editor.kind === 'part') {
        const payload = { ...common, productId: editor.product.id }
        if (record) await partApi.update({ ...payload, id: record.id })
        else await partApi.create(payload)
      } else {
        const payload = {
          ...common,
          partId: editor.part.id,
          standardFlag: form.standardFlag as 0 | 1,
          stdTime: form.stdTime,
        }
        if (record) await operationApi.update({ ...payload, id: record.id })
        else await operationApi.create(payload)
      }
      ElMessage.success('保存成功')
      emit('saved')
    } catch {
      // The shared API interceptor reports errors; keep the form available for retry.
    } finally {
      saving.value = false
    }
  }
</script>
