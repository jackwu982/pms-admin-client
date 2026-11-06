import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { reportStatuses, type PlanOperationReport } from '../types/planOperationReportType.ts'

export async function fetchAllReports(
  fetchPage: (
    pageNum: number,
    pageSize: number
  ) => Promise<{ list: PlanOperationReport[]; total: number }>,
  onProgress: (loaded: number, total: number) => void = () => {}
) {
  const rows: PlanOperationReport[] = []
  let total = Infinity
  for (let page = 1; rows.length < total; page++) {
    const result = await fetchPage(page, 500)
    total = result.total
    if (!result.list.length && rows.length < total) throw new Error('分页数据不完整，请重新导出')
    rows.push(...result.list)
    onProgress(rows.length, total)
  }
  return rows
}

export function reportWorkbook(rows: PlanOperationReport[]) {
  const format = (value?: string, pattern = 'YYYY-MM-DD HH:mm:ss') =>
    value ? dayjs(value).format(pattern) : ''
  const data = [
    [
      '记录ID',
      '上报人',
      '上报日期',
      '创建时间',
      '计划编号',
      '产品',
      '部件',
      '工序',
      '工序类型',
      '完成数量',
      '合格数量',
      '不良数量',
      '工时（小时）',
      '状态',
      '备注',
      '驳回原因',
      '审核人ID',
      '审核时间',
    ],
    ...rows.map((row) => [
      String(row.id),
      row.reporterName || '',
      format(row.reportTime, 'YYYY-MM-DD'),
      format(row.createTime),
      row.planNo || '',
      row.productName || '',
      row.partName || '',
      row.processName || '',
      row.standardFlag === 1 ? '标准工序' : row.standardFlag === 0 ? '非标准工序' : '未知',
      row.standardFlag === 0 ? '' : row.reportQty,
      row.standardFlag === 0 ? '' : row.qualifiedQty,
      row.standardFlag === 0 ? '' : row.defectQty,
      Number(row.workHours),
      reportStatuses.find((status) => status.value === row.status)?.label || '未知',
      row.remark || '',
      row.rejectReason || '',
      row.auditUserId == null ? '' : String(row.auditUserId),
      format(row.auditTime),
    ]),
  ]
  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = data[0]!.map(() => ({ wch: 22 }))
  sheet['!autofilter'] = { ref: sheet['!ref']! }
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, '上报记录')
  return book
}
