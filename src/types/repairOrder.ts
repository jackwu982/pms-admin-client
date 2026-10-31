export interface RepairMaterial {
  name: string
  model: string
  quantity: number
  unitPrice: number
  totalPrice?: number | string
}
export interface RepairOrder {
  id?: number
  orderNo: string
  repairDate: string
  repairObject: string
  workHours: number
  repairUserId?: number
  repairUserName?: string
  failureReason: string
  materials: RepairMaterial[]
  remark: string
}
