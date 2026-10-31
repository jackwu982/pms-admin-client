export interface OperationProgress {
  id: number
  productName?: string
  partName: string
  processName: string
  standardFlag: number
  target: number | null
  actual: number
  progress: number | null
}
export interface PlanProgress {
  status?: number
  id: number
  planNo: string
  productName: string
  planStart?: string
  planEnd?: string
  progress: number | null
  missingTargets: number
  completedOperations: number
  operations: OperationProgress[]
}
