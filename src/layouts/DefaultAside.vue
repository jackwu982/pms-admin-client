<template>
  <aside class="sidebar" :class="{ 'sidebar-open': mobileOpen }" aria-label="主导航">
    <div class="sidebar-brand">
      <span class="brand-mark">P</span>
      <div>
        <strong>PMS 管理平台</strong>
        <small>生产运营工作台</small>
      </div>
    </div>
    <nav class="sidebar-scroll" aria-label="业务导航">
      <el-menu :default-active="currentRouter" class="sidebar-menu">
        <el-menu-item :index="homeNavigation.name" @click="navTo(homeNavigation.name)">
          <el-icon><component :is="homeNavigation.icon" /></el-icon>
          <span>{{ homeNavigation.label }}</span>
        </el-menu-item>
        <template v-for="group in navigationGroups" :key="group.title">
          <li role="separator" :aria-label="group.title" class="menu-divider">{{ group.title }}</li>
          <el-menu-item
            v-for="item in group.cards"
            :key="item.name"
            :index="item.name"
            @click="navTo(item.name)">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </nav>
    <div class="sidebar-footer">PMS · 管理端</div>
  </aside>
</template>
<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { homeNavigation, navigationGroups } from '@/config/navigation'

  defineProps<{ mobileOpen: boolean }>()
  const emit = defineEmits<{ navigate: [] }>()
  const route = useRoute()
  const router = useRouter()
  const currentRouter = computed(() => String(route.meta.activeMenu ?? route.name ?? ''))
  function navTo(name: string) {
    emit('navigate')
    if (route.name !== name) router.push({ name })
  }
</script>
