export function planOperationTarget(
  standardFlag: number,
  quantity: number | undefined,
  hours: number | undefined
) {
  if (standardFlag === 1) {
    if (!Number.isInteger(quantity) || quantity == null || quantity <= 0 || quantity > 2147483647)
      throw new Error('标准工序计划总数量必须为正整数')
    return { totalQuantity: quantity, totalHours: 0 }
  }
  if (hours == null || !Number.isFinite(hours) || hours < 0.01 || hours > 99999999.99)
    throw new Error('非标准工序计划总时长必须大于 0')
  return { totalQuantity: 0, totalHours: Math.round(hours * 100) / 100 }
}
