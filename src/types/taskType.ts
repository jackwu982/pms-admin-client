export interface Manager {
  id: number
  nickname: string
}

export interface DepartmentRef {
  id: number
  name: string
}

export interface Process {
  id?: number
  taskId?: number
  subTaskId?: number
  name: string
  difficulty?: number
  totalHours?: number
  remark?: string
  published?: boolean
  standardFlag?: boolean
  standardHours?: number | null
  startDate?: string | null
  endDate?: string | null
  managers?: Manager[]
}

export interface ProcessForm extends Process {
  difficulty: number
  totalHours: number
  remark: string
  published: boolean
  standardFlag: boolean
  standardHours: number | null
  startDate: string | null
  endDate: string | null
  managers: Manager[]
  _managerOptions: Manager[]
  _managerLoading: boolean
}

export interface SubTask {
  id?: number
  taskId: number
  name: string
  published?: boolean
  managers?: Manager[]
  startDate?: string | null
  endDate?: string | null
}

export interface Task {
  id?: number
  name: string
  published?: boolean
  departments?: DepartmentRef[]
  managers?: Manager[]
  startDate?: string | null
  endDate?: string | null
  subTasks?: SubTask[]
  processes?: Process[]
}
