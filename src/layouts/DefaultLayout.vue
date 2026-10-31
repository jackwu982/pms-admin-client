<template>
  <div class="app-shell">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>
    <DefaultAside :mobile-open="sidebarOpen" @navigate="sidebarOpen = false" />

    <div class="app-workspace">
      <header class="app-header">
        <div class="header-location">
          <el-button
            class="mobile-menu-button"
            text
            :icon="Menu"
            aria-label="打开导航菜单"
            @click="sidebarOpen = true" />
          <div class="location-copy">
            <span class="location-parent">{{ activeGroup }}</span>
            <span class="location-divider">/</span>
            <strong>{{ activeTitle }}</strong>
          </div>
        </div>
        <div class="header-actions">
          <span class="header-user">{{ displayName }}</span>
          <el-dropdown trigger="click" @command="handleCommand">
            <button class="user-avatar" type="button" :aria-label="`${displayName}，账户菜单`">
              {{ displayName.slice(0, 1).toUpperCase() }}
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="app-content" :aria-label="activeTitle">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { Menu } from '@element-plus/icons-vue'
  import { useRoute, useRouter } from 'vue-router'
  import { localStore } from '@/composables/store'
  import { navigationGroups } from '@/config/navigation'
  import DefaultAside from '@/layouts/DefaultAside.vue'

  const route = useRoute()
  const router = useRouter()
  const sidebarOpen = ref(false)
  const user = localStore.get('user') || {}
  const displayName = String(user.nickname || user.username || '管理员')
  const activeItem = computed(() =>
    navigationGroups
      .flatMap((group) => group.cards.map((card) => ({ ...card, group: group.title })))
      .find((card) => card.name === (route.meta.activeMenu ?? route.name))
  )
  const activeGroup = computed(() => activeItem.value?.group ?? '工作台')
  const activeTitle = computed(() =>
    route.name === 'production-plan-manage' ? '计划详情' : (activeItem.value?.label ?? '首页')
  )

  function handleCommand(command: string) {
    if (command === 'logout') router.push({ name: 'logout' })
  }
</script>
