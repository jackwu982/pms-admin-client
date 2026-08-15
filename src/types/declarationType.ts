export interface StandardProcessRef {
  id?: number
  name: string
  categoryName?: string
}

export interface Declaration {
  id?: number
  userId?: number
  nickname?: string
  standardProcess?: StandardProcessRef
  estimatedHours?: number
  actualHours?: number
  delayApply?: boolean
  status?: number
  rejectReason?: string
  createTime?: string
}
