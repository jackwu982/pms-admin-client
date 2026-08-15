import { defineStore } from 'pinia'
import { ref } from 'vue'

import { departmentApi } from '@/api/department'
import type { DepartmentOption } from '@/types/userType'

export const useCacheDepartmentStore = defineStore('cacheDepartment', () => {
  const departments = ref<DepartmentOption[]>([])
  const loaded = ref(false)

  const getDepartments = async (): Promise<DepartmentOption[]> => {
    if (loaded.value) {
      return departments.value
    }

    const res: any = await departmentApi.listAll({})
    departments.value = res.data ?? []
    loaded.value = true
    return departments.value
  }

  return {
    getDepartments,
  }
})
