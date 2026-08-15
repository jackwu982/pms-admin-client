export interface StandardProcess {
  id?: number
  name: string
  categoryId?: number
  category?: { id: number; name: string }
  standardHours?: number | null
  description?: string
  published?: boolean
  createTime?: string
}
