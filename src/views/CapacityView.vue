<template>
  <div class="space-y-5">
    <el-card>
      <h2 class="mb-2 text-lg font-semibold">预计产能</h2>
      <p class="mb-6 text-sm text-gray-500">按产品标准工时、计划件数与人员投入测算所需天数。</p>
      <el-form label-position="top" class="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        <el-form-item label="产品">
          <PlanResourceSelect
            :model-value="productId"
            :selected-label="productLabel"
            :fetch="fetchProducts"
            placeholder="搜索产品名称"
            class="w-full"
            @select="selectProduct" />
        </el-form-item>
        <el-form-item label="计划件数">
          <el-input-number
            v-model="quantity"
            :min="1"
            :max="2147483647"
            :precision="0"
            class="w-full!" />
        </el-form-item>
        <el-form-item label="投入人数">
          <el-input-number
            v-model="people"
            :min="1"
            :max="2147483647"
            :precision="0"
            class="w-full!" />
        </el-form-item>
        <el-form-item label="每人每天工时（小时）">
          <el-input-number v-model="hours" :min="0.01" :max="24" :precision="2" class="w-full!" />
        </el-form-item>
      </el-form>
      <div class="rounded-lg bg-gray-50 p-4 text-sm leading-7 text-gray-600">
        预估天数 = 单件标准工时合计（分钟）× 计划件数 ÷ 60 ÷ 投入人数 ÷ 每人每天工时（小时）
        <div class="text-xs text-gray-500">仅计算启用部件下启用的标准工序；不包含非标准工序。</div>
      </div>
    </el-card>
    <el-card v-loading="loading">
      <div v-if="failed" class="py-8 text-center">
        <p>产品工序加载失败</p>
        <el-button @click="loadProduct">重试</el-button>
      </div>
      <el-empty v-else-if="!product && !loading" description="请选择产品以开始测算" />
      <div v-else-if="!product" class="min-h-60" />
      <template v-else>
        <div class="mb-5 flex items-center justify-between gap-4">
          <h3 class="m-0 text-base font-semibold">{{ product.name }}</h3>
          <el-button link type="primary" @click="loadProduct">刷新标准工时</el-button>
        </div>
        <el-alert
          v-if="work.incomplete"
          title="部分标准工序未配置有效工时，请完善标准产品后重新测算。"
          type="warning"
          :closable="false"
          class="mb-4!" />
        <el-alert
          v-else-if="!work.operations.length"
          title="该产品暂无启用的标准工序，无法测算。"
          type="info"
          :closable="false"
          class="mb-4!" />
        <el-alert
          v-else-if="!result"
          title="请填写有效件数、人数和每日工时。"
          type="info"
          :closable="false"
          class="mb-4!" />
        <div v-if="result" class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl bg-blue-50 p-5">
            <div class="text-sm text-blue-700">预估天数</div>
            <div class="mt-2 text-3xl font-semibold text-blue-700">
              {{ result.days < 0.01 ? '< 0.01' : number(result.days) }}
              <span class="text-sm font-normal">天</span>
            </div>
          </div>
          <div class="rounded-xl bg-gray-50 p-5">
            <div class="text-sm text-gray-500">单件标准工时</div>
            <div class="mt-2 text-2xl font-semibold">
              {{ number(work.minutes) }}
              <span class="text-sm font-normal">分钟</span>
            </div>
          </div>
          <div class="rounded-xl bg-gray-50 p-5">
            <div class="text-sm text-gray-500">总标准工时</div>
            <div class="mt-2 text-2xl font-semibold">
              {{ number(result.totalHours) }}
              <span class="text-sm font-normal">小时</span>
            </div>
          </div>
          <div class="rounded-xl bg-gray-50 p-5">
            <div class="text-sm text-gray-500">每日投入工时</div>
            <div class="mt-2 text-2xl font-semibold">
              {{ number(result.dailyHours) }}
              <span class="text-sm font-normal">人时 / 天</span>
            </div>
          </div>
        </div>
        <h3 class="mb-3 text-base font-semibold">
          标准工序明细（{{ work.operations.length }} 道）
        </h3>
        <el-table :data="work.operations" border>
          <el-table-column prop="partName" label="部件" min-width="180" />
          <el-table-column prop="name" label="工序" min-width="180" />
          <el-table-column label="单件标准工时（分钟）" min-width="180">
            <template #default="{ row }">
              {{ row.minutes != null && row.minutes > 0 ? row.minutes : '未配置' }}
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>
  </div>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue'
  import PlanResourceSelect, {
    type ResourceOption,
  } from '@/components/productionPlan/PlanResourceSelect.vue'
  import { productApi } from '@/api/product'
  import type { Product } from '@/types/productType'
  import { standardWork, estimateCapacity } from '@/utils/capacity'
  const productId = ref<number>(),
    productLabel = ref(''),
    product = ref<Product>()
  const quantity = ref(1),
    people = ref(1),
    hours = ref(8)
  const loading = ref(false),
    failed = ref(false)
  const work = computed(() =>
    product.value ? standardWork(product.value) : { operations: [], incomplete: false, minutes: 0 }
  )
  const result = computed(() =>
    !failed.value && !work.value.incomplete
      ? estimateCapacity(work.value.minutes, quantity.value, people.value, hours.value)
      : null
  )
  const number = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  async function fetchProducts(name: string, pageNum: number) {
    const res = await productApi.list({ name, status: 1, pageNum, pageSize: 20 })
    return { list: res.data.list.map((p) => ({ id: p.id, label: p.name })), total: res.data.total }
  }
  function selectProduct(option: ResourceOption) {
    if (productId.value === option.id && !failed.value) return
    productId.value = option.id
    productLabel.value = option.label
    void loadProduct()
  }
  let request = 0
  async function loadProduct() {
    if (productId.value == null) return
    const current = ++request
    loading.value = true
    failed.value = false
    try {
      const res = await productApi.get(productId.value)
      if (current === request) {
        if (res.data.status !== 1) {
          failed.value = true
          return
        }
        product.value = res.data
      }
    } catch {
      if (current === request) failed.value = true
    } finally {
      if (current === request) loading.value = false
    }
  }
</script>
<style lang="less" scoped></style>
