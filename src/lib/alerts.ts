import { prisma } from './prisma'

interface FeedbackInput {
  id: string
  rating: number
  comment: string | null
  storeId: string
  vendorId: string | null
}

export async function checkAndCreateAlerts(feedback: FeedbackInput) {
  const rules = await prisma.alertRule.findMany({
    where: {
      storeId: feedback.storeId,
      active: true,
      OR: [{ vendorId: null }, { vendorId: feedback.vendorId }],
    },
  })

  for (const rule of rules) {
    if (!matchesRule(rule, feedback)) continue

    const windowMs = 10 * 60 * 1000
    const since = new Date(Date.now() - windowMs)
    const groupKey = `${rule.id}:${feedback.vendorId ?? 'global'}`

    const existing = await prisma.alert.findFirst({
      where: {
        ruleId: rule.id,
        groupKey,
        createdAt: { gte: since },
        status: 'OPEN',
      },
    })

    if (!existing) {
      await prisma.alert.create({
        data: {
          ruleId: rule.id,
          feedbackId: feedback.id,
          groupKey,
        },
      })
    }
  }
}

function matchesRule(
  rule: { type: string; operator: string | null; value: string; field: string },
  feedback: FeedbackInput,
): boolean {
  if (rule.type === 'THRESHOLD') {
    const threshold = parseFloat(rule.value)
    const actual = feedback.rating
    if (rule.operator === '<=') return actual <= threshold
    if (rule.operator === '>=') return actual >= threshold
    if (rule.operator === '==') return actual === threshold
    return false
  }
  if (rule.type === 'KEYWORD') {
    return (
      (feedback.comment?.toLowerCase().includes(rule.value.toLowerCase()) ??
        false)
    )
  }
  if (rule.type === 'REGEX') {
    try {
      return new RegExp(rule.value, 'i').test(feedback.comment ?? '')
    } catch {
      return false
    }
  }
  return false
}
