<template>
  <div>
    <BaseTableContainer>
      <template #header-right-content>
        <el-button type="primary" @click="handleCreate">新增部门</el-button>
      </template>
      <template #filter-content>
        <BaseSearchForm @search="onSearch" @reset="onReset">
          <template #default>
            <el-form-item label="部门名称" prop="name">
              <el-input
                v-model="params.name"
                placeholder="请输入部门名称"
                clearable
                class="w-60!" />
            </el-form-item>
          </template>
        </BaseSearchForm>
      </template>
      <template #content>
        <el-table v-loading="loading" :data="departments" highlight-current-row class="mt-3">
          <el-table-column prop="name" label="名称" min-width="180" />
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }"> {{ dayjsFormat(row.createTime) }} </template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }"> {{ dayjsFormat(row.updateTime) }} </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="120">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEdit(row)">
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <BasePagination
          :total="params.total"
          v-model:page-num="params.pageNum"
          v-model:page-size="params.pageSize"
          @size-change="loadDepartments"
          @current-change="loadDepartments" />
      </template>
    </BaseTableContainer>

    <DepartmentDialog
      v-if="showEditDialog"
      :department="department"
      @saved="handleSaved"
      @closed="toggleDialog" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { useDayjs } from '@/util/dayjs'

  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BasePagination from '@/components/base/BasePagination.vue'
  import DepartmentDialog from '@/components/department/DepartmentDialog.vue'

  import type { Department } from '@/types/departmentType'
  import { departmentApi } from '@/api/department'

  const { dayjsFormat } = useDayjs()

  interface SearchParams {
    total: number
    pageNum: number
    pageSize: number
    externalId: number | null
    externalName: string
    name: string
  }

  const params = reactive<SearchParams>({
    total: 0,
    pageNum: 1,
    pageSize: 10,
    externalId: null,
    externalName: '',
    name: '',
  })

  onMounted(() => {
    loadDepartments()
  })

  const departments = ref<Department[]>([])
  const loading = ref(false)
  const loadDepartments = () => {
    loading.value = true
    departmentApi
      .list(params)
      .then((res) => {
        const { list, total } = res.data || {}
        params.total = total
        departments.value = list
      })
      .finally(() => {
        loading.value = false
      })
  }

  const onSearch = () => {
    params.pageNum = 1
    loadDepartments()
  }
  const onReset = () => {
    onSearch()
  }

  // edit / create dialog
  const showEditDialog = ref(false)
  const department = ref<Department | undefined>()
  const toggleDialog = () => {
    showEditDialog.value = !showEditDialog.value
  }

  const handleCreate = () => {
    department.value = undefined
    toggleDialog()
  }

  const handleEdit = (item: any) => {
    department.value = item
    toggleDialog()
  }

  const handleSaved = (item: Department) => {
    const index = departments.value.findIndex((c) => c.id === item.id)
    if (index !== -1) {
      departments.value.splice(index, 1, item)
    } else {
      departments.value.unshift(item)
    }

    toggleDialog()
  }
</script>

<style lang="less" scoped></style>
