<template>
  <el-card v-loading="loading">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <el-button :icon="ArrowLeft" @click="router.push({ name: 'production-plan' })">
          返回生产计划
        </el-button>
        <h1 class="m-0 text-lg font-semibold">计划详情</h1>
      </div>
      <el-button v-if="plan" @click="showPlan = true">编辑计划信息</el-button>
    </div>
    <el-alert v-if="failed" type="error" :closable="false" class="mb-4">
      <template #title>
        {{ errorMessage }}
        <el-button link type="primary" @click="load">重试</el-button>
      </template>
    </el-alert>
    <template v-if="plan">
      <el-descriptions :column="1" border class="mb-6">
        <el-descriptions-item label="计划编号">{{ plan.planNo }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ plan.productName }}</el-descriptions-item>
        <el-descriptions-item label="计划日期">
          {{ plan.planStart || '未设置' }} ~ {{ plan.planEnd || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ planStatuses[plan.status] ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="plan.remark" label="备注">
          {{ plan.remark }}
        </el-descriptions-item>
      </el-descriptions>
      <ProductionPlanStructure :key="plan.id" :plan="plan" @edit="editor = $event" />
    </template>
  </el-card>
  <ProductionPlanDialog
    v-if="showPlan && plan"
    :plan="plan"
    @closed="showPlan = false"
    @saved="planSaved" />
  <PlanMembersDialog
    v-if="editor?.kind === 'member'"
    :plan="editor.plan"
    @closed="editor = undefined"
    @saved="load" />
  <PlanItemDialog
    v-else-if="editor"
    :editor="editor"
    @closed="editor = undefined"
    @saved="itemSaved" />
</template>
<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ArrowLeft } from '@element-plus/icons-vue'
  import { productionPlanApi } from '@/api/productionPlan'
  import { planStatuses, type ProductionPlan, type PlanEditor } from '@/types/productionPlanType'
  import ProductionPlanStructure from '@/components/productionPlan/ProductionPlanStructure.vue'
  import ProductionPlanDialog from '@/components/productionPlan/ProductionPlanDialog.vue'
  import PlanMembersDialog from '@/components/productionPlan/PlanMembersDialog.vue'
  import PlanItemDialog from '@/components/productionPlan/PlanItemDialog.vue'

  const route = useRoute()
  const router = useRouter()
  const plan = ref<ProductionPlan>()
  const editor = ref<PlanEditor>()
  const showPlan = ref(false)
  const loading = ref(false)
  const failed = ref(false)
  const errorMessage = ref('计划详情加载失败，请重试')
  let request = 0

  async function load() {
    const current = ++request
    const id = Number(route.params.id)
    failed.value = false
    if (!Number.isSafeInteger(id) || id <= 0) {
      loading.value = false
      failed.value = true
      errorMessage.value = '生产计划编号无效，请返回列表选择计划'
      return
    }
    loading.value = true
    errorMessage.value = '计划详情加载失败，请重试'
    try {
      const res = await productionPlanApi.get(id)
      if (current === request) plan.value = res.data
    } catch {
      if (current === request) failed.value = true
    } finally {
      if (current === request) loading.value = false
    }
  }
  function itemSaved() {
    editor.value = undefined
    void load()
  }
  function planSaved() {
    showPlan.value = false
    void load()
  }
  watch(
    () => route.params.id,
    () => {
      plan.value = undefined
      editor.value = undefined
      showPlan.value = false
      void load()
    },
    { immediate: true }
  )
</script>
