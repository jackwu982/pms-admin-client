<template>
  <BaseTableContainer>
    <template #header-right-content>
      <el-button type="primary" @click="edit()">新增设备</el-button>
    </template>
    <template #filter-content>
      <BaseSearchForm @search="search" @reset="reset">
        <el-form-item label="设备">
          <el-input v-model="params.keyword" placeholder="编号 / 名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" clearable placeholder="全部状态" class="w-40!">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
      </BaseSearchForm>
    </template>
    <template #content>
      <el-alert v-if="failed" title="设备加载失败，请重试" type="error" :closable="false" />
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="code" label="编号" min-width="140" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近保养时间" width="180">
          <template #default="{ row }">
            {{ row.lastMaintenanceTime ? dayjsFormat(row.lastMaintenanceTime) : '未记录' }}
          </template>
        </el-table-column>
        <el-table-column label="保养周期" width="120">
          <template #default="{ row }">{{ row.maintenanceCycleDays }} 天</template>
        </el-table-column>
        <el-table-column prop="ownerName" label="设备负责人" min-width="140" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="maintainingIds.has(row.id)"
              @click="edit(row as Equipment)">
              编辑
            </el-button>
            <el-button
              link
              type="success"
              :loading="maintainingIds.has(row.id)"
              @click="maintain(row as Equipment)">
              保养
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <BasePagination
        :total="total"
        v-model:page-num="params.pageNum"
        v-model:page-size="params.pageSize"
        @size-change="load"
        @current-change="load" />
    </template>
  </BaseTableContainer>
  <el-dialog
    v-if="visible"
    v-model="visible"
    :title="form.id ? '编辑设备' : '新增设备'"
    width="580px"
    :close-on-click-modal="false"
    :before-close="close">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" :disabled="saving">
      <el-form-item label="编号" prop="code">
        <el-input v-model="form.code" maxlength="64" />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" maxlength="100" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">停用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="最近保养时间">
        <el-date-picker
          v-model="form.lastMaintenanceTime"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ssZ"
          placeholder="未保养可留空"
          :disabled-date="disabledDate"
          class="w-full!" />
      </el-form-item>
      <el-form-item label="保养周期" prop="maintenanceCycleDays">
        <el-input-number
          v-model="form.maintenanceCycleDays"
          :min="1"
          :max="2147483647"
          :precision="0" />
        <span class="ml-2">天</span>
      </el-form-item>
      <el-form-item label="设备负责人" prop="ownerId">
        <PlanResourceSelect
          :model-value="form.ownerId"
          :selected-label="form.ownerName"
          :fetch="fetchUsers"
          placeholder="搜索姓名 / 用户名"
          class="w-full"
          @select="selectOwner" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import PlanResourceSelect, {
    type ResourceOption,
  } from '@/components/productionPlan/PlanResourceSelect.vue'
  import { equipmentApi } from '@/api/equipment'
  import { userApi } from '@/api/user'
  import { useDayjs } from '@/util/dayjs'
  import type { Equipment } from '@/types/support'
  const { dayjsFormat } = useDayjs()
  const params = reactive({
    keyword: '',
    status: undefined as number | undefined,
    pageNum: 1,
    pageSize: 10,
  })
  const rows = ref<Equipment[]>([])
  const total = ref(0),
    loading = ref(false),
    failed = ref(false),
    visible = ref(false),
    saving = ref(false)
  const formRef = ref<FormInstance>()
  const form = ref<Equipment>({ code: '', name: '', status: 1, maintenanceCycleDays: 30 })
  const rules: FormRules = {
    code: [{ required: true, whitespace: true, message: '请输入设备编号', trigger: 'blur' }],
    name: [{ required: true, whitespace: true, message: '请输入设备名称', trigger: 'blur' }],
    ownerId: [{ required: true, message: '请选择设备负责人', trigger: 'change' }],
    maintenanceCycleDays: [
      { required: true, type: 'number', min: 1, message: '请输入正整数天数', trigger: 'change' },
    ],
  }
  let request = 0
  async function load() {
    const current = ++request
    loading.value = true
    try {
      const res = await equipmentApi.list(params)
      if (current !== request) return
      rows.value = res.data.list
      total.value = res.data.total
      failed.value = false
    } catch {
      if (current === request) failed.value = true
    } finally {
      if (current === request) loading.value = false
    }
  }
  function search() {
    params.pageNum = 1
    void load()
  }
  function reset() {
    params.keyword = ''
    params.status = undefined
    search()
  }
  function edit(row?: Equipment) {
    form.value = row
      ? { ...row }
      : { code: '', name: '', status: 1, maintenanceCycleDays: 30, lastMaintenanceTime: null }
    visible.value = true
  }
  function close(done: () => void) {
    if (!saving.value) done()
  }
  function disabledDate(date: Date) {
    return date.getTime() > Date.now()
  }
  async function fetchUsers(keyword: string, pageNum: number) {
    const res = await userApi.list({ keyword, pageNum, pageSize: 20 })
    return {
      list: res.data.list.map((u: { id: number; nickname?: string; username: string }) => ({
        id: u.id,
        label: u.nickname || u.username,
      })),
      total: res.data.total,
    }
  }
  function selectOwner(option: ResourceOption) {
    form.value.ownerId = option.id
    form.value.ownerName = option.label
  }
  async function save() {
    if (saving.value || !(await formRef.value?.validate().catch(() => false))) return
    if (
      form.value.lastMaintenanceTime &&
      new Date(form.value.lastMaintenanceTime).getTime() > Date.now()
    ) {
      ElMessage.warning('最近保养时间不能晚于当前时间')
      return
    }
    saving.value = true
    try {
      const payload = {
        ...form.value,
        code: form.value.code.trim(),
        name: form.value.name.trim(),
        lastMaintenanceTime: form.value.lastMaintenanceTime || null,
      }
      await (payload.id ? equipmentApi.update(payload) : equipmentApi.create(payload))
      ElMessage.success('保存成功')
      visible.value = false
      await load()
    } catch {
      /* API interceptor displays errors; keep the form for retry. */
    } finally {
      saving.value = false
    }
  }
  const maintainingIds = ref(new Set<number>())
  async function maintain(row: Equipment) {
    if (row.id == null || maintainingIds.value.has(row.id)) return
    maintainingIds.value.add(row.id)
    try {
      await equipmentApi.maintain(row.id)
      ElMessage.success('已记录本次保养时间')
      await load()
    } catch {
      /* Preserve the current list and allow retry. */
    } finally {
      maintainingIds.value.delete(row.id)
    }
  }
  onMounted(load)
</script>
<style lang="less" scoped></style>
