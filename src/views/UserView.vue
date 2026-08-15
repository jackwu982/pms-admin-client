<template>
  <div>
    <BaseTableContainer>
      <template #header-right-content>
        <el-button :icon="Plus" type="primary" @click="openDialog()">新增员工</el-button>
      </template>

      <template #filter-content>
        <BaseSearchForm @search="onSearch" @reset="onReset">
          <template #default>
            <el-form-item label="关键词">
              <el-input
                v-model="params.keyword"
                placeholder="用户名/昵称"
                clearable
                class="w-50!" />
            </el-form-item>
            <el-form-item label="部门">
              <el-select v-model="params.departmentId" clearable placeholder="全部" class="w-50!">
                <el-option label="全部" value="" />
                <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </template>
        </BaseSearchForm>
      </template>

      <template #content>
        <el-table v-loading="loading" :data="users" row-key="id" class="mt-3">
          <el-table-column prop="username" label="用户名" min-width="140" />
          <el-table-column prop="nickname" label="昵称" min-width="140" />
          <el-table-column label="所属部门" min-width="140">
            <template #default="{ row }">{{ getDeptName(row.departmentId) }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ dayjsFormat(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="80">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <BasePagination
          :total="total"
          v-model:page-num="params.pageNum"
          v-model:page-size="params.pageSize"
          @size-change="loadUsers"
          @current-change="loadUsers" />
      </template>
    </BaseTableContainer>

    <UserDialog v-if="showDialog" :user="editingUser" @closed="closeDialog" @saved="handleSaved" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { useDayjs } from '@/util/dayjs'

  import BaseSearchForm from '@/components/base/BaseSearchForm.vue'
  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'
  import BasePagination from '@/components/base/BasePagination.vue'
  import UserDialog from '@/components/user/UserDialog.vue'

  import { userApi } from '@/api/user'
  import type { DepartmentOption, User } from '@/types/userType'
  import { Plus } from '@element-plus/icons-vue'

  import { useCacheDepartmentStore } from '@/stores/cacheDepartment'

  const { dayjsFormat } = useDayjs()

  interface SearchParams {
    pageNum: number
    pageSize: number
    keyword: string
    departmentId: number | ''
  }

  const params = reactive<SearchParams>({
    pageNum: 1,
    pageSize: 10,
    keyword: '',
    departmentId: '',
  })

  const users = ref<User[]>([])
  const departments = ref<DepartmentOption[]>([])
  const total = ref(0)
  const loading = ref(false)

  const loadUsers = () => {
    loading.value = true
    const query: Record<string, any> = {
      pageNum: params.pageNum,
      pageSize: params.pageSize,
    }
    if (params.keyword.trim()) query.keyword = params.keyword.trim()
    if (params.departmentId !== '') query.departmentId = params.departmentId

    userApi
      .list(query)
      .then((res: any) => {
        const { list, total: t } = res.data || {}
        users.value = list ?? []
        total.value = t ?? 0
      })
      .finally(() => {
        loading.value = false
      })
  }

  const departmentStore = useCacheDepartmentStore()

  const fetchDepartments = async () => {
    departments.value = await departmentStore.getDepartments()
  }

  onMounted(() => {
    loadUsers()
    fetchDepartments()
  })

  const getDeptName = (id?: number) => {
    const d = departments.value.find((d) => d.id === id)
    return d ? d.name : '未知'
  }

  const onSearch = () => {
    params.pageNum = 1
    loadUsers()
  }

  const onReset = () => {
    params.keyword = ''
    params.departmentId = ''
    onSearch()
  }

  // create / edit dialog
  const showDialog = ref(false)
  const editingUser = ref<User | undefined>()

  const openDialog = (user?: any) => {
    editingUser.value = user
    showDialog.value = true
  }

  const closeDialog = () => {
    showDialog.value = false
  }

  const handleSaved = () => {
    showDialog.value = false
    loadUsers()
  }
</script>

<style lang="less" scoped></style>
