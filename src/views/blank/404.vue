<template>
  <div class="flex h-screen w-full items-center justify-center bg-white">
    <div class="flex flex-col">
      <el-icon :size="400"> <IconNotFound /></el-icon>

      <div class="mt-40 flex justify-center">
        <el-link type="warning" @click="goDashboard" underline="always">回首页</el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import IconNotFound from '@/components/icons/IconNotFound.vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const goDashboard = () => {
    router.push({ name: 'homepage' })
  }
</script>

<style lang="less" scoped></style>
