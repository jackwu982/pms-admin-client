import { createRouter, createWebHistory } from 'vue-router'
const DEFAULT_LAYOUT = () => import('@/layouts/DefaultLayout.vue')
import { localStore } from '@/composables/store'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DEFAULT_LAYOUT,
      redirect: '/homepage',
      children: [
        { path: 'capacity', name: 'capacity', component: () => import('@/views/CapacityView.vue') },
        {
          path: 'repair-order',
          name: 'repair-order',
          component: () => import('@/views/RepairOrderView.vue'),
        },
        {
          path: 'equipment',
          name: 'equipment',
          component: () => import('@/views/EquipmentView.vue'),
        },
        { path: 'feedback', name: 'feedback', component: () => import('@/views/FeedbackView.vue') },
        {
          path: 'homepage',
          name: 'homepage',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'department',
          name: 'department',
          component: () => import('@/views/DepartmentView.vue'),
        },

        {
          path: 'production-board',
          name: 'production-board',
          component: () => import('@/views/ProductionBoardView.vue'),
        },
        {
          path: 'production-plan',
          name: 'production-plan',
          component: () => import('@/views/ProductionPlanView.vue'),
        },

        {
          path: 'plan-operation-report',
          name: 'plan-operation-report',
          component: () => import('@/views/PlanOperationReportView.vue'),
        },

        {
          path: 'sale-order',
          name: 'sale-order',
          component: () => import('@/views/SaleOrderView.vue'),
        },

        {
          path: 'product',
          name: 'product',
          component: () => import('@/views/ProductView.vue'),
        },

        {
          path: 'task',
          name: 'task',
          component: () => import('@/views/TaskView.vue'),
        },

        {
          path: 'user',
          name: 'user',
          component: () => import('@/views/UserView.vue'),
        },

        {
          path: 'process-category',
          name: 'process-category',
          component: () => import('@/views/process/CategoryView.vue'),
        },

        {
          path: 'process-standard',
          name: 'process-standard',
          component: () => import('@/views/process/StandardProcessView.vue'),
        },

        {
          path: 'statistics',
          name: 'statistics',
          component: () => import('@/views/StatisticsView.vue'),
        },

        {
          path: 'report-hours',
          name: 'report-hours',
          component: () => import('@/views/report/WorkHoursReportView.vue'),
        },

        {
          path: 'report-standard',
          name: 'report-standard',
          component: () => import('@/views/report/StandardProcessReportView.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },

    {
      path: '/logout',
      name: 'logout',
      component: () => import('@/views/LogoutView.vue'),
    },

    { path: '/:pathMatch(.*)*', name: '404', component: () => import('@/views/blank/404.vue') },
  ],
})

router.beforeEach((to, from) => {
  const whiteListRouteNames = ['404', 'login']
  const allowVisit = whiteListRouteNames.includes(to.name as string)
  const user: Record<string, any> = localStore.get('user')

  const permissions = localStore.get('permissions', [])

  if (user?.id && !permissions.includes('admin')) {
    ElMessage.warning({ message: '您无权访问' })
    return false
  }

  if (user?.id || allowVisit) {
    return true
  } else {
    return { name: 'login' }
  }
})
export default router
