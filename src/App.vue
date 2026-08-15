<template>
  <router-view v-slot="{ Component }">
    <el-config-provider :locale="zhCn" :message="messageConfig">
      <transition name="slide-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </el-config-provider>
  </router-view>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { reactive } from 'vue'
const messageConfig = reactive({
  plain: true,
  grouping: true,
})
</script>

<style lang="less" scoped></style>
