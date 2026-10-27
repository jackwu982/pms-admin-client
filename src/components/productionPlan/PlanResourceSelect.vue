<template>
  <el-select
    :model-value="modelValue"
    :multiple="multiple"
    :disabled="disabled"
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
    modelValue?: number | number[]
    multiple?: boolean
    disabled?: boolean
    selectedOptions?: ResourceOption[]
    selectedLabel?: string
    placeholder?: string
    fetch: (query: string, page: number) => Promise<{ list: ResourceOption[]; total: number }>
  }>()
  const emit = defineEmits<{
    select: [option: ResourceOption]
    change: [options: ResourceOption[]]
  }>()
  const rows = ref<ResourceOption[]>([])
  const options = computed(() => {
    const selected = props.multiple
      ? (props.selectedOptions ?? [])
      : typeof props.modelValue === 'number'
        ? [{ id: props.modelValue, label: props.selectedLabel || String(props.modelValue) }]
        : []
    return [
      ...selected.filter((item) => !rows.value.some((row) => row.id === item.id)),
      ...rows.value,
    ]
  })
  const loading = ref(false)
  const failed = ref(false)
  const hasMore = ref(false)
  let query = ''
  let page = 0
  let request = 0
  function search(value: string) {
    const nextQuery = value.trim()
    if (nextQuery === query && !failed.value && (loading.value || page > 0)) return
    query = nextQuery
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
  function choose(id: number | number[]) {
    if (Array.isArray(id)) {
      emit(
        'change',
        options.value.filter((option) => id.includes(option.id))
      )
      return
    }
    const option = options.value.find((r) => r.id === id)
    if (option) emit('select', option)
  }
  onMounted(() => load(false))
</script>
