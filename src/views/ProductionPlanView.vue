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
      <el-table v-loading="loading" :data="plans" row-key="id">
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
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPlan(row as ProductionPlan)">编辑</el-button>
            <el-button
              link
              type="primary"
              @click="router.push({ name: 'production-plan-manage', params: { id: row.id } })">
              计划详情
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
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { Plus } from '@element-plus/icons-vue'
  import { productionPlanApi } from '@/api/productionPlan'
  import { planStatuses, type ProductionPlan } from '@/types/productionPlanType'
  import ProductionPlanDialog from '@/components/productionPlan/ProductionPlanDialog.vue'
  const router = useRouter()
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
  onMounted(load)
</script>
