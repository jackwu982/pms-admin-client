export interface ProductionPlan {
  id: number
  planNo: string
  saleOrderId?: number
  productId: number
  productName: string
  planStart?: string
  planEnd?: string
  status: number
  remark?: string
  parts?: PlanPart[]
  members?: PlanMember[]
}
export interface PlanPart {
  id: number
  planId: number
  sourcePartId?: number
  partName: string
  quantity: number
  enabled: number
  remark?: string
  operations?: PlanOperation[]
}
export interface PlanOperation {
  id: number
  planId: number
  planPartId: number
  sourceProcessId?: number
  processName: string
  standardFlag: number
  stdTime?: number
  totalQuantity?: number
  totalHours?: number
  enabled: number
  ownerId?: number
  ownerName?: string
  remark?: string
}
export interface PlanMember {
  id: number
  planId: number
  userId: number
  userName: string
  memberType: number
  remark?: string
}
export const planStatuses = ['草稿', '已确认', '生产中', '已完成']
export const memberTypes = ['核心人员', '配合人员', '辅助人员']
export type PlanEditor =
  | { kind: 'part'; plan: ProductionPlan; record: PlanPart }
  | { kind: 'operation'; plan: ProductionPlan; part: PlanPart; record: PlanOperation }
  | { kind: 'member'; plan: ProductionPlan; record?: PlanMember }
