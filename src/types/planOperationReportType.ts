export interface PlanOperationReport {
  id: number
  planId: number
  planPartId: number
  planProcessId: number
  planNo?: string
  productName?: string
  partName?: string
  processName?: string
  standardFlag?: number
  reportQty: number
  qualifiedQty: number
  defectQty: number
  workHours: number
  reporterName: string
  reportTime: string
  status: number
  remark?: string
}

export const reportStatuses = [
  { value: 0, label: '待审核', type: 'warning' },
  { value: 1, label: '已通过', type: 'success' },
  { value: 2, label: '已驳回', type: 'danger' },
] as const
