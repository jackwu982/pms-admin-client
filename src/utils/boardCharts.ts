import type { EChartsCoreOption } from 'echarts/core'
import type { PlanProgress } from '../types/productionBoardType.ts'
import type { PlanOperationReport } from '../types/planOperationReportType.ts'

const colors = {
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  gray: '#94a3b8',
}
const base = {
  textStyle: { fontFamily: 'system-ui, sans-serif', color: '#64748b' },
  tooltip: { trigger: 'item', renderMode: 'richText', confine: true },
}
function donut(
  data: { name: string; value: number; itemStyle: { color: string } }[]
): EChartsCoreOption {
  return {
    ...base,
    legend: { bottom: 4 },
    series: [
      {
        type: 'pie',
        radius: ['46%', '68%'],
        center: ['50%', '44%'],
        stillShowZeroSum: false,
        label: { formatter: '{b}\n{c}' },
        data,
      },
    ],
  }
}
function bars(names: string[]): EChartsCoreOption {
  return {
    ...base,
    grid: { left: 12, right: 64, top: 40, bottom: 40, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      renderMode: 'richText',
      confine: true,
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: names,
      axisLabel: { width: 150, overflow: 'truncate' },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef2f6' } } },
    dataZoom:
      names.length > 7
        ? [
            {
              type: 'slider',
              yAxisIndex: 0,
              startValue: 0,
              endValue: 6,
              width: 12,
              right: 0,
              filterMode: 'filter',
            },
          ]
        : [],
  }
}
export function planCharts(plans: PlanProgress[]) {
  const valid = plans.filter((p) => p.progress != null)
  const pending = plans.length - valid.length
  const complete = valid.filter((p) => Number(p.progress) >= 100).length
  return {
    progress: {
      ...bars(valid.map((p) => p.planNo)),
      title: valid.length
        ? undefined
        : {
            text: '暂无可计算的计划进度',
            subtext: '请先完善计划工序目标',
            left: 'center',
            top: '40%',
            textStyle: { fontSize: 15, color: '#64748b' },
          },
      xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      series: [
        {
          name: '计划进度（%）',
          type: 'bar',
          barMaxWidth: 24,
          label: { show: true, position: 'right', formatter: '{c}%' },
          data: valid.map((p) => ({
            value: Number(p.progress),
            itemStyle: {
              color: Number(p.progress) >= 100 ? colors.green : colors.blue,
              borderRadius: [0, 5, 5, 0],
            },
          })),
        },
      ],
    } as EChartsCoreOption,
    status: donut([
      { name: '已达目标', value: complete, itemStyle: { color: colors.green } },
      { name: '进行中', value: valid.length - complete, itemStyle: { color: colors.blue } },
      { name: '待配置目标', value: pending, itemStyle: { color: colors.amber } },
    ]),
  }
}
export function reportCharts(reports: PlanOperationReport[]) {
  const groups = new Map<string, { name: string; standard: number; actual: number }>()
  for (const report of reports) {
    const key = String(report.planId)
    let group = groups.get(key)
    if (!group) {
      group = { name: report.planNo || `计划${report.planId}`, standard: 0, actual: 0 }
      groups.set(key, group)
    }
    const field = report.standardFlag === 1 ? 'standard' : 'actual'
    group[field] += Math.round(Number(report.workHours || 0) * 1000)
  }
  const rows = [...groups.values()].sort((a, b) => b.standard + b.actual - (a.standard + a.actual))
  return {
    hours: {
      ...bars(rows.map((r) => r.name)),
      legend: { top: 0 },
      xAxis: { type: 'value', name: '小时' },
      series: [
        {
          name: '标准折算工时',
          type: 'bar',
          stack: 'hours',
          barMaxWidth: 24,
          itemStyle: { color: colors.blue },
          data: rows.map((r) => r.standard / 1000),
        },
        {
          name: '非标准实际工时',
          type: 'bar',
          stack: 'hours',
          barMaxWidth: 24,
          itemStyle: { color: colors.green },
          data: rows.map((r) => r.actual / 1000),
        },
      ],
    } as EChartsCoreOption,
    types: donut([
      {
        name: '标准工序上报',
        value: reports.filter((r) => r.standardFlag === 1).length,
        itemStyle: { color: colors.blue },
      },
      {
        name: '非标准工序上报',
        value: reports.filter((r) => r.standardFlag !== 1).length,
        itemStyle: { color: colors.green },
      },
    ]),
  }
}
export function maintenanceCharts(
  rows: { code: string; name: string; remainingDays?: number | null }[]
) {
  const dated = rows
    .filter((r) => r.remainingDays != null)
    .sort((a, b) => a.remainingDays! - b.remainingDays!)
  return {
    status: donut([
      {
        name: '已逾期',
        value: rows.filter((r) => r.remainingDays != null && r.remainingDays < 0).length,
        itemStyle: { color: colors.red },
      },
      {
        name: '7天内到期',
        value: rows.filter((r) => r.remainingDays != null && r.remainingDays >= 0).length,
        itemStyle: { color: colors.amber },
      },
      {
        name: '信息待完善',
        value: rows.filter((r) => r.remainingDays == null).length,
        itemStyle: { color: colors.gray },
      },
    ]),
    due: {
      ...bars(dated.map((r) => `${r.code} · ${r.name}`)),
      xAxis: {
        type: 'value',
        name: '剩余天数',
        min: (extent: { min: number }) => Math.min(extent.min - 1, -1),
        max: 8,
      },
      series: [
        {
          name: '距保养到期（天）',
          type: 'bar',
          barMaxWidth: 24,
          label: {
            show: true,
            position: 'right',
            formatter: (p: { value: number }) =>
              p.value < 0
                ? `逾期 ${-p.value} 天`
                : p.value === 0
                  ? '今天到期'
                  : `剩余 ${p.value} 天`,
          },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { formatter: '到期日' },
            data: [{ xAxis: 0 }],
          },
          data: dated.map((r) => ({
            value: r.remainingDays,
            itemStyle: { color: r.remainingDays! <= 0 ? colors.red : colors.amber },
          })),
        },
      ],
    } as EChartsCoreOption,
  }
}
