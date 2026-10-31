<template>
  <div class="login-page flex min-h-screen w-full items-center justify-center px-4">
    <el-card class="login-card w-full max-w-[420px]" :body-style="{ padding: '36px 34px' }">
      <div class="mb-8 text-center">
        <span class="login-mark">P</span>
        <h1 class="text-2xl font-semibold text-[var(--el-text-color-primary)]">PMS 管理系统</h1>
        <p class="mt-2 text-sm text-[var(--el-text-color-secondary)]">登录以继续管理生产运营</p>
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

<style scoped>
  .login-page {
    background: radial-gradient(circle at 50% 0%, #e4eefb 0, #f4f7fb 46%, #eef3f9 100%);
  }
  .login-card {
    border: 1px solid #e2e9f2;
    border-radius: 16px;
    box-shadow: 0 18px 55px #1d38521a;
  }
  .login-mark {
    display: grid;
    width: 46px;
    height: 46px;
    margin: 0 auto 16px;
    place-items: center;
    border-radius: 12px;
    background: #1d5eb7;
    color: #fff;
    font-size: 24px;
    font-weight: 800;
  }
</style>
