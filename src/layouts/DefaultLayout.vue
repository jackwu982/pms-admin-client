<template>
  <el-container class="h-screen overflow-hidden">
    <DefaultAside />

    <el-container class="flex-1">
      <el-main>
        <!-- 面包屑 -->
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
  import DefaultAside from '@/layouts/DefaultAside.vue'
</script>

<style lang="less" scoped></style>
