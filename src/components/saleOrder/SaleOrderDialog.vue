<template>
  <el-dialog
    :model-value="true"
    :title="readonly ? '销售单详情' : order ? '编辑销售单' : '新增销售单'"
    width="min(720px, 94vw)"
    top="5vh"
    :close-on-click-modal="false"
    :before-close="close">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      :disabled="saving || readonly">
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <el-form-item label="销售单号" prop="orderNo">
          <el-input v-model="form.orderNo" :maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="form.customerName" :maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="下单日期" prop="orderDate">
          <el-date-picker
            v-model="form.orderDate"
            type="date"
            value-format="YYYY-MM-DD"
            class="w-full!" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option
              v-for="item in saleOrderStatuses"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="产品" prop="productId">
        <el-input v-if="readonly" :model-value="form.productName" />
        <el-select
          v-else
          :model-value="form.productId"
          filterable
          remote
          :remote-method="searchProducts"
          :loading="productLoading"
          placeholder="按产品名称搜索"
          @change="chooseProduct">
          <el-option
            v-for="product in productOptions"
            :key="product.id"
            :value="product.id"
            :label="productLabel(product)" />
          <template #footer>
            <el-button v-if="productFailed" link type="primary" @click="loadProducts(false)">
              加载失败，重试
            </el-button>
            <el-button
              v-else-if="hasMore"
              link
              type="primary"
              :loading="productLoading"
              @click="loadProducts(true)">
              加载更多产品
            </el-button>
            <span v-else class="text-xs text-gray-500">可按名称搜索已启用的产品</span>
          </template>
        </el-select>
      </el-form-item>
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <el-form-item label="产品名称">
          <el-input :model-value="form.productName" readonly />
        </el-form-item>
        <el-form-item label="型号"><el-input :model-value="form.model" readonly /></el-form-item>
        <el-form-item label="单位">
          <el-input v-model="form.unit" :maxlength="20" placeholder="如：台、件" />
        </el-form-item>
      </div>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          :maxlength="255"
          show-word-limit />
      </el-form-item>
    </el-form>
    <div v-if="readonly && order" class="text-xs text-gray-500">
      创建时间：{{ dayjsFormat(order.createTime) || '-' }}　更新时间：{{
        dayjsFormat(order.updateTime) || '-'
      }}
    </div>
    <template #footer>
      <el-button :disabled="saving" @click="close">{{ readonly ? '关闭' : '取消' }}</el-button>
      <el-button v-if="!readonly" type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { saleOrderApi } from '@/api/saleOrder'
  import { productApi } from '@/api/product'
  import { saleOrderStatuses, type SaleOrder } from '@/types/saleOrderType'
  import type { Product } from '@/types/productType'
  import { createSaleOrderForm, selectSaleOrderProduct } from '@/utils/saleOrder'
  import { useDayjs } from '@/util/dayjs'

  const props = defineProps<{ order?: SaleOrder; readonly?: boolean }>()
  const emit = defineEmits<{ closed: []; saved: [] }>()
  const { dayjs, dayjsFormat } = useDayjs()
  const form = reactive(createSaleOrderForm(props.order, dayjs().format('YYYY-MM-DD')))
  const formRef = ref<FormInstance>()
  const saving = ref(false)
  const rules: FormRules = {
    orderNo: [{ required: true, whitespace: true, message: '请输入销售单号', trigger: 'blur' }],
    customerName: [
      { required: true, whitespace: true, message: '请输入客户名称', trigger: 'blur' },
    ],
    orderDate: [{ required: true, message: '请选择下单日期', trigger: 'change' }],
    productId: [{ required: true, message: '请选择产品', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  }
  type ProductOption = Pick<Product, 'id' | 'name' | 'model'>
  const products = ref<ProductOption[]>([])
  const selectedProduct = ref<ProductOption | undefined>(
    props.order
      ? {
          id: props.order.productId,
          name: props.order.productName,
          model: props.order.model,
        }
      : undefined
  )
  const productOptions = computed(() =>
    selectedProduct.value
      ? [selectedProduct.value, ...products.value.filter((p) => p.id !== selectedProduct.value?.id)]
      : products.value
  )
  const productLoading = ref(false)
  const productFailed = ref(false)
  const hasMore = ref(false)
  let productQuery = ''
  let productPage = 0
  let requestId = 0
  function productLabel(product: ProductOption) {
    return product.model ? `${product.name} / ${product.model}` : product.name
  }
  function searchProducts(query: string) {
    productQuery = query.trim()
    void loadProducts(false)
  }
  async function loadProducts(more: boolean) {
    if (more && productLoading.value) return
    const current = ++requestId
    const page = more ? productPage + 1 : 1
    productLoading.value = true
    productFailed.value = false
    if (!more) products.value = []
    try {
      const res = await productApi.list({
        pageNum: page,
        pageSize: 20,
        name: productQuery || undefined,
        status: 1,
      })
      if (current !== requestId) return
      products.value = more ? [...products.value, ...res.data.list] : res.data.list
      productPage = page
      hasMore.value = page * 20 < res.data.total
    } catch {
      if (current === requestId) productFailed.value = true
    } finally {
      if (current === requestId) productLoading.value = false
    }
  }
  function chooseProduct(id: number) {
    const product = productOptions.value.find((p) => p.id === id)
    if (!product) return
    selectSaleOrderProduct(form, product)
    selectedProduct.value = product
  }
  function close() {
    if (!saving.value) emit('closed')
  }
  async function save() {
    if (props.readonly || saving.value) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid || form.productId == null) return
    saving.value = true
    try {
      const payload = {
        ...form,
        productId: form.productId,
        orderNo: form.orderNo.trim(),
        customerName: form.customerName.trim(),
        unit: form.unit.trim(),
      }
      if (props.order) await saleOrderApi.update({ ...payload, id: props.order.id })
      else await saleOrderApi.create(payload)
      ElMessage.success('销售单保存成功')
      emit('saved')
    } catch {
      // API errors are reported by the shared interceptor. Preserve edits for retry.
    } finally {
      saving.value = false
    }
  }
  onMounted(() => {
    if (!props.readonly) void loadProducts(false)
  })
</script>
