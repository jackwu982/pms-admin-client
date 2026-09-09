import type { Task } from '@/types/taskType'

// Derive display children without changing the API's parallel collections.
export function buildTaskHierarchy(task: Task) {
  const subTasks = task.subTasks ?? []
  const processes = task.processes ?? []
  const subTaskIds = new Set(subTasks.filter((s) => s.id != null).map((s) => String(s.id)))
  return {
    ...task,
    subTasks: subTasks.map((subTask) => ({
      ...subTask,
      processes: processes.filter(
        (process) =>
          subTask.id != null &&
          process.subTaskId != null &&
          String(process.subTaskId) === String(subTask.id)
      ),
    })),
    unassignedProcesses: processes.filter(
      (process) => process.subTaskId == null || !subTaskIds.has(String(process.subTaskId))
    ),
  }
}
