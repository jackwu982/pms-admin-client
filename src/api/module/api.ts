import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import messages from './i18n'
import { ElMessage } from 'element-plus'

export interface HttpResponse<T = unknown> {
  data: T
  code: string
  message: string
}

const api: AxiosInstance = axios.create({})

//translate msg with i18n
const notifyI18nMsg = (data: Record<string, any>): void => {
  const i18n = 'zh'
  const msg: string = data.msg || messages[i18n][data.code] || messages[i18n][data.status]
  ElMessage.error({ message: msg, grouping: true })
}

api.interceptors.response.use(
  (res: AxiosResponse<any, any>) => {
    // no response.data or response.data.status === 'success' means that request is ok

    const code = res?.data?.code
    if (!code || code === 200) {
      return res.data
    }

    notifyI18nMsg(res.data)
    if (code == 403 || code == 401) {
      document.location.href = '/login'
    }
    return Promise.reject(res)
  },
  (err: any) => {
    console.error(err)
    notifyI18nMsg(err.response?.data || { code: err?.response?.status })
    return Promise.reject(err.response)
  }
)
export default api
