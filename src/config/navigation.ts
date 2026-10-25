import type { Component } from 'vue'
import {
  House,
  DataBoard,
  Histogram,
  TrendCharts,
  Calendar,
  Timer,
  Tickets,
  Box,
  Cpu,
  Tools,
  ChatDotRound,
  OfficeBuilding,
  User,
} from '@element-plus/icons-vue'

export interface NavigationItem {
  label: string
  name: string
  route: string
  icon: Component
  desc: string
  color: string
}
export interface NavigationGroup {
  title: string
  cards: NavigationItem[]
}

export const homeNavigation = { label: '首页', name: 'homepage', icon: House }

// Shared by the sidebar and homepage so icons, labels and grouping stay consistent.
export const navigationGroups: NavigationGroup[] = [
  {
    title: '生产管理',
    cards: [
      {
        label: '工时统计',
        name: 'statistics',
        route: '/statistics',
        icon: Histogram,
        desc: '按员工、任务与部门汇总上报工时',
        color: '#6b67b5',
      },
      {
        label: '生产看板',
        name: 'production-board',
        route: '/production-board',
        icon: DataBoard,
        desc: '查看生产计划及各工序进度',
        color: '#297da1',
      },
      {
        label: '预计产能',
        name: 'capacity',
        route: '/capacity',
        icon: TrendCharts,
        desc: '按标准工时和人员投入测算生产天数',
        color: '#407ba5',
      },
      {
        label: '生产计划',
        name: 'production-plan',
        route: '/production-plan',
        icon: Calendar,
        desc: '管理生产安排、部件工序与计划人员',
        color: '#16877b',
      },
      {
        label: '上报记录',
        name: 'plan-operation-report',
        route: '/plan-operation-report',
        icon: Timer,
        desc: '查询员工完成数量与上报工时',
        color: '#7960be',
      },
    ],
  },
  {
    title: '销售与产品',
    cards: [
      {
        label: '销售单管理',
        name: 'sale-order',
        route: '/sale-order',
        icon: Tickets,
        desc: '管理销售单及产品信息',
        color: '#ca7a29',
      },
      {
        label: '标准产品管理',
        name: 'product',
        route: '/product',
        icon: Box,
        desc: '维护标准产品、部件和工序',
        color: '#3978ba',
      },
    ],
  },
  {
    title: '设备与维修',
    cards: [
      {
        label: '设备管理',
        name: 'equipment',
        route: '/equipment',
        icon: Cpu,
        desc: '维护设备、保养周期与负责人',
        color: '#568681',
      },
      {
        label: '维修单管理',
        name: 'repair-order',
        route: '/repair-order',
        icon: Tools,
        desc: '记录维修工时、故障原因与材料明细',
        color: '#a07849',
      },
    ],
  },
  {
    title: '意见反馈',
    cards: [
      {
        label: '投诉建议',
        name: 'feedback',
        route: '/feedback',
        icon: ChatDotRound,
        desc: '查看员工提交的投诉与建议',
        color: '#9673b1',
      },
    ],
  },
  {
    title: '组织管理',
    cards: [
      {
        label: '部门管理',
        name: 'department',
        route: '/department',
        icon: OfficeBuilding,
        desc: '维护部门组织架构',
        color: '#6670a6',
      },
      {
        label: '员工管理',
        name: 'user',
        route: '/user',
        icon: User,
        desc: '管理员工信息与部门归属',
        color: '#ad744a',
      },
    ],
  },
]
