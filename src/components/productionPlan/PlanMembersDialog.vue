<template>
  <el-dialog
    :model-value="true"
    title="调整计划人员"
    width="min(600px, 94vw)"
    :close-on-click-modal="false"
    :before-close="close">
    <div v-loading="loading">
      <p class="mb-4 text-sm text-gray-500">所属计划：{{ plan.planNo }}</p>
      <el-button v-if="failed" link type="primary" @click="load">人员加载失败，点击重试</el-button>
      <el-form v-else label-position="top">
        <el-form-item v-for="(label, index) in memberTypes" :key="index" :label="label">
          <PlanResourceSelect
            multiple
            :model-value="members.filter((m) => m.memberType === index + 1).map((m) => m.userId)"
            :selected-options="selectedOptions(index + 1)"
            :disabled="loading || saving.has(index + 1)"
            :fetch="fetchUsers"
            :placeholder="`搜索并选择${label}（可多选）`"
            @change="(options) => changeMembers(index + 1, options)" />
          <span v-if="saving.has(index + 1)" class="text-xs text-gray-500">正在保存…</span>
        </el-form-item>
        <p class="text-xs text-gray-500">选择或取消选择后立即保存，可为每种类型选择多名人员。</p>
      </el-form>
    </div>
    <template #footer>
      <el-button :disabled="saving.size > 0" @click="close">关闭</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { productionPlanApi, planMemberApi } from '@/api/productionPlan'
  import { userApi } from '@/api/user'
  import { memberTypes, type PlanMember, type ProductionPlan } from '@/types/productionPlanType'
  import PlanResourceSelect, { type ResourceOption } from './PlanResourceSelect.vue'

  const props = defineProps<{ plan: ProductionPlan }>()
  const emit = defineEmits<{ closed: []; saved: [] }>()
  const members = ref<PlanMember[]>([])
  const loading = ref(true)
  const failed = ref(false)
  const saving = reactive(new Set<number>())

  function selectedOptions(type: number): ResourceOption[] {
    return members.value
      .filter((member) => member.memberType === type)
      .map((member) => ({ id: member.userId, label: member.userName }))
  }
  async function fetchUsers(query: string, page: number) {
    const res = await userApi.list({ keyword: query || undefined, pageNum: page, pageSize: 20 })
    return {
      total: res.data.total,
      list: res.data.list.map((user: { id: number; nickname: string }) => ({
        id: user.id,
        label: user.nickname,
      })),
    }
  }
  async function load() {
    loading.value = true
    failed.value = false
    try {
      const res = await productionPlanApi.get(props.plan.id)
      members.value = res.data.members ?? []
    } catch {
      failed.value = true
    } finally {
      loading.value = false
    }
  }
  async function changeMembers(type: number, options: ResourceOption[]) {
    if (loading.value || saving.has(type)) return
    const current = members.value.filter((member) => member.memberType === type)
    const added = options.filter((option) => !current.some((member) => member.userId === option.id))
    const removed = current.filter(
      (member) => !options.some((option) => option.id === member.userId)
    )
    if (!added.length && !removed.length) return
    saving.add(type)
    let changed = false
    try {
      for (const option of added) {
        const res = await planMemberApi.create({
          planId: props.plan.id,
          userId: option.id,
          userName: option.label,
          memberType: type,
        })
        members.value.push(res.data)
        changed = true
      }
      for (const member of removed) {
        await planMemberApi.remove(member.id)
        members.value = members.value.filter((item) => item.id !== member.id)
        changed = true
      }
    } catch {
      ElMessage.error('人员调整未全部保存，请检查当前选择后重试')
    } finally {
      saving.delete(type)
      if (changed) emit('saved')
    }
  }
  function close() {
    if (!saving.size) emit('closed')
  }
  onMounted(load)
</script>
