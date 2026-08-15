<template>
  <div class="px-6 py-2">
    <el-table :data="processes" size="small">
      <el-table-column prop="name" label="工序名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="difficulty" label="难度系数" width="90" />
      <el-table-column label="总工时(h)" width="100">
        <template #default="{ row: p }">{{ p.totalHours }}</template>
      </el-table-column>
      <el-table-column label="标准工序" width="90">
        <template #default="{ row: p }">{{ p.standardFlag ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="标准工时(h)" width="110">
        <template #default="{ row: p }">
          {{ p.standardFlag ? (p.standardHours ?? '-') : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row: p }">
          <span :class="p.published !== false ? 'text-green-600' : 'text-gray-400'">
            {{ p.published !== false ? '上架' : '下架' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="160" show-overflow-tooltip>
        <template #default="{ row: p }">{{ p.remark || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row: p }">
          <el-button type="primary" link size="small" @click="emits('edit', p)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
  import type { Process } from '@/types/taskType'

  withDefaults(defineProps<{ processes?: Process[] }>(), {
    processes: () => [],
  })

  const emits = defineEmits(['edit', 'delete'])
</script>

<style lang="less" scoped></style>
