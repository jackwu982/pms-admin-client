<template>
  <el-dialog
    :model-value="true"
    :title="`${editor.record ? '编辑' : '新增'}${label}`"
    width="min(600px, 94vw)"
    top="4vh"
    :close-on-click-modal="false"
    :before-close="close">
    <div class="editor-content">
      <dl class="snapshot-summary">
        <div class="summary-wide">
          <dt>所属计划</dt>
          <dd>{{ editor.plan.planNo }}</dd>
        </div>
        <div v-if="editor.kind === 'operation'">
          <dt>所属部件</dt>
          <dd>{{ editor.part.partName }}</dd>
        </div>
        <div>
          <dt>{{ label }}名称</dt>
          <dd>{{ part?.partName ?? op?.processName }}</dd>
        </div>
      </dl>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        :disabled="saving"
        class="plan-config-form">
        <el-form-item v-if="editor.kind === 'part'" label="计划数量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="1" :max="2147483647" :precision="0" />
          <div class="mt-2 w-full text-xs text-gray-500">
            保存后，未填写计划总数量的标准工序将同步此数量，已填写的数量保持不变。
          </div>
        </el-form-item>
        <div v-if="editor.kind === 'part'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <el-form-item label="计划开始日期">
            <el-date-picker
              v-model="form.planStart"
              :clearable="false"
              value-format="YYYY-MM-DD"
              class="w-full!" />
          </el-form-item>
          <el-form-item label="计划结束日期" prop="planEnd">
            <el-date-picker
              v-model="form.planEnd"
              :clearable="false"
              value-format="YYYY-MM-DD"
              class="w-full!" />
          </el-form-item>
        </div>
        <template v-if="editor.kind === 'operation'">
          <el-form-item label="工序类型">
            <el-radio-group v-model="form.standardFlag">
              <el-radio :value="1">标准工序</el-radio>
              <el-radio :value="0">非标准工序</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="form.standardFlag === 1" label="标准工时（分钟）" prop="stdTime">
            <el-input-number
              v-model="form.stdTime"
              :min="0.01"
              :max="99999999.99"
              :precision="2"
              placeholder="未设置" />
          </el-form-item>
          <el-form-item v-if="form.standardFlag === 1" label="标准工序总数量" prop="totalQuantity">
            <el-input-number
              v-model="form.totalQuantity"
              :min="1"
              :max="2147483647"
              :precision="0" />
          </el-form-item>
          <el-form-item v-else label="非标准工序总时长（小时）" prop="totalHours">
            <el-input-number v-model="form.totalHours" :min="0.01" :max="99999999.99" :precision="2" />
          </el-form-item>
        </template>
        <el-form-item v-if="editor.kind === 'operation'" label="工序负责人（可选）">
          <PlanResourceSelect
            :model-value="form.userId"
            :selected-label="form.userName"
            :fetch="fetchUsers"
            placeholder="搜索人员"
            @select="selectUser" />
        </el-form-item>
        <el-form-item label="纳入生产">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button :disabled="saving" @click="close">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { planPartApi, planOperationApi } from '@/api/productionPlan'
  import { userApi } from '@/api/user'
  import { type PlanEditor } from '@/types/productionPlanType'
  import { planOperationTarget } from '@/utils/planOperation'
  import PlanResourceSelect, { type ResourceOption } from './PlanResourceSelect.vue'
  const props = defineProps<{ editor: Exclude<PlanEditor, { kind: 'member' }> }>()
  const emit = defineEmits<{ closed: []; saved: [] }>()
  const e = props.editor
  const label = { part: '部件', operation: '工序' }[e.kind]
  const part = e.kind === 'part' ? e.record : undefined
  const op = e.kind === 'operation' ? e.record : undefined
  const form = reactive({
    quantity: part?.quantity ?? 1,
    planStart: part?.planStart ?? undefined,
    planEnd: part?.planEnd ?? undefined,
    standardFlag: op?.standardFlag ?? 0,
    stdTime: op?.stdTime ?? undefined,
    totalQuantity: op?.totalQuantity ?? undefined,
    totalHours: op?.totalHours ?? undefined,
    enabled: part?.enabled ?? op?.enabled ?? 1,
    userId: op?.ownerId ?? undefined,
    userName: op?.ownerName ?? '',
    remark: e.record?.remark ?? '',
  })
  const formRef = ref<FormInstance>()
  const saving = ref(false)
  const rules: FormRules = {
    quantity: [
      { required: true, type: 'number', min: 1, message: '请输入计划数量', trigger: 'change' },
    ],
    planEnd: [
      {
        validator: (_r, _v, cb) =>
          form.planStart && form.planEnd && form.planEnd < form.planStart
            ? cb(new Error('结束日期不能早于开始日期'))
            : cb(),
        trigger: 'change',
      },
    ],
    totalQuantity: [
      {
        validator: (_r, _v, cb) => {
          try {
            planOperationTarget(1, form.totalQuantity, form.totalHours)
            cb()
          } catch (error) {
            cb(error as Error)
          }
        },
        trigger: 'change',
      },
    ],
    totalHours: [
      {
        validator: (_r, _v, cb) => {
          try {
            planOperationTarget(0, form.totalQuantity, form.totalHours)
            cb()
          } catch (error) {
            cb(error as Error)
          }
        },
        trigger: 'change',
      },
    ],
    stdTime: [
      {
        validator: (_r, value, cb) =>
          value == null || (Number.isFinite(value) && value >= 0.01 && value <= 99999999.99)
            ? cb()
            : cb(new Error('标准工时须在 0.01 到 99999999.99 分钟之间')),
        trigger: 'change',
      },
    ],
  }
  async function fetchUsers(query: string, page: number) {
    const res = await userApi.list({ keyword: query || undefined, pageNum: page, pageSize: 20 })
    return {
      total: res.data.total,
      list: res.data.list.map((u: { id: number; nickname: string }) => ({
        id: u.id,
        label: u.nickname,
      })),
    }
  }
  function selectUser(user: ResourceOption) {
    form.userId = user.id
    form.userName = user.label
  }
  function close() {
    if (!saving.value) emit('closed')
  }
  async function save() {
    if (saving.value || !(await formRef.value?.validate().catch(() => false))) return
    saving.value = true
    try {
      const common = { planId: e.plan.id, remark: form.remark }
      if (e.kind === 'part') {
        const payload = {
          ...common,
          quantity: form.quantity,
          planStart: form.planStart,
          planEnd: form.planEnd,
          enabled: form.enabled,
          sourcePartId: e.record?.sourcePartId,
        }
        await planPartApi.update({ ...payload, id: e.record.id })
      } else if (e.kind === 'operation') {
        const payload = {
          ...common,
          planPartId: e.part.id,
          standardFlag: form.standardFlag,
          stdTime: form.standardFlag === 1 ? form.stdTime : undefined,
          ...planOperationTarget(form.standardFlag, form.totalQuantity, form.totalHours),
          enabled: form.enabled,
          ownerId: form.userId,
          ownerName: form.userName,
          sourceProcessId: e.record?.sourceProcessId,
        }
        await planOperationApi.update({ ...payload, id: e.record.id })
      }
      ElMessage.success('保存成功')
      emit('saved')
    } catch {
      /* API failures retain the form for retry. */
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped>
  .editor-content {
    max-height: calc(92dvh - 140px);
    overflow-y: auto;
    padding: 0 4px;
  }
  .snapshot-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 20px;
    margin: 0 0 20px;
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-light);
  }
  .summary-wide {
    grid-column: 1 / -1;
  }
  .snapshot-summary dt {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 20px;
  }
  .snapshot-summary dd {
    margin: 2px 0 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 22px;
    overflow-wrap: anywhere;
  }
  .plan-config-form :deep(.el-input-number) {
    width: 100%;
  }
  .plan-config-form :deep(.el-form-item) {
    margin-bottom: 18px;
  }
  .plan-config-form :deep(.el-form-item:last-child) {
    margin-bottom: 4px;
  }
  @media (max-width: 380px) {
    .snapshot-summary {
      gap: 10px;
      padding: 12px;
    }
  }
</style>
