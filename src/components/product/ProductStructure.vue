<template>
  <div v-loading="loading" class="px-6 py-3">
    <div v-if="failed" class="flex items-center gap-3">
      <span>产品结构加载失败</span>
      <el-button link type="primary" @click="load">重新加载</el-button>
    </div>
    <el-table
      v-else
      :data="parts"
      row-key="id"
      size="small"
      empty-text="暂无部件，请点击产品右侧的新增部件">
      <el-table-column type="expand">
        <template #default="{ row: part }">
          <el-table
            :data="part.operations ?? []"
            row-key="id"
            class="my-3"
            empty-text="暂无工序，请点击部件右侧的新增工序">
            <el-table-column prop="name" label="工序名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="标准工序" width="100">
              <template #default="{ row }">{{ row.standardFlag === 1 ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column label="标准工时（分钟）" min-width="150">
              <template #default="{ row }">{{ row.stdTime ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">{{ row.status === 1 ? '启用' : '停用' }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  @click="
                    emit('edit', {
                      kind: 'operation',
                      product,
                      part: part as Part,
                      record: row as Operation,
                    })
                  ">
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="部件名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="工序数" width="90">
        <template #default="{ row }">{{ row.operations?.length ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">{{ row.status === 1 ? '启用' : '停用' }}</template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="emit('edit', { kind: 'part', product, record: row as Part })">
            编辑
          </el-button>
          <el-button
            link
            type="primary"
            @click="emit('edit', { kind: 'operation', product, part: row as Part })">
            新增工序
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { productApi } from '@/api/product'
  import type { CatalogEditor, Operation, Part, Product } from '@/types/productType'

  const props = defineProps<{ product: Product; revision: number }>()
  const emit = defineEmits<{ edit: [editor: CatalogEditor] }>()
  const parts = ref<Part[]>([])
  const loading = ref(false)
  const failed = ref(false)
  let requestId = 0
  async function load() {
    const current = ++requestId
    loading.value = true
    failed.value = false
    try {
      const res = await productApi.get(props.product.id)
      if (current === requestId) parts.value = res.data.parts ?? []
    } catch {
      if (current === requestId) failed.value = true
    } finally {
      if (current === requestId) loading.value = false
    }
  }
  watch(() => [props.product.id, props.revision], load, { immediate: true })
</script>
