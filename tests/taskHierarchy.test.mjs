import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTaskHierarchy } from '../src/utils/taskHierarchy.ts'

test('groups parallel processes under their sub-task without mutating the response', () => {
  const task = {
    id: 1,
    name: '任务',
    subTasks: [
      { id: 10, name: '子任务一' },
      { id: 20, name: '子任务二' },
    ],
    processes: [
      { id: 100, subTaskId: 20 },
      { id: 101, subTaskId: 10 },
    ],
  }
  const before = structuredClone(task)
  const result = buildTaskHierarchy(task)
  assert.deepEqual(
    result.subTasks.map((s) => s.processes.map((p) => p.id)),
    [[101], [100]]
  )
  assert.deepEqual(result.unassignedProcesses, [])
  assert.deepEqual(task, before)
})

test('retains legacy and unknown-parent processes, and matches string IDs', () => {
  const result = buildTaskHierarchy({
    name: '任务',
    subTasks: [{ id: '10' }],
    processes: [{ id: 1, subTaskId: 10 }, { id: 2 }, { id: 3, subTaskId: 99 }],
  })
  assert.deepEqual(
    result.subTasks[0].processes.map((p) => p.id),
    [1]
  )
  assert.deepEqual(
    result.unassignedProcesses.map((p) => p.id),
    [2, 3]
  )
})

test('handles tasks with no child collections', () => {
  const result = buildTaskHierarchy({ name: '新任务' })
  assert.deepEqual(result.subTasks, [])
  assert.deepEqual(result.unassignedProcesses, [])
})
