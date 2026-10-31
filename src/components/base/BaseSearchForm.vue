<template>
  <div class="base-search-form">
    <el-form
      inline
      :label-width="labelWidth || '90px'"
      label-position="left"
      @submit.prevent="emits('search')">
      <!-- 始终展示的筛选项（前 3 个） -->
      <slot></slot>

      <!-- 折叠区域：点击"更多筛选"后展示 -->
      <template v-if="expanded">
        <slot name="more"></slot>
      </template>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" native-type="submit">搜索</el-button>
        <el-button link @click="emits('reset')">
          <span>重置</span>
          <el-icon><refresh-right /></el-icon>
        </el-button>

        <el-button v-if="$slots.more" link :aria-expanded="expanded" @click="expanded = !expanded">
          <span>{{ expanded ? '收起筛选' : '更多筛选' }}</span>
          <el-icon><component :is="expanded ? ArrowUp : ArrowDown" /></el-icon>
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

<style scoped>
  .base-search-form {
    padding: 16px 16px 0;
    border: 1px solid #e7edf4;
    border-radius: 9px;
    background: #f8fafd;
  }
  .base-search-form :deep(.el-form-item) {
    margin-right: 18px;
    margin-bottom: 16px;
  }
  @media (max-width: 540px) {
    .base-search-form :deep(.el-form-item) {
      display: flex;
      margin-right: 0;
    }
    .base-search-form :deep(.el-form-item__content) {
      flex: 1;
    }
  }
</style>
