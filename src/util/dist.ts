const DATE_SHORTCUTS = [
  {
    text: '今天',
    value: () => {
      const start = new Date()
      return [start, start]
    },
  },
  {
    text: '昨天',
    value: () => {
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      return [start, start]
    },
  },
  {
    text: '近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
]

export { DATE_SHORTCUTS }
