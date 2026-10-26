<template>
  <div v-loading="loading" class="px-5 py-3">
    <el-button v-if="failed" link type="primary" @click="load">计划详情加载失败，重试</el-button>
    <template v-else>
      <el-table :data="detail.parts ?? []" row-key="id" empty-text="此计划暂无部件">
        <el-table-column type="expand">
          <template #default="{ row: part }">
            <el-table :data="part.operations ?? []" row-key="id" class="my-3" empty-text="暂无工序">
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
                      :disabled="saving.has(`part-${part.id}`) || saving.has(`operation-${row.id}`)"
                      @change="saveTarget(row as PlanOperation)" />
                    <span class="text-xs text-gray-500">
                      {{ row.standardFlag === 1 ? '件' : '小时' }}
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="单件工时（分钟）" min-width="150">
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
                    :disabled="part.enabled !== 1 || saving.has(`part-${part.id}`)"
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
                        part: part as PlanPart,
                        record: row as PlanOperation,
                      })
                    ">
                    编辑
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="所属产品" min-width="160" />
        <el-table-column prop="partName" label="部件名称" min-width="160" />
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
          </template>
        </el-table-column>
      </el-table>
      <div class="my-3 font-semibold">计划人员</div>
      <el-table :data="detail.members ?? []" row-key="id" empty-text="暂无计划人员">
        <el-table-column prop="userName" label="姓名" min-width="150" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">{{ memberTypes[row.memberType - 1] ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="emit('edit', { kind: 'member', plan, record: row as PlanMember })">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
</template>
<script setup lang="ts">
  import { reactive, ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { planOperationTarget } from '@/utils/planOperation'
  import { productionPlanApi, planPartApi, planOperationApi } from '@/api/productionPlan'
  import {
    memberTypes,
    type ProductionPlan,
    type PlanPart,
    type PlanOperation,
    type PlanMember,
    type PlanEditor,
  } from '@/types/productionPlanType'
  const props = defineProps<{ plan: ProductionPlan; revision: number }>()
  const emit = defineEmits<{ edit: [editor: PlanEditor] }>()
  const detail = ref<ProductionPlan>(props.plan)
  const loading = ref(false)
  const failed = ref(false)
  const saving = reactive(new Set<string>())
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
        ElMessage.warning('计划数量已保存，工序信息刷新失败，请重新展开计划查看')
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
  let request = 0
  async function load() {
    const current = ++request
    loading.value = true
    failed.value = false
    try {
      const res = await productionPlanApi.get(props.plan.id)
      if (current === request) {
        detail.value = res.data
        for (const id of Object.keys(quantityDrafts)) delete quantityDrafts[Number(id)]
        for (const id of Object.keys(targetDrafts)) delete targetDrafts[Number(id)]
        for (const part of res.data.parts ?? []) syncDrafts(part)
      }
    } catch {
      if (current === request) failed.value = true
    } finally {
      if (current === request) loading.value = false
    }
  }
  watch(() => [props.plan.id, props.revision], load, { immediate: true })
</script>
