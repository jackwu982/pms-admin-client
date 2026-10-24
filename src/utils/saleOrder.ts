import type { SaleOrder, SaleOrderPayload } from '../types/saleOrderType'
import type { Product } from '../types/productType'

export function createSaleOrderForm(
  order?: SaleOrder,
  today = ''
): Omit<SaleOrderPayload, 'productId'> & { productId?: number } {
  return {
    orderNo: order?.orderNo ?? '',
    customerName: order?.customerName ?? '',
    orderDate: order?.orderDate ?? today,
    productId: order?.productId,
    productName: order?.productName ?? '',
    model: order?.model ?? '',
    unit: order?.unit ?? '',
    status: order?.status ?? 0,
    remark: order?.remark ?? '',
  }
}

export function selectSaleOrderProduct(
  form: ReturnType<typeof createSaleOrderForm>,
  product: Pick<Product, 'id' | 'name' | 'model'>
) {
  if (form.productId === product.id) return
  form.productId = product.id
  form.productName = product.name
  form.model = product.model ?? ''
}
