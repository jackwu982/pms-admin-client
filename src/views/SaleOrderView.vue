<template>
  <BaseTableContainer>
    <template #header-left-content><span class="font-semibold">销售单管理</span></template>
    <template #header-right-content>
      <el-button :icon="Plus" type="primary" :disabled="openingId != null" @click="openCreate">
        新增销售单
      </el-button>
    </template>
    <template #filter-content>
      <BaseSearchForm @search="search" @reset="reset">
        <el-form-item label="销售单号">
          <el-input v-model="params.orderNo" clearable placeholder="请输入销售单号" />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="params.customerName" clearable placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" :empty-values="[null, undefined]" class="w-32!">
            <el-option label="全部" value="" />
            <el-option
              v-for="item in saleOrderStatuses"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
        <template #more>
          <el-form-item label="产品名称">
            <el-input v-model="params.productName" clearable placeholder="请输入产品名称" />
          </el-form-item>
          <el-form-item label="型号">
            <el-input v-model="params.model" clearable placeholder="请输入型号" />
          </el-form-item>
        </template>
      </BaseSearchForm>
    </template>
    <template #content>
      <div v-if="failed" class="my-3">
        销售单加载失败，
        <el-button link type="primary" @click="load">重新加载</el-button>
      </div>
      <el-table v-loading="loading" :data="orders" row-key="id">
        <el-table-column prop="orderNo" label="销售单号" min-width="170" show-overflow-tooltip />
        <el-table-column
          prop="customerName"
          label="客户名称"
          min-width="160"
          show-overflow-tooltip />
        <el-table-column prop="orderDate" label="下单日期" width="120" />
        <el-table-column
          prop="productName"
          label="产品名称"
          min-width="160"
          show-overflow-tooltip />
        <el-table-column prop="model" label="型号" min-width="130" show-overflow-tooltip />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">
              {{ saleOrderStatuses.find((s) => s.value === row.status)?.label ?? '未知状态' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="openingId != null"
              @click="openOrder(row.id, true)">
              详情
            </el-button>
            <el-button
              link
              type="primary"
              :loading="openingId === row.id"
              :disabled="openingId != null"
              @click="openOrder(row.id, false)">
              编辑
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
  <SaleOrderDialog
    v-if="showDialog"
    :order="editingOrder"
    :readonly="readonly"
    @closed="showDialog = false"
    @saved="saved" />
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BasePagination from '@/components/base/BasePagination.vue'
  import SaleOrderDialog from '@/components/saleOrder/SaleOrderDialog.vue'
  import { saleOrderApi } from '@/api/saleOrder'
  import { saleOrderStatuses, type SaleOrder, type SaleOrderStatus } from '@/types/saleOrderType'

  const params = reactive({
    pageNum: 1,
    pageSize: 10,
    orderNo: '',
    customerName: '',
    productName: '',
    model: '',
    status: '' as SaleOrderStatus | '',
  })
  const orders = ref<SaleOrder[]>([])
  const total = ref(0)
  const loading = ref(false)
  const failed = ref(false)
  const showDialog = ref(false)
  const editingOrder = ref<SaleOrder>()
  const readonly = ref(false)
  const openingId = ref<number>()
  let requestId = 0
  function statusTag(status: SaleOrderStatus) {
    if (status === 1) return 'primary'
    if (status === 2) return 'warning'
    if (status === 3) return 'success'
    return 'info'
  }
  async function load() {
    const current = ++requestId
    loading.value = true
    failed.value = false
    try {
      const res = await saleOrderApi.list({
        pageNum: params.pageNum,
        pageSize: params.pageSize,
        orderNo: params.orderNo.trim() || undefined,
        customerName: params.customerName.trim() || undefined,
        productName: params.productName.trim() || undefined,
        model: params.model.trim() || undefined,
        status: params.status === '' ? undefined : params.status,
      })
      if (current !== requestId) return
      orders.value = res.data.list ?? []
      total.value = res.data.total ?? 0
    } catch {
      if (current === requestId) {
        failed.value = true
        orders.value = []
        total.value = 0
      }
    } finally {
      if (current === requestId) loading.value = false
    }
  }
  function search() {
    params.pageNum = 1
    void load()
  }
  function reset() {
    Object.assign(params, { orderNo: '', customerName: '', productName: '', model: '', status: '' })
    search()
  }
  function openCreate() {
    editingOrder.value = undefined
    readonly.value = false
    showDialog.value = true
  }
  async function openOrder(id: number, viewOnly: boolean) {
    if (openingId.value != null) return
    openingId.value = id
    try {
      const res = await saleOrderApi.get(id)
      editingOrder.value = res.data
      readonly.value = viewOnly
      showDialog.value = true
    } catch {
      // Keep the list available when the detail request fails.
    } finally {
      openingId.value = undefined
    }
  }
  function saved() {
    showDialog.value = false
    if (!editingOrder.value) params.pageNum = 1
    void load()
  }
  onMounted(load)
</script>
