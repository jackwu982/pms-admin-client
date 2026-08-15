<template>
  <div>
    <BaseTableContainer>
      <template #header-left-content>
        <div class="w-90">
          <el-segmented v-model="publishedFilter" :options="options" block @change="onSearch" />
        </div>
      </template>

      <template #header-right-content>
        <el-button :icon="Plus" type="primary" @click="openDialog()">新增分类</el-button>
      </template>

      <template #filter-content>
        <BaseSearchForm @search="onSearch" @reset="onReset">
          <template #default>
            <el-form-item label="分类名称">
              <el-input v-model="name" placeholder="请输入分类名称" clearable class="w-50!" />
            </el-form-item>
          </template>
        </BaseSearchForm>
      </template>

      <template #content>
        <el-table v-loading="loading" :data="categories" row-key="id" class="mt-3">
          <el-table-column prop="name" label="分类名称" min-width="160" show-overflow-tooltip />
          <el-table-column label="发布状态" width="100">
            <template #default="{ row }">
              <span :class="row.published ? 'text-green-600' : 'text-gray-400'">
                {{ row.published ? '已发布' : '未发布' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ dayjsFormat(row.createTime) || '-' }}</template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">{{ dayjsFormat(row.updateTime) || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="80">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <BasePagination
          :total="total"
          v-model:page-num="pageNum"
          v-model:page-size="pageSize"
          @size-change="loadCategories"
          @current-change="loadCategories" />
      </template>
    </BaseTableContainer>

    <CategoryDialog
      v-if="showDialog"
      :category="editingCategory"
      @closed="closeDialog"
      @saved="handleSaved" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useDayjs } from '@/util/dayjs'

  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BasePagination from '@/components/base/BasePagination.vue'
  import CategoryDialog from '@/components/process/CategoryDialog.vue'

  import { categoryApi } from '@/api/category'
  import type { Category } from '@/types/categoryType'
  import { Plus } from '@element-plus/icons-vue'

  const { dayjsFormat } = useDayjs()

  const categories = ref<Category[]>([])
  const total = ref(0)
  const loading = ref(false)
  const name = ref('')
  const publishedFilter = ref<boolean | ''>('')
  const pageNum = ref(1)
  const pageSize = ref(10)

  const options = [
    { label: '全部', value: '' },
    { label: '已发布', value: true },
    { label: '未发布', value: false },
  ]

  const loadCategories = () => {
    loading.value = true
    const query: Record<string, any> = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    }
    if (name.value.trim()) query.name = name.value.trim()
    if (publishedFilter.value !== '') query.published = publishedFilter.value

    categoryApi
      .list(query)
      .then((res: any) => {
        const { list, total: t } = res.data || {}
        categories.value = list ?? []
        total.value = t ?? 0
      })
      .finally(() => {
        loading.value = false
      })
  }

  onMounted(loadCategories)

  const onSearch = () => {
    pageNum.value = 1
    loadCategories()
  }

  const onReset = () => {
    name.value = ''
    publishedFilter.value = ''
    onSearch()
  }

  // create / edit dialog
  const showDialog = ref(false)
  const editingCategory = ref<Category | undefined>()

  const openDialog = (category?: any) => {
    editingCategory.value = category
    showDialog.value = true
  }

  const closeDialog = () => {
    showDialog.value = false
  }

  const handleSaved = () => {
    showDialog.value = false
    loadCategories()
  }
</script>

<style lang="less" scoped></style>
