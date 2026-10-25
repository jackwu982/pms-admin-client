<template>
  <el-card>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="m-0 text-lg font-semibold">设备保养提醒</h2>
        <p class="mt-2 mb-0 text-sm text-gray-500">
          {{ date }} · 保养到期日 = 最近保养日期 + 保养周期（天）
        </p>
      </div>
      <el-button :loading="loading" @click="load">刷新提醒</el-button>
    </div>
    <div class="mb-5 grid grid-cols-3 gap-4">
      <div class="rounded-xl bg-red-50 p-4">
        <span class="text-sm text-red-700">已逾期</span>
        <div class="mt-2 text-2xl font-semibold">{{ overdue }}</div>
      </div>
      <div class="rounded-xl bg-amber-50 p-4">
        <span class="text-sm text-amber-700">7 天内到期</span>
        <div class="mt-2 text-2xl font-semibold">{{ upcoming }}</div>
      </div>
      <div class="rounded-xl bg-gray-50 p-4">
        <span class="text-sm text-gray-500">保养信息待完善</span>
        <div class="mt-2 text-2xl font-semibold">{{ incomplete }}</div>
      </div>
    </div>
    <p class="text-xs leading-6 text-gray-500">
      仅提醒启用设备，包含今天到期和已逾期设备。保养后可在设备管理中点击“保养”更新最近保养时间。
    </p>
    <el-alert
      v-if="failed"
      title="保养提醒加载失败，请重试"
      type="error"
      :closable="false"
      class="mb-3!" />
    <div v-if="!failed && rows.length" class="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div class="min-w-0 rounded-xl border border-gray-200 p-4">
        <h3 class="text-sm font-semibold">保养提醒分布</h3>
        <BoardChart
          :option="charts.status"
          description="需提醒设备的逾期、七天内到期和信息待完善数量" />
      </div>
      <div class="min-w-0 rounded-xl border border-gray-200 p-4">
        <h3 class="text-sm font-semibold">设备到期情况 · 负数表示逾期</h3>
        <BoardChart
          :option="charts.due"
          description="设备距保养到期的剩余天数，负数表示逾期，不包含缺失保养日期的设备" />
      </div>
    </div>
    <el-table v-loading="loading" :data="rows" empty-text="暂无需要提醒的设备">
      <el-table-column prop="code" label="设备编号" min-width="120" />
      <el-table-column prop="name" label="设备名称" min-width="160" />
      <el-table-column prop="ownerName" label="负责人" min-width="110" />
      <el-table-column label="最近保养日期" width="150">
        <template #default="{ row }">
          {{ row.lastMaintenanceTime ? localDate(row.lastMaintenanceTime) : '未记录' }}
        </template>
      </el-table-column>
      <el-table-column label="保养周期" width="110">
        <template #default="{ row }">{{ row.maintenanceCycleDays || '—' }} 天</template>
      </el-table-column>
      <el-table-column label="到期日期" width="140">
        <template #default="{ row }">{{ row.dueDate || '待完善' }}</template>
      </el-table-column>
      <el-table-column label="提醒" min-width="180">
        <template #default="{ row }">
          <el-tag
            :type="
              row.remainingDays == null ? 'info' : row.remainingDays <= 0 ? 'danger' : 'warning'
            ">
            {{ reminderText(row.remainingDays) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { productionBoardApi, type MaintenanceReminder } from '@/api/productionBoard'
  import BoardChart from './BoardChart.vue'
  import { maintenanceCharts } from '@/utils/boardCharts'
  const charts = computed(() => maintenanceCharts(rows.value))
  const rows = ref<MaintenanceReminder[]>([]),
    date = ref(''),
    loading = ref(false),
    failed = ref(false)
  const overdue = computed(
    () => rows.value.filter((r) => r.remainingDays != null && r.remainingDays < 0).length
  )
  const upcoming = computed(
    () => rows.value.filter((r) => r.remainingDays != null && r.remainingDays >= 0).length
  )
  const incomplete = computed(() => rows.value.filter((r) => r.remainingDays == null).length)
  const localDate = (value: string) =>
    new Date(value).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })
  function reminderText(days: number | null | undefined) {
    return days == null
      ? '待完善保养信息'
      : days < 0
        ? `已逾期 ${-days} 天`
        : days === 0
          ? '今天到期'
          : `剩余 ${days} 天保养`
  }
  let request = 0
  let timer: ReturnType<typeof setInterval> | undefined
  async function load() {
    const current = ++request
    loading.value = true
    try {
      const res = await productionBoardApi.maintenanceReminders()
      if (current === request) {
        rows.value = res.data.list
        date.value = res.data.date
        failed.value = false
      }
    } catch {
      if (current === request) {
        failed.value = true
        rows.value = []
      }
    } finally {
      if (current === request) loading.value = false
    }
  }
  onMounted(() => {
    void load()
    timer = setInterval(() => {
      if (!loading.value && !document.hidden) void load()
    }, 60000)
  })
  onUnmounted(() => {
    request++
    clearInterval(timer)
  })
</script>
