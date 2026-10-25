export type SaleOrderStatus = 0 | 1 | 2 | 3 | 4

export const saleOrderStatuses: { value: SaleOrderStatus; label: string }[] = [
  { value: 0, label: '草稿' },
  { value: 1, label: '已确认' },
  { value: 2, label: '已发货' },
  { value: 3, label: '已完成' },
  { value: 4, label: '已取消' },
]

export interface SaleOrderItem {
  id?: number
  productId: number
  productName: string
  model?: string | null
  unit?: string | null
}
export interface SaleOrderConfiguration {
  code: string
  name: string
  spec: string
  quantity: number | null
  unit: string
  remark: string
}
export interface SaleOrderPayload {
  orderNo: string
  customerName: string
  orderDate: string
  items: SaleOrderItem[]
  configurationDetails: SaleOrderConfiguration[]
  status: SaleOrderStatus
  remark: string
}
export interface SaleOrder extends Omit<SaleOrderPayload, 'remark' | 'configurationDetails'> {
  id: number
  configurationDetails?: SaleOrderConfiguration[] | null
  remark?: string | null
  createTime?: string
  updateTime?: string
}
