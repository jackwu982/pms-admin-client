<template>
  <div>
    <BaseTableContainer>
      <template #filter-content>
        <div class="flex items-end gap-4">
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
      </template>

      <template #content>
        <el-empty
          v-if="!loading && timeEntries.length === 0"
          description="该时间范围内暂无工时上报记录" />

        <template v-else>
          <!-- Summary cards -->
          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <el-card shadow="never">
              <div class="mb-1 text-xs text-gray-500">总工时</div>
              <div class="text-2xl font-bold text-(--el-color-primary)">
                {{ totalHours.toFixed(3) }}h
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
              <el-table
                :data="crossTableData"
                :span-method="crossSpanMethod"
                :row-class-name="crossRowClass">
                <el-table-column label="员工" min-width="120">
                  <template #default="{ row }">{{ row.empName }}</template>
                </el-table-column>
                <el-table-column label="任务" min-width="160">
                  <template #default="{ row }">{{ row.taskName }}</template>
                </el-table-column>
                <el-table-column label="工时" width="120" :align="'right'">
                  <template #default="{ row }">{{ row.hours.toFixed(3) }}h</template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="按部门" name="dept">
              <el-table :data="departmentStats" row-key="id">
                <el-table-column type="expand">
                  <template #default="{ row }">
                    <div class="px-6 py-2">
                      <el-table :data="deptDetail[row.id] || []" size="small">
                        <el-table-column prop="empName" label="员工" min-width="120" />
                        <el-table-column prop="taskName" label="任务" min-width="140" />
                        <el-table-column prop="processName" label="工序" min-width="140" />
                        <el-table-column label="工时" width="100" :align="'right'">
                          <template #default="{ row: e }">{{ e.hours.toFixed(3) }}h</template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="部门" min-width="120" />
                <el-table-column prop="empCount" label="人数" width="80" :align="'right'" />
                <el-table-column label="总工时" width="120" :align="'right'">
                  <template #default="{ row }">{{ row.hours.toFixed(3) }}h</template>
                </el-table-column>
                <el-table-column label="占比" width="160" :align="'right'">
                  <template #default="{ row }">
                    <div class="flex items-center justify-end gap-2">
                      <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div
                          class="h-full rounded-full bg-(--el-color-primary)"
                          :style="{ width: row.percent + '%' }"></div>
                      </div>
                      <span class="w-10 text-right text-xs text-gray-500">{{ row.percent }}%</span>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="按员工" name="employee">
              <el-table :data="employeeStats" row-key="id">
                <el-table-column prop="name" label="员工" min-width="120" />
                <el-table-column prop="deptName" label="部门" min-width="120" />
                <el-table-column label="总工时" width="120" :align="'right'">
                  <template #default="{ row }">{{ row.hours.toFixed(3) }}h</template>
                </el-table-column>
                <el-table-column label="占比" width="160" :align="'right'">
                  <template #default="{ row }">
                    <div class="flex items-center justify-end gap-2">
                      <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div
                          class="h-full rounded-full bg-(--el-color-primary)"
                          :style="{ width: row.percent + '%' }"></div>
                      </div>
                      <span class="w-10 text-right text-xs text-gray-500">{{ row.percent }}%</span>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="按任务" name="task">
              <el-table :data="taskStats" row-key="id">
                <el-table-column type="expand">
                  <template #default="{ row }">
                    <div class="px-6 py-2">
                      <el-table :data="taskDetail[row.id] || []" size="small">
                        <el-table-column prop="name" label="工序" min-width="160" />
                        <el-table-column label="实际工时" width="120" :align="'right'">
                          <template #default="{ row: p }">{{ p.actualHours.toFixed(3) }}h</template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="任务" min-width="160" />
                <el-table-column label="实际工时" width="120" :align="'right'">
                  <template #default="{ row }">{{ row.hours.toFixed(3) }}h</template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </template>
      </template>
    </BaseTableContainer>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'

  import BaseTableContainer from '@/components/base/BaseTableContainer.vue'

  import { timeEntryApi } from '@/api/timeEntry'
  import type { TimeEntry } from '@/types/timeEntryType'

  import { DATE_SHORTCUTS } from '@/util/dateShortcuts'

  const timeEntries = ref<TimeEntry[]>([])
  const loading = ref(false)

  const dateRange = ref<[string, string] | null>(null)
  const activeTab = ref('cross')

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

  const crossTableData = computed(() => {
    const rows: {
      empName: string
      taskName: string
      hours: number
      isSubtotal: boolean
      empRowSpan: number
    }[] = []
    for (const emp of uniqueEmployees.value) {
      const empRows = crossRows.value[emp.id] || []
      if (empRows.length === 0) continue
      const rowSpan = empRows.length + 1
      empRows.forEach((r, i) => {
        rows.push({
          empName: emp.nickname,
          taskName: r.taskName,
          hours: r.hours,
          isSubtotal: false,
          empRowSpan: i === 0 ? rowSpan : 0,
        })
      })
      rows.push({
        empName: emp.nickname,
        taskName: '小计',
        hours: empTotals.value[emp.id] || 0,
        isSubtotal: true,
        empRowSpan: 0,
      })
    }
    return rows
  })

  const crossSpanMethod = ({ columnIndex, row }: any) => {
    if (columnIndex === 0) {
      if (row.empRowSpan > 0) return { rowspan: row.empRowSpan, colspan: 1 }
      return { rowspan: 0, colspan: 0 }
    }
    return { rowspan: 1, colspan: 1 }
  }

  const crossRowClass = ({ row }: any) => (row.isSubtotal ? 'statistics-subtotal-row' : '')

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
      { empName: string; taskName: string; processName: string; hours: number }[]
    > = {}
    for (const dept of departmentStats.value) {
      const emps = uniqueEmployees.value.filter((e) => (e.departmentId ?? 0) === dept.id)
      const flat: { empName: string; taskName: string; processName: string; hours: number }[] = []
      for (const emp of emps) {
        for (const e of timeEntries.value) {
          if (e.userId !== emp.id) continue
          flat.push({
            empName: emp.nickname,
            taskName: e.taskName || '未知',
            processName: e.processName || '未知',
            hours: e.hours || 0,
          })
        }
      }
      if (flat.length > 0) {
        result[dept.id] = flat.sort((a, b) => b.hours - a.hours)
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

<style lang="less" scoped>
  :deep(.statistics-subtotal-row) {
    font-weight: 600;
    background: var(--el-fill-color-light);
  }
</style>
