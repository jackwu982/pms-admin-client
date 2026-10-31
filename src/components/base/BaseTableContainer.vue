<template>
  <el-card class="base-table-container">
    <!-- header -->
    <div class="table-toolbar flex items-center justify-between">
      <div>
        <slot name="header-left-content"></slot>
      </div>

      <div>
        <slot name="header-right-content"></slot>
      </div>
    </div>

    <!-- 条件筛选 -->
    <div class="my-5">
      <slot name="filter-content"></slot>
    </div>

    <!-- 内容 -->
    <div class="table-content"><slot name="content"></slot></div>
  </el-card>
</template>

<script setup lang="ts"></script>

<style scoped>
  .table-toolbar {
    min-height: 36px;
    gap: 16px;
  }
  .table-toolbar :deep(span.font-semibold) {
    color: #172b47;
    font-size: 18px;
    font-weight: 650;
  }
  .table-content {
    overflow-x: auto;
  }
  @media (max-width: 540px) {
    .table-toolbar {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
