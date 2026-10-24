<template>
  <el-select
    :model-value="modelValue"
    filterable
    remote
    :remote-method="search"
    :loading="loading"
    :placeholder="placeholder"
    @change="choose">
    <el-option
      v-for="option in options"
      :key="option.id"
      :value="option.id"
      :label="option.label" />
    <template #footer>
      <el-button v-if="failed" link type="primary" @click="load(false)">加载失败，重试</el-button>
      <el-button v-else-if="hasMore" link type="primary" :loading="loading" @click="load(true)">
        加载更多
      </el-button>
    </template>
  </el-select>
</template>
<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  export interface ResourceOption {
    id: number
    label: string
    [key: string]: unknown
  }
  const props = defineProps<{
    modelValue?: number
    selectedLabel?: string
    placeholder?: string
    fetch: (query: string, page: number) => Promise<{ list: ResourceOption[]; total: number }>
  }>()
  const emit = defineEmits<{ select: [option: ResourceOption] }>()
  const rows = ref<ResourceOption[]>([])
  const options = computed(() =>
    props.modelValue != null && !rows.value.some((r) => r.id === props.modelValue)
      ? [
          { id: props.modelValue, label: props.selectedLabel || String(props.modelValue) },
          ...rows.value,
        ]
      : rows.value
  )
  const loading = ref(false)
  const failed = ref(false)
  const hasMore = ref(false)
  let query = ''
  let page = 0
  let request = 0
  function search(value: string) {
    query = value.trim()
    void load(false)
  }
  async function load(more: boolean) {
    if (more && loading.value) return
    const current = ++request
    const next = more ? page + 1 : 1
    loading.value = true
    failed.value = false
    if (!more) rows.value = []
    try {
      const data = await props.fetch(query, next)
      if (current !== request) return
      rows.value = more ? [...rows.value, ...data.list] : data.list
      page = next
      hasMore.value = next * 20 < data.total
    } catch {
      if (current === request) failed.value = true
    } finally {
      if (current === request) loading.value = false
    }
  }
  function choose(id: number) {
    const option = rows.value.find((r) => r.id === id)
    if (option) emit('select', option)
  }
  onMounted(() => load(false))
</script>
