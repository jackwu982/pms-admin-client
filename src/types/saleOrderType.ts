export type SaleOrderStatus = 0 | 1 | 2 | 3 | 4

export const saleOrderStatuses: { value: SaleOrderStatus; label: string }[] = [
  { value: 0, label: '草稿' },
  { value: 1, label: '已确认' },
  { value: 2, label: '已发货' },
  { value: 3, label: '已完成' },
  { value: 4, label: '已取消' },
]

export interface SaleOrderPayload {
  orderNo: string
  customerName: string
  orderDate: string
  productId: number
  productName: string
  model: string
  unit: string
  status: SaleOrderStatus
  remark: string
}

export interface SaleOrder extends Omit<SaleOrderPayload, 'model' | 'unit' | 'remark'> {
  id: number
  model?: string | null
  unit?: string | null
  remark?: string | null
  createTime?: string
  updateTime?: string
}
