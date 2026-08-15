import dayjs from 'dayjs'

const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD')

export const DATE_SHORTCUTS: { text: string; value: () => [string, string] }[] = [
  {
    text: '今日',
    value: () => [fmt(dayjs()), fmt(dayjs())],
  },
  {
    text: '昨日',
    value: () => {
      const d = dayjs().subtract(1, 'day')
      return [fmt(d), fmt(d)]
    },
  },
  {
    text: '本周',
    value: () => {
      const monday = dayjs().day(1).startOf('day')
      return [fmt(monday), fmt(dayjs())]
    },
  },
  {
    text: '上周',
    value: () => {
      const monday = dayjs().day(1).subtract(7, 'day')
      const sunday = monday.add(6, 'day')
      return [fmt(monday), fmt(sunday)]
    },
  },
  {
    text: '本月',
    value: () => [fmt(dayjs().startOf('month')), fmt(dayjs())],
  },
  {
    text: '上月',
    value: () => {
      const start = dayjs().subtract(1, 'month').startOf('month')
      return [fmt(start), fmt(start.endOf('month'))]
    },
  },
  {
    text: '近30天',
    value: () => [fmt(dayjs().subtract(30, 'day')), fmt(dayjs())],
  },
]
