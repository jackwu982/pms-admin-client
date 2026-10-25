export interface Equipment {
  id?: number
  code: string
  name: string
  status: number
  lastMaintenanceTime?: string | null
  maintenanceCycleDays: number
  ownerId?: number
  ownerName?: string
}
export interface Feedback {
  id: number
  type: number
  title: string
  content: string
  userId: number
  userName: string
  createTime: string
}
