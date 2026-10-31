<template>
  <div
    ref="container"
    class="board-chart"
    role="img"
    :aria-label="description"
    :style="{ height: `${height}px` }" />
</template>
<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
  import { init, use, type ECharts, type EChartsCoreOption } from 'echarts/core'
  import { BarChart, PieChart } from 'echarts/charts'
  import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DataZoomComponent,
    MarkLineComponent,
  } from 'echarts/components'
  import { SVGRenderer } from 'echarts/renderers'
  use([
    BarChart,
    PieChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DataZoomComponent,
    MarkLineComponent,
    SVGRenderer,
  ])
  const props = withDefaults(
    defineProps<{ option: EChartsCoreOption; description: string; height?: number }>(),
    { height: 340 }
  )
  const container = ref<HTMLDivElement>()
  let chart: ECharts | undefined
  let observer: ResizeObserver | undefined
  function render() {
    chart?.setOption(
      {
        ...props.option,
        animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      },
      { notMerge: true }
    )
  }
  onMounted(() => {
    if (!container.value) return
    chart = init(container.value, undefined, { renderer: 'svg' })
    render()
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(container.value)
  })
  watch(() => props.option, render, { deep: true })
  onBeforeUnmount(() => {
    observer?.disconnect()
    chart?.dispose()
    chart = undefined
  })
</script>
<style lang="less" scoped>
  .board-chart {
    width: 100%;
    min-width: 0;
  }
</style>
