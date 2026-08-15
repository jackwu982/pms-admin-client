<template>
  <el-card>
    <!-- header -->
    <div class="flex items-center justify-between">
      <div>
        <slot name="header-left-content"></slot>
      </div>

      <div>
        <slot name="header-right-content"></slot>
      </div>
    </div>

    <!-- 条件筛选 -->
    <div class="my-4">
      <slot name="filter-content"></slot>
    </div>

    <!-- 内容 -->
    <slot name="content"></slot>
  </el-card>
</template>

<script setup lang="ts"></script>

<style lang="less" scoped></style>
