import type { SaleOrder, SaleOrderPayload, SaleOrderItem } from '../types/saleOrderType'
import type { Product } from '../types/productType'

export function createSaleOrderForm(order?: SaleOrder, today = ''): SaleOrderPayload {
  return {
    orderNo: order?.orderNo ?? '',
    customerName: order?.customerName ?? '',
    orderDate: order?.orderDate ?? today,
    status: order?.status ?? 0,
    remark: order?.remark ?? '',
    configurationDetails: order?.configurationDetails?.map((detail) => ({ ...detail })) ?? [],
    items: order?.items.map((item) => ({ ...item })) ?? [],
  }
}
export function selectSaleOrderProduct(
  form: SaleOrderPayload,
  product: Pick<Product, 'id' | 'name' | 'model'>
) {
  if (form.items.some((item) => item.productId === product.id)) return
  form.items.push({
    productId: product.id,
    productName: product.name,
    model: product.model ?? '',
    unit: '',
  } as SaleOrderItem)
}
