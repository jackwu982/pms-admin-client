<template>
  <section class="today-board">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="m-0 text-lg font-semibold">今日上报记录</h2>
        <p class="mt-2 mb-0 text-sm text-gray-500">
          {{ reportDate || '加载日期中' }} · 共 {{ reports.length }} 条 · 按上报日期展示
        </p>
      </div>
      <div class="flex gap-2">
        <el-button :disabled="!reports.length" @click="paused = !paused">
          {{ paused ? '继续滚动' : '暂停滚动' }}
        </el-button>
        <el-button :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>
    <el-alert
      v-if="failed"
      title="上报记录加载失败，请重试"
      type="error"
      :closable="false"
      class="mb-3!" />
    <div class="today-grid">
      <section class="dashboard-panel">
        <h3 class="mt-0 text-base font-semibold">今日各计划上报工时</h3>
        <BoardChart
          v-if="reports.length"
          :option="charts.hours"
          description="今日各生产计划标准折算工时与非标准实际工时" />
        <el-empty v-else-if="!loading && !failed" description="今天暂无上报记录" />
      </section>
      <section class="dashboard-panel">
        <h3 class="mt-0 text-base font-semibold">今日上报记录</h3>
        <p class="text-xs text-gray-500">
          自动循环滚动，鼠标悬停或键盘聚焦时暂停。标准工序展示完成数量，非标准工序展示实际工时。
        </p>
        <div
          ref="viewport"
          v-loading="loading"
          class="report-scroll"
          tabindex="0"
          aria-label="今日上报记录，聚焦暂停自动滚动"
          @mouseenter="hovered = true"
          @mouseleave="hovered = false"
          @focusin="focused = true"
          @focusout="focused = false">
          <el-empty v-if="!loading && !failed && !reports.length" description="今天暂无上报记录" />
          <div ref="track">
            <div
              v-for="copy in looping ? 2 : 1"
              :key="copy"
              class="report-group"
              :aria-hidden="copy === 2 ? true : undefined">
              <article
                v-for="row in reports"
                :key="row.id"
                class="mb-3 rounded-xl border border-gray-200 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <strong>{{ row.reporterName || '未记录姓名' }}</strong>
                    <el-tag :type="row.standardFlag === 1 ? 'primary' : 'info'">
                      {{ row.standardFlag === 1 ? '标准工序' : '非标准工序' }}
                    </el-tag>
                    <el-tag v-if="row.status !== 1" type="warning">
                      {{ row.status === 2 ? '已驳回' : '待审核' }}
                    </el-tag>
                  </div>
                  <span class="text-xs text-gray-500">{{ time(row.reportTime) }}</span>
                </div>
                <div class="mt-3 text-sm text-gray-500">
                  生产计划 · {{ row.planNo || '未记录' }}
                </div>
                <div class="mt-2 text-base leading-7 break-words">
                  {{ row.productName || '未记录产品' }} / {{ row.partName || '未记录部件' }} /
                  {{ row.processName || '未记录工序' }}
                </div>
                <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-gray-50 p-3 text-sm">
                  <template v-if="row.standardFlag === 1">
                    <span>
                      完成数量
                      <strong>{{ row.reportQty }}</strong>
                    </span>
                    <span>
                      合格
                      <strong>{{ row.qualifiedQty }}</strong>
                    </span>
                    <span>
                      不良
                      <strong>{{ row.defectQty }}</strong>
                    </span>
                  </template>
                  <span>
                    {{ row.standardFlag === 1 ? '折算工时' : '实际工时' }}
                    <strong>{{ row.workHours }}</strong>
                    小时
                  </span>
                </div>
                <p
                  v-if="row.remark"
                  class="mt-3 mb-0 text-sm break-words whitespace-pre-wrap text-gray-500">
                  备注：{{ row.remark }}
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
  import { productionBoardApi } from '@/api/productionBoard'
  import type { PlanOperationReport } from '@/types/planOperationReportType'
  import BoardChart from './BoardChart.vue'
  import { reportCharts } from '@/utils/boardCharts'
  const charts = computed(() => reportCharts(reports.value))
  const reports = ref<PlanOperationReport[]>([]),
    reportDate = ref('')
  const loading = ref(false),
    failed = ref(false),
    paused = ref(false),
    hovered = ref(false),
    focused = ref(false)
  const viewport = ref<HTMLElement>()
  const track = ref<HTMLElement>()
  const looping = ref(false)
  let cycleHeight = 0
  let remainder = 0
  let observer: ResizeObserver | undefined
  function measure() {
    const el = viewport.value
    const group = track.value?.firstElementChild
    if (!el || !group) return
    cycleHeight = group.getBoundingClientRect().height
    looping.value = cycleHeight > el.clientHeight && reports.value.length > 0
    if (!looping.value) {
      el.scrollTop = 0
      remainder = 0
    } else if (el.scrollTop >= cycleHeight) {
      el.scrollTop %= cycleHeight
    }
  }
  const time = (value: string) =>
    new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
  let request = 0,
    animation = 0,
    previous = 0
  let refreshTimer: ReturnType<typeof setInterval> | undefined
  async function load() {
    const current = ++request
    loading.value = true
    try {
      const res = await productionBoardApi.todayReports()
      if (current !== request) return
      const changedDay = reportDate.value !== res.data.date
      reportDate.value = res.data.date
      reports.value = res.data.list
      failed.value = false
      await nextTick()
      if (changedDay && viewport.value) {
        viewport.value.scrollTop = 0
        remainder = 0
      }
      measure()
    } catch {
      if (current === request) {
        failed.value = true
        reports.value = []
      }
    } finally {
      if (current === request) loading.value = false
    }
  }
  function scroll(now: number) {
    const delta = previous ? Math.min(now - previous, 100) : 0
    previous = now
    const el = viewport.value
    if (
      el &&
      !paused.value &&
      !hovered.value &&
      !focused.value &&
      !loading.value &&
      !document.hidden &&
      looping.value &&
      cycleHeight > 0
    ) {
      // Both groups have identical geometry, so wrapping one group is visually seamless.
      const next = (el.scrollTop + remainder + delta * 0.035) % cycleHeight
      el.scrollTop = next
      remainder = next - el.scrollTop
    }
    animation = requestAnimationFrame(scroll)
  }
  onMounted(() => {
    paused.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    observer = new ResizeObserver(measure)
    if (viewport.value) observer.observe(viewport.value)
    if (track.value) observer.observe(track.value)
    void load()
    animation = requestAnimationFrame(scroll)
    refreshTimer = setInterval(() => {
      if (!loading.value && !document.hidden) void load()
    }, 60000)
  })
  onUnmounted(() => {
    request++
    clearInterval(refreshTimer)
    cancelAnimationFrame(animation)
    observer?.disconnect()
  })
</script>
<style lang="less" scoped>
  .today-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 900px) {
    .today-grid {
      grid-template-columns: 1fr;
    }
  }
  .report-group {
    display: flow-root;
  }
  .report-scroll {
    height: var(--board-chart-height, 280px);
    overflow-y: auto;
    overflow-anchor: none;
    scroll-behavior: auto;
    scrollbar-width: none;
    padding: 2px 8px 2px 2px;
  }
  .report-scroll::-webkit-scrollbar {
    display: none;
  }
  .report-scroll:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 3px;
  }
</style>
