<template>
  <el-dialog
    :model-value="true"
    :title="readonly ? '销售单详情' : order ? '编辑销售单' : '新增销售单'"
    width="min(1080px, 94vw)"
    top="5vh"
    :close-on-click-modal="false"
    :before-close="close">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      :disabled="saving || readonly"
      scroll-to-error
      :scroll-into-view-options="{ block: 'nearest', inline: 'nearest' }">
      <div class="form-section-heading">基本信息</div>
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
      <div class="form-section-heading">商品信息</div>
      <el-form-item v-if="!readonly" label="添加商品">
        <PlanResourceSelect
          :fetch="fetchProducts"
          placeholder="搜索并添加商品，可添加多个"
          @select="addProduct" />
      </el-form-item>
      <el-form-item label="商品明细" prop="items">
        <el-table :data="form.items" empty-text="请添加至少一个商品">
          <el-table-column prop="productName" label="商品名称" min-width="160" />
          <el-table-column prop="model" label="型号" min-width="120" />
          <el-table-column label="单位" width="110">
            <template #default="{ row }">
              <el-input v-if="!readonly" v-model="row.unit" maxlength="20" aria-label="商品单位" />
              <span v-else>{{ row.unit || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!readonly" label="操作" width="70">
            <template #default="{ $index }">
              <el-button
                link
                type="danger"
                :disabled="saving"
                @click="form.items.splice($index, 1)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <div class="form-section-heading">配置与备注</div>
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-medium">配置明细</span>
        <el-button
          v-if="!readonly"
          type="primary"
          link
          :disabled="saving"
          @click="addConfiguration">
          添加配置
        </el-button>
      </div>
      <el-table :data="form.configurationDetails" border empty-text="暂无配置明细" class="mb-5">
        <el-table-column label="编号" min-width="110">
          <template #default="{ row }">
            <span v-if="readonly">{{ row.code ?? '-' }}</span>
            <template v-else><el-input v-model="row.code" aria-label="编号" /></template>
          </template>
        </el-table-column>
        <el-table-column label="名称" min-width="150">
          <template #default="{ row }">
            <span v-if="readonly">{{ row.name ?? '-' }}</span>
            <template v-else><el-input v-model="row.name" aria-label="名称" /></template>
          </template>
        </el-table-column>
        <el-table-column label="规格" min-width="150">
          <template #default="{ row }">
            <span v-if="readonly">{{ row.spec ?? '-' }}</span>
            <template v-else><el-input v-model="row.spec" aria-label="规格" /></template>
          </template>
        </el-table-column>
        <el-table-column label="数量" min-width="145">
          <template #default="{ row }">
            <span v-if="readonly">{{ row.quantity ?? '-' }}</span>
            <template v-else>
              <el-input-number
                v-model="row.quantity"
                :min="0"
                :controls="false"
                class="w-full!"
                aria-label="数量" />
            </template>
          </template>
        </el-table-column>
        <el-table-column label="单位" min-width="85">
          <template #default="{ row }">
            <span v-if="readonly">{{ row.unit ?? '-' }}</span>
            <template v-else><el-input v-model="row.unit" aria-label="单位" /></template>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">
            <span v-if="readonly">{{ row.remark ?? '-' }}</span>
            <template v-else><el-input v-model="row.remark" aria-label="备注" /></template>
          </template>
        </el-table-column>
        <el-table-column v-if="!readonly" label="操作" width="70" fixed="right">
          <template #default="{ $index }">
            <el-button
              link
              type="danger"
              :disabled="saving"
              @click="form.configurationDetails.splice($index, 1)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
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
  import { reactive, ref } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { saleOrderApi } from '@/api/saleOrder'
  import { productApi } from '@/api/product'
  import { saleOrderStatuses, type SaleOrder } from '@/types/saleOrderType'
  import PlanResourceSelect, {
    type ResourceOption,
  } from '@/components/productionPlan/PlanResourceSelect.vue'
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
    items: [
      { type: 'array', required: true, min: 1, message: '请至少添加一个商品', trigger: 'change' },
    ],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  }
  async function fetchProducts(query: string, page: number) {
    const res = await productApi.list({
      pageNum: page,
      pageSize: 20,
      name: query.trim() || undefined,
      status: 1,
    })
    return {
      total: res.data.total,
      list: res.data.list.map((p) => ({ ...p, label: `${p.name} / ${p.model || '-'}` })),
    }
  }
  function addProduct(product: ResourceOption) {
    if (form.items.some((item) => item.productId === product.id)) {
      ElMessage.info('该商品已添加')
      return
    }
    selectSaleOrderProduct(form, {
      id: product.id,
      name: String(product.name),
      model: String(product.model || ''),
    })
    formRef.value?.clearValidate('items')
  }
  function addConfiguration() {
    form.configurationDetails.push({
      code: '',
      name: '',
      spec: '',
      quantity: null,
      unit: '',
      remark: '',
    })
  }
  function close() {
    if (!saving.value) emit('closed')
  }
  async function save() {
    if (props.readonly || saving.value) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid || !form.items.length) return
    saving.value = true
    try {
      const payload = {
        ...form,
        orderNo: form.orderNo.trim(),
        customerName: form.customerName.trim(),
        items: form.items.map((item) => ({ ...item, unit: item.unit?.trim() || '' })),
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
</script>
