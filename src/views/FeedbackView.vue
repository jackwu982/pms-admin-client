<template>
  <BaseTableContainer>
    <template #filter-content>
      <BaseSearchForm @search="search" @reset="reset">
        <el-form-item label="关键词">
          <el-input
            v-model="params.keyword"
            placeholder="标题 / 内容 / 提交人"
            clearable
            class="w-60!" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="params.type" placeholder="全部类型" clearable class="w-40!">
            <el-option label="投诉" :value="1" />
            <el-option label="建议" :value="2" />
          </el-select>
        </el-form-item>
      </BaseSearchForm>
    </template>
    <template #content>
      <el-alert v-if="failed" title="记录加载失败，请重试" type="error" :closable="false" />
      <el-table v-loading="loading" :data="rows">
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'warning' : 'primary'">
              {{ row.type === 1 ? '投诉' : '建议' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip />
        <el-table-column prop="userName" label="提交人" width="140" />
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">{{ dayjsFormat(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="selected = row as Feedback">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <BasePagination
        :total="total"
        v-model:page-num="params.pageNum"
        v-model:page-size="params.pageSize"
        @size-change="load"
        @current-change="load" />
    </template>
  </BaseTableContainer>
  <el-dialog
    :model-value="!!selected"
    title="投诉建议详情"
    width="640px"
    @close="selected = undefined">
    <template v-if="selected">
      <div class="mb-4 text-sm text-gray-500">
        {{ selected.type === 1 ? '投诉' : '建议' }} · {{ selected.userName }} ·
        {{ dayjsFormat(selected.createTime) }}
      </div>
      <h3 class="mb-4 text-lg break-words">{{ selected.title }}</h3>
      <div class="max-h-[60vh] overflow-y-auto text-sm leading-7 break-words whitespace-pre-wrap">
        {{ selected.content }}
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { feedbackApi } from '@/api/feedback'
  import type { Feedback } from '@/types/support'
  import { useDayjs } from '@/util/dayjs'
  const { dayjsFormat } = useDayjs()
  const params = reactive({
    keyword: '',
    type: undefined as number | undefined,
    pageNum: 1,
    pageSize: 10,
  })
  const rows = ref<Feedback[]>([]),
    selected = ref<Feedback>()
  const total = ref(0),
    loading = ref(false),
    failed = ref(false)
  let request = 0
  async function load() {
    const current = ++request
    loading.value = true
    try {
      const res = await feedbackApi.list(params)
      if (current !== request) return
      rows.value = res.data.list
      total.value = res.data.total
      failed.value = false
    } catch {
      if (current === request) failed.value = true
    } finally {
      if (current === request) loading.value = false
    }
  }
  function search() {
    params.pageNum = 1
    void load()
  }
  function reset() {
    params.keyword = ''
    params.type = undefined
    search()
  }
  onMounted(load)
</script>
<style lang="less" scoped></style>
