<template>
  <div>
    <!-- Date filter -->
    <el-card shadow="never" class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <span class="mb-1.5 block text-xs text-gray-400">日期范围</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            :shortcuts="DATE_SHORTCUTS"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="w-60!"
            @change="onDateChange" />
        </div>
      </div>
    </el-card>

    <!-- Empty -->
    <div
      v-if="!loading && timeEntries.length === 0"
      class="py-12 text-center text-sm text-gray-500">
      该时间范围内暂无工时上报记录
    </div>

    <template v-else>
      <!-- Summary cards -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <el-card shadow="never">
          <div class="mb-1 text-xs text-gray-500">总工时</div>
          <div class="text-2xl font-bold text-[var(--el-color-primary)]">
            {{ totalHours.toFixed(2) }}h
          </div>
        </el-card>
        <el-card shadow="never">
          <div class="mb-1 text-xs text-gray-500">参与人数</div>
          <div class="text-2xl font-bold">{{ uniqueEmployees.length }}</div>
        </el-card>
        <el-card shadow="never">
          <div class="mb-1 text-xs text-gray-500">涉及任务</div>
          <div class="text-2xl font-bold">{{ uniqueTasks.length }}</div>
        </el-card>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab">
        <el-tab-pane label="交叉统计" name="cross">
          <el-card shadow="never">
            <h2 class="mb-4 font-semibold">用户 × 任务 交叉统计</h2>
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500">员工</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500">任务</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500">工时</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="emp in uniqueEmployees" :key="emp.id">
                  <tr
                    v-for="(row, ri) in crossRows[emp.id] || []"
                    :key="row.taskId"
                    class="border-b border-gray-100 last:border-0">
                    <td class="px-6 py-3 text-sm" :class="{ 'pt-4': ri === 0 }">
                      {{ ri === 0 ? emp.nickname : '' }}
                    </td>
                    <td class="px-6 py-3 text-sm text-gray-600">{{ row.taskName }}</td>
                    <td
                      class="px-6 py-3 text-right text-sm font-semibold text-[var(--el-color-primary)]">
                      {{ row.hours.toFixed(2) }}h
                    </td>
                  </tr>
                  <tr
                    v-if="(crossRows[emp.id] || []).length > 0"
                    class="border-b border-gray-200 bg-gray-50">
                    <td class="px-6 py-3 text-xs text-gray-500" colspan="2">小计</td>
                    <td
                      class="px-6 py-3 text-right text-sm font-bold text-[var(--el-color-primary)]">
                      {{ (empTotals[emp.id] || 0).toFixed(2) }}h
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="按部门" name="dept">
          <el-card shadow="never">
            <h2 class="mb-4 font-semibold">按部门统计</h2>
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500">部门</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500">人数</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500">总工时</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500">占比</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="dept in departmentStats" :key="dept.id">
                  <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="px-6 py-3 text-sm">{{ dept.name }}</td>
                    <td class="px-6 py-3 text-right text-sm text-gray-600">{{ dept.empCount }}</td>
                    <td
                      class="px-6 py-3 text-right text-sm font-semibold text-[var(--el-color-primary)]">
                      {{ dept.hours.toFixed(2) }}h
                    </td>
                    <td class="px-6 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div
                            class="h-full rounded-full bg-[var(--el-color-primary)]"
                            :style="{ width: dept.percent + '%' }"></div>
                        </div>
                        <span class="w-10 text-right text-xs text-gray-500"
                          >{{ dept.percent }}%</span
                        >
                      </div>
                    </td>
                    <td class="px-6 py-3 text-right">
                      <el-button link type="primary" size="small" @click="toggleDept(dept.id)">
                        {{ expandedDept === dept.id ? '收起' : '详情' }}
                      </el-button>
                    </td>
                  </tr>
                  <tr
                    v-if="expandedDept === dept.id"
                    class="border-b border-gray-100 bg-gray-50/50">
                    <td colspan="5" class="px-6 py-4">
                      <div
                        v-if="!(deptDetail[dept.id] || []).length"
                        class="py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </div>
                      <div v-else class="space-y-4">
                        <div
                          v-for="emp in deptDetail[dept.id]"
                          :key="emp.empId"
                          class="rounded-lg border border-gray-200 p-4">
                          <div class="mb-3 flex items-center justify-between">
                            <span class="text-sm font-semibold">{{ emp.empName }}</span>
                            <span class="text-sm font-semibold text-[var(--el-color-primary)]">
                              {{ emp.totalHours.toFixed(2) }}h
                            </span>
                          </div>
                          <table class="w-full">
                            <thead>
                              <tr class="border-b border-gray-200">
                                <th class="py-2 text-left text-xs font-medium text-gray-500">
                                  任务
                                </th>
                                <th class="py-2 text-left text-xs font-medium text-gray-500">
                                  工序
                                </th>
                                <th class="py-2 text-right text-xs font-medium text-gray-500">
                                  工时
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(item, idx) in emp.items"
                                :key="idx"
                                class="border-b border-gray-100 last:border-0">
                                <td class="py-2 text-sm text-gray-600">{{ item.taskName }}</td>
                                <td class="py-2 text-sm text-gray-500">{{ item.processName }}</td>
                                <td class="py-2 text-right text-sm text-[var(--el-color-primary)]">
                                  {{ item.hours.toFixed(2) }}h
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="按员工" name="employee">
          <el-card shadow="never">
            <h2 class="mb-4 font-semibold">按员工统计</h2>
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500">员工</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500">部门</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500">总工时</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500">占比</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="emp in employeeStats"
                  :key="emp.id"
                  class="border-b border-gray-100 last:border-0">
                  <td class="px-6 py-3 text-sm">{{ emp.name }}</td>
                  <td class="px-6 py-3 text-sm text-gray-600">{{ emp.deptName }}</td>
                  <td
                    class="px-6 py-3 text-right text-sm font-semibold text-[var(--el-color-primary)]">
                    {{ emp.hours.toFixed(2) }}h
                  </td>
                  <td class="px-6 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div
                          class="h-full rounded-full bg-[var(--el-color-primary)]"
                          :style="{ width: emp.percent + '%' }"></div>
                      </div>
                      <span class="w-10 text-right text-xs text-gray-500">{{ emp.percent }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="按任务" name="task">
          <el-card shadow="never">
            <h2 class="mb-4 font-semibold">按任务统计</h2>
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500">任务</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500">实际工时</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="t in taskStats" :key="t.id">
                  <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="px-6 py-3 text-sm">{{ t.name }}</td>
                    <td
                      class="px-6 py-3 text-right text-sm font-semibold text-[var(--el-color-primary)]">
                      {{ t.hours.toFixed(2) }}h
                    </td>
                    <td class="px-6 py-3 text-right">
                      <el-button link type="primary" size="small" @click="toggleTask(t.id)">
                        {{ expandedTask === t.id ? '收起' : '详情' }}
                      </el-button>
                    </td>
                  </tr>
                  <tr v-if="expandedTask === t.id" class="border-b border-gray-100 bg-gray-50/50">
                    <td colspan="3" class="px-6 py-4">
                      <div
                        v-if="!(taskDetail[t.id] || []).length"
                        class="py-4 text-center text-sm text-gray-500">
                        暂无数据
                      </div>
                      <table v-else class="w-full">
                        <thead>
                          <tr class="border-b border-gray-200">
                            <th class="py-2 text-left text-xs font-medium text-gray-500">工序</th>
                            <th class="py-2 text-right text-xs font-medium text-gray-500">
                              实际工时
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="p in taskDetail[t.id]"
                            :key="p.processId"
                            class="border-b border-gray-100 last:border-0">
                            <td class="py-2 text-sm text-gray-600">{{ p.name }}</td>
                            <td class="py-2 text-right text-sm text-[var(--el-color-primary)]">
                              {{ p.actualHours.toFixed(2) }}h
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'

  import { timeEntryApi } from '@/api/timeEntry'
  import type { TimeEntry } from '@/types/timeEntryType'

  import { DATE_SHORTCUTS } from '@/util/dateShortcuts'

  const timeEntries = ref<TimeEntry[]>([])
  const loading = ref(false)

  const dateRange = ref<[string, string] | null>(null)
  const activeTab = ref('cross')
  const expandedDept = ref<number | null>(null)
  const expandedTask = ref<number | null>(null)

  async function fetchEntries() {
    loading.value = true
    const params: Record<string, any> = {}
    if (dateRange.value?.[0]) params.startDate = dateRange.value[0]
    if (dateRange.value?.[1]) params.endDate = dateRange.value[1]

    try {
      const res: any = await timeEntryApi.listAll(params)
      timeEntries.value = res.data ?? []
    } finally {
      loading.value = false
    }
  }

  function onDateChange() {
    fetchEntries()
  }

  onMounted(() => {
    const thisWeek = DATE_SHORTCUTS.find((s) => s.text === '本周')
    dateRange.value = thisWeek ? thisWeek.value() : null
    fetchEntries()
  })

  function toggleDept(deptId: number) {
    expandedDept.value = expandedDept.value === deptId ? null : deptId
  }

  function toggleTask(taskId: number) {
    expandedTask.value = expandedTask.value === taskId ? null : taskId
  }

  const totalHours = computed(() => timeEntries.value.reduce((s, e) => s + (e.hours || 0), 0))

  const uniqueEmployees = computed(() => {
    const map = new Map<
      number,
      { id: number; nickname: string; departmentId?: number; departmentName?: string }
    >()
    for (const e of timeEntries.value) {
      if (!map.has(e.userId)) {
        map.set(e.userId, {
          id: e.userId,
          nickname: e.nickname || `用户${e.userId}`,
          departmentId: e.departmentId,
          departmentName: e.departmentName,
        })
      }
    }
    return [...map.values()]
  })

  const uniqueTasks = computed(() => {
    const map = new Map<number, { id: number; name: string }>()
    for (const e of timeEntries.value) {
      if (!map.has(e.taskId)) {
        map.set(e.taskId, { id: e.taskId, name: e.taskName || `任务${e.taskId}` })
      }
    }
    return [...map.values()]
  })

  const crossRows = computed(() => {
    const map = new Map<number, Map<number, { taskId: number; taskName: string; hours: number }>>()
    for (const e of timeEntries.value) {
      if (!map.has(e.userId)) map.set(e.userId, new Map())
      const taskMap = map.get(e.userId)!
      if (!taskMap.has(e.taskId)) {
        taskMap.set(e.taskId, { taskId: e.taskId, taskName: e.taskName || '未知', hours: 0 })
      }
      taskMap.get(e.taskId)!.hours += e.hours || 0
    }
    const result: Record<number, { taskId: number; taskName: string; hours: number }[]> = {}
    for (const [uid, taskMap] of map) {
      result[uid] = [...taskMap.values()].sort((a, b) => b.hours - a.hours)
    }
    return result
  })

  const empTotals = computed(() => {
    const totals: Record<number, number> = {}
    for (const e of timeEntries.value) {
      totals[e.userId] = (totals[e.userId] || 0) + (e.hours || 0)
    }
    return totals
  })

  const employeeStats = computed(() => {
    return uniqueEmployees.value
      .map((emp) => {
        const hours = empTotals.value[emp.id] || 0
        return {
          id: emp.id,
          name: emp.nickname,
          deptName: emp.departmentName || '-',
          hours,
          percent: totalHours.value > 0 ? Math.round((hours / totalHours.value) * 100) : 0,
        }
      })
      .sort((a, b) => b.hours - a.hours)
  })

  const departmentStats = computed(() => {
    const map = new Map<number, { id: number; name: string; hours: number; emps: Set<number> }>()
    for (const emp of uniqueEmployees.value) {
      const deptId = emp.departmentId ?? 0
      if (!map.has(deptId)) {
        map.set(deptId, {
          id: deptId,
          name: emp.departmentName || '未知',
          hours: 0,
          emps: new Set(),
        })
      }
      const d = map.get(deptId)!
      d.hours += empTotals.value[emp.id] || 0
      d.emps.add(emp.id)
    }
    return [...map.values()]
      .map((d) => ({
        id: d.id,
        name: d.name,
        hours: d.hours,
        empCount: d.emps.size,
        percent: totalHours.value > 0 ? Math.round((d.hours / totalHours.value) * 100) : 0,
      }))
      .sort((a, b) => b.hours - a.hours)
  })

  const deptDetail = computed(() => {
    const result: Record<
      number,
      {
        empId: number
        empName: string
        totalHours: number
        items: { taskName: string; processName: string; hours: number }[]
      }[]
    > = {}
    for (const dept of departmentStats.value) {
      const emps = uniqueEmployees.value.filter((e) => (e.departmentId ?? 0) === dept.id)
      const detail = []
      for (const emp of emps) {
        const items = timeEntries.value
          .filter((e) => e.userId === emp.id)
          .map((e) => ({
            taskName: e.taskName || '未知',
            processName: e.processName || '未知',
            hours: e.hours || 0,
          }))
          .sort((a, b) => b.hours - a.hours)
        const totalHours = items.reduce((s, i) => s + i.hours, 0)
        detail.push({ empId: emp.id, empName: emp.nickname, totalHours, items })
      }
      if (detail.length > 0) {
        result[dept.id] = detail.sort((a, b) => b.totalHours - a.totalHours)
      }
    }
    return result
  })

  const taskStats = computed(() => {
    const map = new Map<number, { id: number; name: string; hours: number }>()
    for (const e of timeEntries.value) {
      if (!map.has(e.taskId)) {
        map.set(e.taskId, { id: e.taskId, name: e.taskName || `任务${e.taskId}`, hours: 0 })
      }
      map.get(e.taskId)!.hours += e.hours || 0
    }
    return [...map.values()].sort((a, b) => b.hours - a.hours)
  })

  const taskDetail = computed(() => {
    const result: Record<number, { processId: number; name: string; actualHours: number }[]> = {}
    for (const t of taskStats.value) {
      const map = new Map<number, { processId: number; name: string; actualHours: number }>()
      for (const e of timeEntries.value) {
        if (e.taskId !== t.id) continue
        const pid = e.processId ?? 0
        if (!map.has(pid)) {
          map.set(pid, { processId: pid, name: e.processName || '未知', actualHours: 0 })
        }
        map.get(pid)!.actualHours += e.hours || 0
      }
      result[t.id] = [...map.values()].sort((a, b) => b.actualHours - a.actualHours)
    }
    return result
  })
</script>

<style lang="less" scoped></style>
