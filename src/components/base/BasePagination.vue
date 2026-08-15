<template>
  <div class="flex justify-end p-4">
    <el-pagination
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :background="true"
      layout="total, sizes, prev, pager, next"
      :total="total"
      :hide-on-single-page="hideOnSinglePage"
      @size-change="emits('size-change')"
      @current-change="emits('current-change')" />
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    total: number
    hideOnSinglePage?: boolean
  }>()

  const pageNum = defineModel<number>('pageNum', { required: true })
  const pageSize = defineModel<number>('pageSize', { required: true })
  const emits = defineEmits(['size-change', 'current-change'])
</script>

<style lang="less" scoped></style>
