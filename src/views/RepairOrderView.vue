<template>
  <BaseTableContainer>
    <template #header-right-content>
      <el-button type="primary" @click="open()">新增维修单</el-button>
    </template>
    <template #filter-content>
      <BaseSearchForm @search="search" @reset="reset">
        <el-form-item label="维修单">
          <el-input v-model="params.keyword" placeholder="单号 / 维修对象" clearable />
        </el-form-item>
        <el-form-item label="维修日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期" />
        </el-form-item>
      </BaseSearchForm>
    </template>
    <template #content>
      <el-alert v-if="failed" title="加载失败，请重新搜索" type="error" :closable="false" />
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="orderNo" label="维修单号" min-width="150" />
        <el-table-column prop="repairDate" label="维修日期" width="120" />
        <el-table-column
          prop="repairObject"
          label="维修对象"
          min-width="180"
          show-overflow-tooltip />
        <el-table-column label="维修工时" width="120">
          <template #default="{ row }">{{ row.workHours }} 小时</template>
        </el-table-column>
        <el-table-column prop="repairUserName" label="维修人员" width="120" />
        <el-table-column
          prop="failureReason"
          label="故障原因"
          min-width="200"
          show-overflow-tooltip />
        <el-table-column label="材料合计" min-width="140">
          <template #default="{ row }">{{ totalMaterials(row.materials) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="open(row as RepairOrder, true)">详情</el-button>
            <el-button link type="primary" @click="open(row as RepairOrder)">编辑</el-button>
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
    :title="readonly ? '维修单详情' : form.id ? '编辑维修单' : '新增维修单'"
    width="min(1100px, 94vw)"
    :close-on-click-modal="false"
    :before-close="close">
    <template v-if="readonly">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="维修单号">{{ form.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="维修日期">{{ form.repairDate }}</el-descriptions-item>
        <el-descriptions-item label="维修对象">{{ form.repairObject }}</el-descriptions-item>
        <el-descriptions-item label="维修工时">{{ form.workHours }} 小时</el-descriptions-item>
        <el-descriptions-item label="维修人员">{{ form.repairUserName }}</el-descriptions-item>
        <el-descriptions-item label="故障原因">
          <span class="break-words whitespace-pre-wrap">{{ form.failureReason }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          <span class="break-words whitespace-pre-wrap">{{ form.remark || '—' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </template>
    <el-form
      v-else
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      :disabled="saving"
      scroll-to-error
      :scroll-into-view-options="{ block: 'nearest', inline: 'nearest' }">
      <div class="form-section-heading">维修基本信息</div>
      <div class="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <el-form-item label="维修单号" prop="orderNo">
          <el-input v-model="form.orderNo" maxlength="64" />
        </el-form-item>
        <el-form-item label="维修日期" prop="repairDate">
          <el-date-picker
            v-model="form.repairDate"
            type="date"
            value-format="YYYY-MM-DD"
            class="w-full!" />
        </el-form-item>
        <el-form-item label="维修对象" prop="repairObject">
          <el-input
            v-model="form.repairObject"
            maxlength="200"
            placeholder="填写设备、产品或其他维修对象" />
        </el-form-item>
        <el-form-item label="维修工时" prop="workHours">
          <el-input-number
            v-model="form.workHours"
            :min="0.01"
            :max="99999999.99"
            :precision="2"
            class="w-full!" />
          <span class="mt-1 text-xs text-gray-500">单位：小时</span>
        </el-form-item>
        <el-form-item label="维修人员" prop="repairUserId">
          <PlanResourceSelect
            :model-value="form.repairUserId"
            :selected-label="form.repairUserName"
            :fetch="fetchUsers"
            placeholder="搜索员工姓名 / 用户名"
            class="w-full"
            @select="selectUser" />
        </el-form-item>
      </div>
      <el-form-item label="故障原因" prop="failureReason">
        <el-input
          v-model="form.failureReason"
          type="textarea"
          :rows="3"
          maxlength="2000"
          show-word-limit />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          maxlength="2000"
          show-word-limit />
      </el-form-item>
    </el-form>
    <div class="mt-5 mb-3 flex items-center justify-between">
      <h3 class="m-0 text-base">材料明细</h3>
      <el-button v-if="!readonly" :disabled="saving" @click="addMaterial">添加材料</el-button>
    </div>
    <el-table :data="form.materials" border empty-text="暂无材料明细">
      <el-table-column label="名称" min-width="170">
        <template #default="{ row }">
          <span v-if="readonly">{{ row.name }}</span>
          <el-input
            v-else
            v-model="row.name"
            maxlength="100"
            :disabled="saving"
            placeholder="材料名称" />
        </template>
      </el-table-column>
      <el-table-column label="型号" min-width="150">
        <template #default="{ row }">
          <span v-if="readonly">{{ row.model || '—' }}</span>
          <el-input
            v-else
            v-model="row.model"
            maxlength="100"
            :disabled="saving"
            placeholder="材料型号" />
        </template>
      </el-table-column>
      <el-table-column label="数量" width="170">
        <template #default="{ row }">
          <span v-if="readonly">{{ row.quantity }}</span>
          <el-input-number
            v-else
            v-model="row.quantity"
            :min="0.001"
            :max="99999999.999"
            :precision="3"
            :controls="false"
            :disabled="saving"
            class="w-full!" />
        </template>
      </el-table-column>
      <el-table-column label="单价" width="170">
        <template #default="{ row }">
          <span v-if="readonly">{{ Number(row.unitPrice).toFixed(2) }}</span>
          <el-input-number
            v-else
            v-model="row.unitPrice"
            :min="0"
            :max="99999999.99"
            :precision="2"
            :controls="false"
            :disabled="saving"
            class="w-full!" />
        </template>
      </el-table-column>
      <el-table-column label="总价" min-width="150">
        <template #default="{ row }">{{ materialTotal(row.quantity, row.unitPrice) }}</template>
      </el-table-column>
      <el-table-column v-if="!readonly" label="操作" width="80">
        <template #default="{ $index }">
          <el-button
            link
            type="danger"
            :disabled="saving"
            @click="form.materials.splice($index, 1)">
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-3 text-right font-medium">材料合计：{{ totalMaterials(form.materials) }}</div>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">
        {{ readonly ? '关闭' : '取消' }}
      </el-button>
      <el-button v-if="!readonly" type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import dayjs from 'dayjs'
  import PlanResourceSelect, {
    type ResourceOption,
  } from '@/components/productionPlan/PlanResourceSelect.vue'
  import { repairOrderApi } from '@/api/repairOrder'
  import { userApi } from '@/api/user'
  import type { RepairOrder, RepairMaterial } from '@/types/repairOrder'
  import { materialTotal, materialCents, formatCents } from '@/utils/repairOrder'
  const rows = ref<RepairOrder[]>([]),
    total = ref(0),
    loading = ref(false),
    failed = ref(false)
  const params = reactive({ keyword: '', pageNum: 1, pageSize: 10 })
  const dateRange = ref<string[] | null>(null)
  const visible = ref(false),
    readonly = ref(false),
    saving = ref(false),
    formRef = ref<FormInstance>()
  function blank(): RepairOrder {
    return {
      orderNo: '',
      repairDate: dayjs().format('YYYY-MM-DD'),
      repairObject: '',
      workHours: 1,
      failureReason: '',
      materials: [],
      remark: '',
    }
  }
  const form = ref<RepairOrder>(blank())
  const rules: FormRules = {
    orderNo: [{ required: true, whitespace: true, message: '请输入维修单号', trigger: 'blur' }],
    repairObject: [
      { required: true, whitespace: true, message: '请输入维修对象', trigger: 'blur' },
    ],
    repairDate: [{ required: true, message: '请选择维修日期', trigger: 'change' }],
    workHours: [
      {
        required: true,
        type: 'number',
        min: 0.01,
        message: '请输入大于0的工时',
        trigger: 'change',
      },
    ],
    repairUserId: [{ required: true, message: '请选择维修人员', trigger: 'change' }],
    failureReason: [
      { required: true, whitespace: true, message: '请输入故障原因', trigger: 'blur' },
    ],
  }
  let request = 0
  async function load() {
    const current = ++request
    loading.value = true
    try {
      const res = await repairOrderApi.list({
        ...params,
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1],
      })
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
    dateRange.value = null
    search()
  }
  function open(row?: RepairOrder, detail = false) {
    form.value = row ? { ...row, materials: (row.materials || []).map((m) => ({ ...m })) } : blank()
    readonly.value = detail
    visible.value = true
  }
  function close(done: () => void) {
    if (!saving.value) done()
  }
  function addMaterial() {
    form.value.materials.push({ name: '', model: '', quantity: 1, unitPrice: 0 })
  }
  function totalMaterials(items: RepairMaterial[] | undefined) {
    return formatCents(
      (items || []).reduce((sum, item) => sum + materialCents(item.quantity, item.unitPrice), 0n)
    )
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
  function selectUser(option: ResourceOption) {
    form.value.repairUserId = option.id
    form.value.repairUserName = option.label
  }
  async function save() {
    if (saving.value || !(await formRef.value?.validate().catch(() => false))) return
    for (const [index, item] of form.value.materials.entries()) {
      if (
        !item.name.trim() ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice < 0
      ) {
        ElMessage.warning(`请完善第 ${index + 1} 条材料的名称、数量和单价`)
        return
      }
    }
    saving.value = true
    try {
      const payload = {
        ...form.value,
        materials: form.value.materials.map((item) => ({
          ...item,
          name: item.name.trim(),
          totalPrice: materialTotal(item.quantity, item.unitPrice),
        })),
      }
      await (payload.id ? repairOrderApi.update(payload) : repairOrderApi.create(payload))
      ElMessage.success('保存成功')
      visible.value = false
      await load()
    } catch {
      /* Keep the form for retry; API interceptor displays the error. */
    } finally {
      saving.value = false
    }
  }
  onMounted(load)
</script>
<style lang="less" scoped></style>
