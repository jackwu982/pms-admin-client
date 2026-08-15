import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(duration)

const useDayjs = () => {
  const dayjsFormat = (date: any, template = 'YYYY-MM-DD HH:mm:ss'): string => {
    return date ? dayjs(date).format(template) : ''
  }
  return { dayjsFormat, dayjs }
}

export { useDayjs }
