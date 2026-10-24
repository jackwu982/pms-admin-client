<template>
  <BaseTableContainer>
    <template #header-left-content><span class="font-semibold">生产计划</span></template>
    <template #header-right-content>
      <el-button :icon="Plus" type="primary" @click="openPlan()">新增生产计划</el-button>
    </template>
    <template #filter-content>
      <BaseSearchForm @search="search" @reset="reset">
        <el-form-item label="计划编号"><el-input v-model="params.planNo" clearable /></el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="params.productName" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" :empty-values="[null, undefined]" class="w-32!">
            <el-option label="全部" value="" />
            <el-option
              v-for="(label, value) in planStatuses"
              :key="value"
              :label="label"
              :value="value" />
          </el-select>
        </el-form-item>
      </BaseSearchForm>
    </template>
    <template #content>
      <el-button v-if="failed" link type="primary" @click="load">计划加载失败，重试</el-button>
      <el-table
        v-loading="loading"
        :data="plans"
        row-key="id"
        :expand-row-keys="expanded"
        @expand-change="onExpand">
        <el-table-column type="expand">
          <template #default="{ row }">
            <ProductionPlanStructure
              v-if="expanded.includes(String(row.id))"
              :plan="row as ProductionPlan"
              :revision="revisions[row.id] ?? 0"
              @edit="editor = $event" />
          </template>
        </el-table-column>
        <el-table-column prop="planNo" label="计划编号" min-width="160" />
        <el-table-column prop="productName" label="产品名称" min-width="160" />
        <el-table-column prop="saleOrderId" label="销售单 ID" min-width="170" />
        <el-table-column label="计划日期" min-width="220">
          <template #default="{ row }">
            {{ row.planStart || '未设置' }} ~ {{ row.planEnd || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">{{ planStatuses[row.status] ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPlan(row as ProductionPlan)">编辑</el-button>
            <el-button
              link
              type="primary"
              @click="editor = { kind: 'member', plan: row as ProductionPlan }">
              新增人员
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <BasePagination
        v-model:page-num="params.pageNum"
        v-model:page-size="params.pageSize"
        :total="total"
        @current-change="load"
        @size-change="search" />
    </template>
  </BaseTableContainer>
  <ProductionPlanDialog
    v-if="showPlan"
    :plan="editingPlan"
    @closed="showPlan = false"
    @saved="planSaved" />
  <PlanItemDialog v-if="editor" :editor="editor" @closed="editor = undefined" @saved="itemSaved" />
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import { productionPlanApi } from '@/api/productionPlan'
  import { planStatuses, type ProductionPlan, type PlanEditor } from '@/types/productionPlanType'
  import ProductionPlanDialog from '@/components/productionPlan/ProductionPlanDialog.vue'
  import ProductionPlanStructure from '@/components/productionPlan/ProductionPlanStructure.vue'
  import PlanItemDialog from '@/components/productionPlan/PlanItemDialog.vue'
  const params = reactive({
    pageNum: 1,
    pageSize: 10,
    planNo: '',
    productName: '',
    status: '' as number | '',
  })
  const plans = ref<ProductionPlan[]>([])
  const total = ref(0)
  const loading = ref(false)
  const failed = ref(false)
  const expanded = ref<string[]>([])
  const revisions = reactive<Record<number, number>>({})
  const editor = ref<PlanEditor>()
  const showPlan = ref(false)
  const editingPlan = ref<ProductionPlan>()
  let request = 0
  async function load() {
    const current = ++request
    loading.value = true
    failed.value = false
    try {
      const res = await productionPlanApi.list({
        ...params,
        planNo: params.planNo.trim() || undefined,
        productName: params.productName.trim() || undefined,
        status: params.status === '' ? undefined : params.status,
      })
      if (current !== request) return
      plans.value = res.data.list ?? []
      total.value = res.data.total ?? 0
      expanded.value = expanded.value.filter((id) => plans.value.some((p) => String(p.id) === id))
    } catch {
      if (current === request) {
        failed.value = true
        plans.value = []
        total.value = 0
      }
    } finally {
      if (current === request) loading.value = false
    }
  }
  function onExpand(_row: ProductionPlan, rows: ProductionPlan[] | boolean) {
    if (Array.isArray(rows)) expanded.value = rows.map((r) => String(r.id))
  }
  function search() {
    params.pageNum = 1
    void load()
  }
  function reset() {
    params.planNo = ''
    params.productName = ''
    params.status = ''
    search()
  }
  function openPlan(plan?: ProductionPlan) {
    editingPlan.value = plan
    showPlan.value = true
  }
  function planSaved() {
    showPlan.value = false
    if (!editingPlan.value) params.pageNum = 1
    void load()
  }
  function itemSaved() {
    const id = editor.value?.plan.id
    editor.value = undefined
    if (id == null) return
    revisions[id] = (revisions[id] ?? 0) + 1
    if (!expanded.value.includes(String(id))) expanded.value.push(String(id))
  }
  onMounted(load)
</script>
