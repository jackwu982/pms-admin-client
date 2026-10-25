<template>
  <div class="relative">
    <el-menu
      :default-active="currentRouter"
      class="h-screen"
      background-color="#1d1d1f"
      text-color="#ffffff90"
      active-text-color="#ffffff">
      <!-- menus  support level 2-->
      <template v-for="item in menus" :key="item.routerName">
        <li v-if="item.dividerBefore" role="separator" class="menu-divider" />
        <el-sub-menu v-if="item.children" :index="item.routerName">
          <template #title>
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.name }}</span>
          </template>

          <template v-for="subMenu in item.children" :key="subMenu.routerName">
            <el-menu-item :index="subMenu.routerName" @click="navTo(subMenu.routerName)">
              <template #title>
                <el-icon v-if="subMenu.icon"><component :is="subMenu.icon" /></el-icon>
                <span>{{ subMenu.name }}</span>
              </template>
            </el-menu-item>
          </template>
        </el-sub-menu>

        <template v-else>
          <el-menu-item :index="item.routerName" @click="navTo(item.routerName)">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>
              <span>{{ item.name }}</span>
            </template>
          </el-menu-item>
        </template>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
  import { HomeFilled, OfficeBuilding } from '@element-plus/icons-vue'
  import { ref, watch, shallowRef, onMounted } from 'vue'
  import IconTask from '@/components/icons/IconTask.vue'
  import IconOrder from '@/components/icons/IconOrder.vue'
  import IconProduct from '@/components/icons/IconProduct.vue'
  import IconUser from '@/components/icons/IconUser.vue'
  import { useRoute, useRouter } from 'vue-router'

  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    updateMenuActive()
  })

  const currentRouter = ref<string>('')
  const menus = ref<any[]>([
    {
      name: '首页',
      routerName: 'homepage',
      icon: shallowRef(HomeFilled),
    },
    {
      name: '生产看板',
      routerName: 'production-board',
      icon: shallowRef(IconTask),
    },
    {
      name: '生产计划',
      routerName: 'production-plan',
      icon: shallowRef(IconTask),
    },
    {
      name: '上报记录',
      routerName: 'plan-operation-report',
      icon: shallowRef(IconTask),
    },
    {
      name: '销售单管理',
      routerName: 'sale-order',
      icon: shallowRef(IconOrder),
    },
    {
      name: '标准产品管理',
      routerName: 'product',
      icon: shallowRef(IconProduct),
    },
    {
      name: '部门管理',
      dividerBefore: true,
      routerName: 'department',
      icon: shallowRef(OfficeBuilding),
    },
    {
      name: '员工管理',
      routerName: 'user',
      icon: shallowRef(IconUser),
    },
  ])
  const navTo = (name: string) => {
    router.push({ name })
  }

  watch([route], () => {
    updateMenuActive()
  })

  const updateMenuActive = () => {
    currentRouter.value = route.name as string
  }
</script>

<style lang="less" scoped>
  .menu-divider {
    height: 0;
    margin: 12px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.16);
    list-style: none;
  }
  .el-menu-item {
    border-left: 3px solid transparent;
  }
  //   /* 选中项左侧指示条 */
  .el-menu-item.is-active {
    background: rgba(64, 158, 255, 0.18);
    /* #409eff 的 RGB 值为 64, 158, 255 */
    border-left: 3px solid var(--el-color-primary);
  }
</style>
