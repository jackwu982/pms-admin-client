<template>
  <div>
    <el-form inline :label-width="labelWidth || '90px'" label-position="left">
      <!-- 始终展示的筛选项（前 3 个） -->
      <slot></slot>

      <!-- 折叠区域：点击"更多筛选"后展示 -->
      <template v-if="expanded">
        <slot name="more"></slot>
      </template>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="emits('search')">搜索</el-button>
        <el-button link @click="emits('reset')" text>
          <span>重置</span>
          <el-icon><refresh-right /></el-icon>
        </el-button>

        <el-button v-if="!expanded" link @click="expanded = true">
          <span>更多筛选</span>
          <el-icon><arrow-down /></el-icon>
        </el-button>
        <el-button v-else link @click="expanded = false">
          <span>收起</span>
          <el-icon><arrow-up /></el-icon>
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { ArrowDown, ArrowUp, RefreshRight } from '@element-plus/icons-vue'
  import { ref } from 'vue'

  defineProps<{
    labelWidth?: string
  }>()

  const emits = defineEmits(['search', 'reset'])

  const expanded = ref(false)
</script>

<style lang="less" scoped></style>
