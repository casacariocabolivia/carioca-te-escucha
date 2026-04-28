import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const storeSlug = req.nextUrl.searchParams.get('storeSlug') ?? 'centro'
  const vendorId = req.nextUrl.searchParams.get('vendorId')
  const severity = req.nextUrl.searchParams.get('severity')
  const onlyPending = req.nextUrl.searchParams.get('pending') === '1'

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } })
  if (!store) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  }

  const where: Record<string, unknown> = { storeId: store.id }
  if (vendorId) where.vendorId = vendorId
  if (onlyPending) where.reviewed = false
  if (severity === 'critico') where.rating = { lte: 2 }
  else if (severity === 'bueno') where.rating = { gte: 4 }

  const [feedbacks, stats, openAlerts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true } },
        alerts: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.feedback.aggregate({
      where: { storeId: store.id },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.alert.count({
      where: { feedback: { storeId: store.id }, status: 'OPEN' },
    }),
  ])

  const pending = await prisma.feedback.count({
    where: { storeId: store.id, reviewed: false },
  })

  return NextResponse.json({
    feedbacks,
    store: { id: store.id, name: store.name },
    stats: {
      total: stats._count,
      avgRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
      pending,
      openAlerts,
    },
  })
}
