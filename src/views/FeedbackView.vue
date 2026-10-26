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
        <el-table-column label="反馈状态" width="110">
          <template #default="{ row }">{{ statuses[row.feedbackStatus ?? 0] }}</template>
        </el-table-column>
        <el-table-column
          prop="feedbackOpinion"
          label="反馈意见"
          min-width="200"
          show-overflow-tooltip />
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">{{ dayjsFormat(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="open(row as Feedback)">查看 / 反馈</el-button>
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
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
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
      <el-form class="mt-5" label-position="top" :disabled="saving">
        <el-form-item label="反馈状态">
          <el-select v-model="response.feedbackStatus">
            <el-option
              v-for="(label, value) in statuses"
              :key="value"
              :label="label"
              :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="反馈意见">
          <el-input
            v-model="response.feedbackOpinion"
            type="textarea"
            :rows="4"
            maxlength="5000"
            show-word-limit
            placeholder="填写给提交人的反馈意见" />
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <el-button :disabled="saving" @click="selected = undefined">取消</el-button>
      <el-button type="primary" :loading="saving" @click="saveResponse">保存反馈</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { feedbackApi } from '@/api/feedback'
  import type { Feedback } from '@/types/support'
  import { useDayjs } from '@/util/dayjs'
  import { ElMessage } from 'element-plus'
  const statuses = ['待处理', '处理中', '已处理']
  const saving = ref(false)
  const response = reactive({ feedbackStatus: 0, feedbackOpinion: '' })
  function open(row: Feedback) {
    selected.value = row
    response.feedbackStatus = row.feedbackStatus ?? 0
    response.feedbackOpinion = row.feedbackOpinion ?? ''
  }
  async function saveResponse() {
    if (!selected.value || saving.value) return
    const opinion = response.feedbackOpinion.trim()
    if (response.feedbackStatus === 2 && !opinion) {
      ElMessage.warning('已处理时请填写反馈意见')
      return
    }
    saving.value = true
    try {
      await feedbackApi.respond(selected.value.id, { ...response, feedbackOpinion: opinion })
      ElMessage.success('反馈已保存')
      selected.value = undefined
      await load()
    } catch {
      /* Shared API client displays failures. */
    } finally {
      saving.value = false
    }
  }
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
