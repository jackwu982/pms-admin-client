<template>
  <el-dialog
    v-model="visible"
    :title="form.id ? '编辑员工' : '新增员工'"
    width="520px"
    :close-on-click-modal="false"
    :before-close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="建议输入手机号" :disabled="!!form.id" />
      </el-form-item>

      <el-form-item label="昵称（真实姓名）" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入真实姓名" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          :placeholder="form.id ? '留空则不修改密码' : '请输入密码'" />
      </el-form-item>

      <el-form-item label="确认密码" prop="password2">
        <el-input
          v-model="form.password2"
          type="password"
          show-password
          :placeholder="form.id ? '留空则不修改密码' : '请再次输入密码'" />
      </el-form-item>

      <el-form-item label="所属部门" prop="departmentId">
        <el-select v-model="form.departmentId" placeholder="请选择部门" class="w-full">
          <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
      </el-form-item>

      <div v-if="departments.length === 0" class="text-xs text-[var(--el-text-color-secondary)]">
        暂无部门，请先创建部门
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="departments.length === 0" @click="save">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  import { userApi } from '@/api/user'
  import type { DepartmentOption, User } from '@/types/userType'

  import { useCacheDepartmentStore } from '@/stores/cacheDepartment'

  const props = defineProps<{
    user?: User
  }>()

  const emits = defineEmits(['closed', 'saved'])

  const visible = ref(true)
  const saving = ref(false)
  const departments = ref<DepartmentOption[]>([])

  const handleClose = () => {
    emits('closed')
  }

  const formRef = ref<FormInstance>()
  const form = reactive<{
    id?: number
    username: string
    nickname: string
    password: string
    password2: string
    departmentId?: number
  }>({
    id: undefined,
    username: '',
    nickname: '',
    password: '',
    password2: '',
    departmentId: undefined,
  })

  const rules: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
    departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  }

  const departmentStore = useCacheDepartmentStore()

  async function fetchDepartments() {
    departments.value = await departmentStore.getDepartments()
  }

  async function save() {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    if (!form.id && !form.password) {
      ElMessage.warning('请输入密码')
      return
    }
    if (form.password && form.password !== form.password2) {
      ElMessage.warning('两次密码不一致')
      return
    }

    const payload: Record<string, any> = {
      username: form.username.trim(),
      nickname: form.nickname.trim(),
      departmentId: form.departmentId,
    }
    if (form.password) payload.password = form.password

    saving.value = true
    try {
      if (form.id) {
        await userApi.update({ id: form.id, ...payload })
        ElMessage.success('编辑成功')
      } else {
        await userApi.create(payload)
        ElMessage.success('创建成功')
      }

      emits('saved')
      visible.value = false
    } catch {
      // error toast already shown by the shared axios interceptor
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    const u = props.user
    if (u) {
      form.id = u.id
      form.username = u.username ?? ''
      form.nickname = u.nickname ?? ''
      form.departmentId = u.departmentId
    }
    fetchDepartments()
  })
</script>

<style lang="less" scoped></style>
