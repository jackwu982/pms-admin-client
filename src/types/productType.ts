export type CatalogStatus = 0 | 1

export interface CatalogEntity {
  id: number
  name: string
  status: CatalogStatus
  remark?: string | null
}

export interface Product extends CatalogEntity {
  model?: string | null
  spec?: string | null
  parts?: Part[]
}

export interface Part extends CatalogEntity {
  productId: number
  operations?: Operation[]
}

export interface Operation extends CatalogEntity {
  partId: number
  standardFlag: CatalogStatus
  stdTime?: number | null
}

export type CatalogEditor =
  | { kind: 'product'; record?: Product }
  | { kind: 'part'; product: Product; record?: Part }
  | { kind: 'operation'; product: Product; part: Part; record?: Operation }
