<template>
  <div>
    <h2 class="my-3 text-base font-semibold">计划部件</h2>
    <p class="mb-3 text-sm text-gray-500">点击“查看工序”，下方将显示该部件的工序配置。</p>
    <el-table
      :data="detail.parts ?? []"
      row-key="id"
      :row-class-name="
        ({ row }: { row: PlanPart }) => (row.id === selectedPart?.id ? 'selected-part-row' : '')
      "
      empty-text="此计划暂无部件">
      <el-table-column prop="productName" label="所属产品" min-width="160" />
      <el-table-column label="部件名称" min-width="220">
        <template #default="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <span>{{ row.partName }}</span>
            <el-tag v-if="row.id === selectedPart?.id" size="small">当前查看</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="计划数量" min-width="170">
        <template #default="{ row }">
          <div class="flex items-center gap-2">
            <el-input-number
              :model-value="quantityDrafts[row.id]"
              :min="1"
              :max="2147483647"
              :precision="0"
              size="small"
              controls-position="right"
              :disabled="partBusy(row as PlanPart)"
              :aria-label="`${row.partName}计划数量`"
              @update:model-value="(value) => (quantityDrafts[row.id] = value)"
              @change="saveQuantity(row as PlanPart)" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="计划开始日期" min-width="145">
        <template #default="{ row }">{{ row.planStart || '未设置' }}</template>
      </el-table-column>
      <el-table-column label="计划结束日期" min-width="145">
        <template #default="{ row }">{{ row.planEnd || '未设置' }}</template>
      </el-table-column>
      <el-table-column label="纳入生产" width="100">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            :active-value="1"
            :inactive-value="0"
            :loading="saving.has(`part-${row.id}`)"
            @change="(value) => togglePart(row as PlanPart, Number(value))" />
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="140" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="emit('edit', { kind: 'part', plan, record: row as PlanPart })">
            编辑
          </el-button>
          <el-button
            link
            type="primary"
            :aria-pressed="row.id === selectedPart?.id"
            aria-controls="plan-part-operations"
            @click="selectPart(row as PlanPart)">
            {{ row.id === selectedPart?.id ? '定位工序' : '查看工序' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <section
      v-if="selectedPart"
      id="plan-part-operations"
      ref="operationsSection"
      class="operations-section my-6"
      aria-labelledby="plan-part-operations-title">
      <div class="operations-heading" aria-live="polite">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="plan-part-operations-title" class="m-0 text-base font-semibold">
            工序管理 · {{ selectedPart.partName }}
          </h2>
          <el-tag effect="plain">{{ selectedPart.operations?.length ?? 0 }} 道工序</el-tag>
        </div>
        <p class="mt-2 mb-0 text-sm text-gray-500">
          所属产品：{{ selectedPart.productName || '未设置' }} · 当前部件：{{
            selectedPart.partName
          }}
        </p>
      </div>
      <el-table
        :data="selectedPart.operations ?? []"
        row-key="id"
        class="my-3"
        empty-text="当前部件暂无工序">
        <el-table-column prop="processName" label="工序名称" min-width="150" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            {{ row.standardFlag === 1 ? '标准工序' : '非标准工序' }}
          </template>
        </el-table-column>
        <el-table-column label="计划总数量 / 计划总时长" min-width="230">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-input-number
                v-model="targetDrafts[row.id]"
                :min="row.standardFlag === 1 ? 1 : 0.01"
                :max="row.standardFlag === 1 ? 2147483647 : 99999999.99"
                :precision="row.standardFlag === 1 ? 0 : 2"
                size="small"
                controls-position="right"
                placeholder="待配置"
                :aria-label="`${row.processName}${row.standardFlag === 1 ? '计划总数量' : '计划总时长'}`"
                :disabled="
                  saving.has(`part-${selectedPart.id}`) || saving.has(`operation-${row.id}`)
                "
                @change="saveTarget(row as PlanOperation)" />
              <span class="text-xs text-gray-500">
                {{ row.standardFlag === 1 ? '件' : '小时' }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="标准工时（分钟）" min-width="150">
          <template #default="{ row }">
            {{ row.standardFlag === 1 ? (row.stdTime ?? '-') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="ownerName" label="负责人" width="100" />
        <el-table-column label="纳入生产" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              :active-value="1"
              :inactive-value="0"
              :loading="saving.has(`operation-${row.id}`)"
              :disabled="selectedPart.enabled !== 1 || saving.has(`part-${selectedPart.id}`)"
              @change="(value) => toggleOperation(row as PlanOperation, Number(value))" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="
                emit('edit', {
                  kind: 'operation',
                  plan,
                  part: selectedPart,
                  record: row as PlanOperation,
                })
              ">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
    <div class="my-3 flex items-center justify-between">
      <h2 class="m-0 text-base font-semibold">计划人员</h2>
      <el-button type="primary" @click="emit('edit', { kind: 'member', plan })">调整人员</el-button>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <el-card v-for="group in memberGroups" :key="group.type" shadow="never" class="min-w-0">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold">{{ group.label }}</span>
            <el-tag size="small" effect="plain">{{ group.members.length }} 人</el-tag>
          </div>
        </template>
        <ul v-if="group.members.length" class="m-0 list-none space-y-3 p-0">
          <li
            v-for="member in group.members"
            :key="member.id"
            class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm break-words">{{ member.userName }}</div>
              <p v-if="member.remark" class="mt-1 mb-0 text-xs break-words text-gray-500">
                {{ member.remark }}
              </p>
            </div>
            <el-button
              link
              type="danger"
              class="shrink-0"
              :aria-label="`删除${group.label}${member.userName}`"
              :loading="saving.has(`member-${member.id}`)"
              @click="deleteMember(member)">
              删除
            </el-button>
          </li>
        </ul>
        <div v-else class="py-5 text-center text-sm text-gray-500">暂无{{ group.label }}</div>
      </el-card>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { computed, nextTick, reactive, ref, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { planOperationTarget } from '@/utils/planOperation'
  import { planPartApi, planOperationApi, planMemberApi } from '@/api/productionPlan'
  import {
    memberTypes,
    type ProductionPlan,
    type PlanPart,
    type PlanOperation,
    type PlanMember,
    type PlanEditor,
  } from '@/types/productionPlanType'
  const props = defineProps<{ plan: ProductionPlan }>()
  const emit = defineEmits<{ edit: [editor: PlanEditor] }>()
  const detail = ref<ProductionPlan>(props.plan)
  const selectedPartId = ref<number>()
  const operationsSection = ref<HTMLElement>()
  async function selectPart(part: PlanPart) {
    selectedPartId.value = part.id
    await nextTick()
    operationsSection.value?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }
  const selectedPart = computed(
    () =>
      detail.value.parts?.find((part) => part.id === selectedPartId.value) ??
      detail.value.parts?.[0]
  )
  const memberGroups = computed(() =>
    memberTypes.map((label, index) => ({
      type: index + 1,
      label,
      members: (detail.value.members ?? []).filter((member) => member.memberType === index + 1),
    }))
  )
  const saving = reactive(new Set<string>())
  async function deleteMember(member: PlanMember) {
    const key = `member-${member.id}`
    if (saving.has(key)) return
    saving.add(key)
    try {
      await ElMessageBox.confirm(
        `确定将“${member.userName}”从本计划的${memberTypes[member.memberType - 1] ?? '计划人员'}中删除吗？`,
        '删除计划人员',
        { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
      )
      await planMemberApi.remove(member.id)
      detail.value.members = (detail.value.members ?? []).filter((item) => item.id !== member.id)
      ElMessage.success('计划人员已删除')
    } catch {
      // Cancellation and failed requests leave the list intact.
    } finally {
      saving.delete(key)
    }
  }
  const quantityDrafts = reactive<Record<number, number | undefined>>({})
  const targetDrafts = reactive<Record<number, number | undefined>>({})
  const operationTarget = (operation: PlanOperation) =>
    (operation.standardFlag === 1 ? operation.totalQuantity : operation.totalHours) ?? undefined
  function partBusy(part: PlanPart) {
    return (
      saving.has(`part-${part.id}`) ||
      (part.operations ?? []).some((op) => saving.has(`operation-${op.id}`))
    )
  }
  function syncDrafts(part: PlanPart) {
    quantityDrafts[part.id] = part.quantity
    for (const op of part.operations ?? []) targetDrafts[op.id] = operationTarget(op)
  }
  async function saveTarget(operation: PlanOperation) {
    const key = `operation-${operation.id}`
    const value = targetDrafts[operation.id]
    if (
      saving.has(key) ||
      saving.has(`part-${operation.planPartId}`) ||
      value === operationTarget(operation)
    )
      return
    let target
    try {
      target = planOperationTarget(operation.standardFlag, value, value)
    } catch (error) {
      targetDrafts[operation.id] = operationTarget(operation)
      ElMessage.warning((error as Error).message)
      return
    }
    saving.add(key)
    try {
      await planOperationApi.update({ id: operation.id, ...target })
      Object.assign(operation, target)
    } catch {
      targetDrafts[operation.id] = operationTarget(operation)
    } finally {
      saving.delete(key)
    }
  }
  async function saveQuantity(part: PlanPart) {
    const quantity = quantityDrafts[part.id]
    const key = `part-${part.id}`
    if (partBusy(part) || quantity === part.quantity) return
    if (quantity == null || !Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647) {
      quantityDrafts[part.id] = part.quantity
      ElMessage.warning('请填写有效的计划数量')
      return
    }
    saving.add(key)
    try {
      await planPartApi.update({ id: part.id, quantity })
      part.quantity = quantity
      try {
        const res = await planPartApi.get(part.id)
        Object.assign(part, res.data)
        syncDrafts(part)
      } catch {
        ElMessage.warning('计划数量已保存，工序信息刷新失败，请刷新页面查看')
      }
    } catch {
      quantityDrafts[part.id] = part.quantity
    } finally {
      saving.delete(key)
    }
  }
  async function togglePart(part: PlanPart, enabled: number) {
    const key = `part-${part.id}`
    if (saving.has(key)) return
    saving.add(key)
    try {
      await planPartApi.update({ id: part.id, enabled })
      part.enabled = enabled
    } catch {
      /* Keep the persisted selection on failure. */
    } finally {
      saving.delete(key)
    }
  }
  async function toggleOperation(operation: PlanOperation, enabled: number) {
    const key = `operation-${operation.id}`
    if (saving.has(key)) return
    saving.add(key)
    try {
      await planOperationApi.update({ id: operation.id, enabled })
      operation.enabled = enabled
    } catch {
      /* Keep the persisted selection on failure. */
    } finally {
      saving.delete(key)
    }
  }
  watch(
    () => props.plan,
    (plan) => {
      detail.value = plan
      for (const id of Object.keys(quantityDrafts)) delete quantityDrafts[Number(id)]
      for (const id of Object.keys(targetDrafts)) delete targetDrafts[Number(id)]
      for (const part of plan.parts ?? []) syncDrafts(part)
    },
    { immediate: true }
  )
</script>

<style scoped>
  :deep(.selected-part-row) {
    --el-table-tr-bg-color: var(--el-color-primary-light-9);
    --el-table-row-hover-bg-color: var(--el-color-primary-light-8);
  }
  :deep(.selected-part-row td:first-child) {
    box-shadow: inset 3px 0 var(--el-color-primary);
  }
  .operations-section {
    scroll-margin-top: 16px;
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 8px;
    overflow: hidden;
  }
  .operations-heading {
    padding: 16px;
    border-left: 3px solid var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
</style>
