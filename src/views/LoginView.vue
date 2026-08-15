<template>
  <div class="flex h-screen w-full items-center justify-center bg-[var(--el-bg-color-page)]">
    <el-card class="w-[400px]" :body-style="{ padding: '40px 32px' }">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold text-[var(--el-text-color-primary)]">PMS 管理系统</h1>
        <p class="mt-2 text-sm text-[var(--el-text-color-secondary)]">登录您的账户</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            clearable
            :prefix-icon="User"
            @keyup.enter="handleLogin" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="handleLogin" />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="mt-2 w-full"
          :loading="loading"
          @click="handleLogin">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { Lock, User } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'

  import { userApi } from '@/api/user'
  import { localStore } from '@/composables/store'

  const router = useRouter()

  const formRef = ref<FormInstance>()
  const loading = ref(false)

  const form = reactive({
    username: '',
    password: '',
  })

  const rules: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  }

  const handleLogin = () => {
    formRef.value?.validate((valid) => {
      if (!valid) return

      loading.value = true
      userApi
        .login(form.username, form.password)
        .then((res: any) => {
          const user = res.data || {}
          localStore.set('user', user)
          localStore.set('permissions', user.permissions)

          router.push({ name: 'homepage' })
        })
        .catch(() => {
          // error toast is already handled by the shared axios interceptor
        })
        .finally(() => {
          loading.value = false
        })
    })
  }
</script>

<style lang="less" scoped></style>
