<template>
  <el-dialog
    :model-value="true"
    :title="plan ? '编辑生产计划' : '新增生产计划'"
    width="min(680px, 94vw)"
    :close-on-click-modal="false"
    :before-close="close">
    <el-alert
      v-if="!plan"
      title="创建后自动复制标准产品的全部部件和工序；不使用的项目可关闭“纳入生产”。"
      type="info"
      :closable="false"
      class="mb-4" />
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      :disabled="saving"
      scroll-to-error
      :scroll-into-view-options="{ block: 'nearest', inline: 'nearest' }">
      <div class="form-section-heading">计划信息</div>
      <el-form-item label="计划编号" prop="planNo">
        <el-input v-model="form.planNo" maxlength="50" placeholder="请输入唯一计划编号" />
      </el-form-item>
      <el-form-item label="关联销售单（可选）">
        <el-input
          v-if="plan"
          :model-value="plan.saleOrderId ? String(plan.saleOrderId) : '未关联'"
          disabled />
        <PlanResourceSelect
          v-else
          :model-value="form.saleOrderId"
          :selected-label="saleOrderLabel"
          :fetch="fetchOrders"
          placeholder="按销售单号搜索"
          @select="selectOrder" />
      </el-form-item>
      <div class="form-section-heading">生产安排</div>
      <el-form-item label="计划产品" prop="products">
        <div class="w-full">
          <template v-if="!plan">
            <el-select
              v-if="form.saleOrderId"
              :model-value="form.products.map((item) => item.productId)"
              multiple
              placeholder="选择销售单中的多个商品"
              @change="selectOrderProducts">
              <el-option
                v-for="item in orderItems"
                :key="item.productId"
                :value="item.productId"
                :label="`${item.productName} / ${item.model || '-'}`" />
            </el-select>
            <PlanResourceSelect
              v-else
              :fetch="fetchProducts"
              placeholder="搜索并添加产品，可选择多个"
              @select="selectProduct" />
          </template>
          <div class="mt-3 flex flex-wrap gap-2">
            <el-tag
              v-for="item in form.products"
              :key="item.productId"
              :closable="!plan && !saving"
              @close="form.products = form.products.filter((p) => p.productId !== item.productId)">
              {{ item.productName }}
            </el-tag>
          </div>
        </div>
      </el-form-item>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="form.planStart"
            :clearable="false"
            value-format="YYYY-MM-DD"
            class="w-full!" />
        </el-form-item>
        <el-form-item label="结束日期" prop="planEnd">
          <el-date-picker
            v-model="form.planEnd"
            :clearable="false"
            value-format="YYYY-MM-DD"
            class="w-full!" />
        </el-form-item>
      </div>
      <el-form-item label="状态">
        <el-select v-model="form.status">
          <el-option
            v-for="(label, value) in planStatuses"
            :key="value"
            :label="label"
            :value="value" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" maxlength="255" show-word-limit />
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
  import PlanResourceSelect, { type ResourceOption } from './PlanResourceSelect.vue'
  import { productApi } from '@/api/product'
  import { saleOrderApi } from '@/api/saleOrder'
  import { productionPlanApi } from '@/api/productionPlan'
  import { planStatuses, type ProductionPlan } from '@/types/productionPlanType'
  const props = defineProps<{ plan?: ProductionPlan }>()
  const emit = defineEmits<{ closed: []; saved: [] }>()
  const p = props.plan
  const form = reactive({
    planNo: p?.planNo ?? '',
    saleOrderId: p?.saleOrderId,
    products:
      p?.products?.map((item) => ({ ...item })) ??
      (p ? [{ productId: p.productId, productName: p.productName }] : []),
    productName: p?.productName ?? '',
    planStart: p?.planStart ?? undefined,
    planEnd: p?.planEnd ?? undefined,
    status: p?.status ?? 0,
    remark: p?.remark ?? '',
  })
  const orderItems = ref<import('@/types/saleOrderType').SaleOrderItem[]>([])
  const saleOrderLabel = ref('')
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const rules: FormRules = {
    planNo: [{ required: true, whitespace: true, message: '请输入计划编号', trigger: 'blur' }],
    products: [
      { type: 'array', required: true, min: 1, message: '请至少选择一个产品', trigger: 'change' },
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
  }
  async function fetchProducts(query: string, page: number) {
    const res = await productApi.list({
      name: query || undefined,
      status: 1,
      pageNum: page,
      pageSize: 20,
    })
    return {
      total: res.data.total,
      list: res.data.list.map((p) => ({ ...p, label: `${p.name} / ${p.model || '-'}（${p.id}）` })),
    }
  }
  async function fetchOrders(query: string, page: number) {
    const res = await saleOrderApi.list({
      orderNo: query || undefined,
      pageNum: page,
      pageSize: 20,
    })
    return {
      total: res.data.total,
      list: res.data.list.map((o) => ({ ...o, label: `${o.orderNo} / ${o.customerName}` })),
    }
  }
  function selectOrder(o: ResourceOption) {
    form.saleOrderId = o.id
    saleOrderLabel.value = o.label
    orderItems.value = (o.items as import('@/types/saleOrderType').SaleOrderItem[]) || []
    selectOrderProducts(orderItems.value.map((item) => item.productId))
    formRef.value?.clearValidate('products')
  }
  function selectOrderProducts(ids: number[]) {
    form.products = orderItems.value
      .filter((item) => ids.includes(item.productId))
      .map((item) => ({ productId: item.productId, productName: item.productName }))
  }
  function selectProduct(product: ResourceOption) {
    if (form.products.some((item) => item.productId === product.id)) {
      ElMessage.info('该产品已添加')
      return
    }
    form.products.push({ productId: product.id, productName: String(product.name) })
    formRef.value?.clearValidate('products')
  }
  function close() {
    if (!saving.value) emit('closed')
  }
  async function save() {
    if (
      saving.value ||
      !(await formRef.value?.validate().catch(() => false)) ||
      !form.products.length
    )
      return
    saving.value = true
    try {
      const payload = {
        ...form,
        productId: form.products[0]!.productId,
        productName: form.products.map((item) => item.productName).join('、'),
        planNo: form.planNo.trim(),
      }
      if (p) await productionPlanApi.update({ ...payload, id: p.id })
      else await productionPlanApi.create(payload)
      ElMessage.success('计划保存成功')
      emit('saved')
    } catch {
      /* Shared interceptor reports API errors. */
    } finally {
      saving.value = false
    }
  }
</script>
