<template>
  <BaseTableContainer>
    <template #header-left-content><span class="font-semibold">标准产品管理</span></template>
    <template #header-right-content>
      <el-button :icon="Plus" type="primary" @click="editor = { kind: 'product' }">
        新增标准产品
      </el-button>
    </template>
    <template #filter-content>
      <BaseSearchForm @search="search" @reset="reset">
        <el-form-item label="产品名称">
          <el-input v-model="params.name" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="params.model" placeholder="请输入型号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" class="w-32!">
            <el-option label="全部" value="" />
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
      </BaseSearchForm>
    </template>
    <template #content>
      <div v-if="failed" class="my-3">
        产品加载失败，
        <el-button link type="primary" @click="load">重新加载</el-button>
      </div>
      <el-table
        v-loading="loading"
        :data="products"
        row-key="id"
        :expand-row-keys="expandedIds"
        @expand-change="onExpand">
        <el-table-column type="expand">
          <template #default="{ row }">
            <ProductStructure
              v-if="expandedIds.includes(String(row.id))"
              :product="row as Product"
              :revision="revisions[row.id] ?? 0"
              @edit="editor = $event" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="产品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="model" label="型号" min-width="140" show-overflow-tooltip />
        <el-table-column prop="spec" label="规格" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="editor = { kind: 'product', record: row as Product }">
              编辑
            </el-button>
            <el-button
              link
              type="primary"
              @click="editor = { kind: 'part', product: row as Product }">
              新增部件
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
  <CatalogDialog v-if="editor" :editor="editor" @closed="editor = undefined" @saved="saved" />
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BasePagination from '@/components/base/BasePagination.vue'
  import CatalogDialog from '@/components/product/CatalogDialog.vue'
  import ProductStructure from '@/components/product/ProductStructure.vue'
  import { productApi } from '@/api/product'
  import type { CatalogEditor, CatalogStatus, Product } from '@/types/productType'

  const params = reactive({
    pageNum: 1,
    pageSize: 10,
    name: '',
    model: '',
    status: '' as CatalogStatus | '',
  })
  const products = ref<Product[]>([])
  const total = ref(0)
  const loading = ref(false)
  const failed = ref(false)
  const expandedIds = ref<string[]>([])
  const revisions = reactive<Record<number, number>>({})
  const editor = ref<CatalogEditor>()
  let requestId = 0

  async function load() {
    const current = ++requestId
    loading.value = true
    failed.value = false
    try {
      const res = await productApi.list({
        pageNum: params.pageNum,
        pageSize: params.pageSize,
        name: params.name.trim() || undefined,
        model: params.model.trim() || undefined,
        status: params.status === '' ? undefined : params.status,
      })
      if (current !== requestId) return
      products.value = res.data.list ?? []
      total.value = res.data.total ?? 0
      expandedIds.value = expandedIds.value.filter((id) =>
        products.value.some((p) => String(p.id) === id)
      )
    } catch {
      if (current === requestId) {
        failed.value = true
        products.value = []
        total.value = 0
      }
    } finally {
      if (current === requestId) loading.value = false
    }
  }
  function onExpand(_row: Product, rows: Product[] | boolean) {
    if (!Array.isArray(rows)) return
    expandedIds.value = rows.map((row) => String(row.id))
  }
  function search() {
    params.pageNum = 1
    void load()
  }
  function reset() {
    params.name = ''
    params.model = ''
    params.status = ''
    search()
  }
  function saved() {
    const current = editor.value
    editor.value = undefined
    if (current && current.kind !== 'product') {
      const id = current.product.id
      revisions[id] = (revisions[id] ?? 0) + 1
      if (!expandedIds.value.includes(String(id))) expandedIds.value.push(String(id))
    } else {
      if (!current?.record) params.pageNum = 1
      void load()
    }
  }
  onMounted(load)
</script>
