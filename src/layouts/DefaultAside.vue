<template>
  <aside class="sidebar" aria-label="主导航">
    <el-menu
      :default-active="currentRouter"
      class="sidebar-menu"
      background-color="#1d1d1f"
      text-color="#ffffffa6"
      active-text-color="#ffffff">
      <el-menu-item :index="homeNavigation.name" @click="navTo(homeNavigation.name)">
        <el-icon :size="19"><component :is="homeNavigation.icon" /></el-icon>
        <span>{{ homeNavigation.label }}</span>
      </el-menu-item>
      <template v-for="group in navigationGroups" :key="group.title">
        <li role="separator" :aria-label="group.title" class="menu-divider">
          <span>{{ group.title }}</span>
        </li>
        <el-menu-item
          v-for="item in group.cards"
          :key="item.name"
          :index="item.name"
          @click="navTo(item.name)">
          <el-icon :size="19"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </template>
    </el-menu>
  </aside>
</template>
<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { homeNavigation, navigationGroups } from '@/config/navigation'

  const route = useRoute()
  const router = useRouter()
  const currentRouter = computed(() => String(route.meta.activeMenu ?? route.name ?? ''))
  const navTo = (name: string) => router.push({ name })
</script>
<style lang="less" scoped>
  .sidebar {
    width: 208px;
    height: 100vh;
    flex-shrink: 0;
    overflow-y: auto;
    background: #1d1d1f;
    scrollbar-width: thin;
    scrollbar-color: #ffffff30 transparent;
  }
  .sidebar-menu {
    min-height: 100%;
    padding: 12px 0 20px;
    border-right: 0;
  }
  .menu-divider {
    margin: 12px 20px 6px;
    padding-top: 12px;
    border-top: 1px solid #ffffff24;
    color: #ffffff73;
    font-size: 11px;
    line-height: 16px;
    letter-spacing: 1px;
    list-style: none;
  }
  .el-menu-item {
    height: 44px;
    line-height: 44px;
    border-left: 3px solid transparent;
    padding-left: 17px !important;
  }
  .el-menu-item :deep(.el-icon) {
    margin-right: 12px;
  }
  .el-menu-item.is-active {
    background: rgba(64, 158, 255, 0.18);
    border-left-color: var(--el-color-primary);
  }
</style>
