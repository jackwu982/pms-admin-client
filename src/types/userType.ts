export interface DepartmentOption {
  id: number
  name: string
}

export interface User {
  id?: number
  username: string
  nickname: string
  departmentId?: number
  createTime?: string
}
