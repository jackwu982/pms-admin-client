<template>
  <div></div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'

  import { userApi } from '@/api/user'
  import { localStore } from '@/composables/store'

  const router = useRouter()

  onMounted(async () => {
    try {
      await userApi.logout()
    } catch {
      // ignore — still clear local state
    }
    localStore.remove('user')
    localStore.remove('permissions')
    router.replace({ name: 'login' })
  })
</script>

<style lang="less" scoped></style>
