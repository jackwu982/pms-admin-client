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
              <el-table-column label="生产目标" min-width="150">
                <template #default="{ row }">
                  {{
                    row.standardFlag === 1
                      ? `${row.totalQuantity ?? '待配置'}（数量）`
                      : `${row.totalHours ?? '待配置'}（小时）`
                  }}
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
                    :disabled="part.enabled !== 1"
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
        <el-table-column prop="quantity" label="计划数量" width="100" />
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
      if (current === request) detail.value = res.data
    } catch {
      if (current === request) failed.value = true
    } finally {
      if (current === request) loading.value = false
    }
  }
  watch(() => [props.plan.id, props.revision], load, { immediate: true })
</script>
