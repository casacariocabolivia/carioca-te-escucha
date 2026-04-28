import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get('vendorId')
  if (!vendorId) {
    return NextResponse.json({ error: 'vendorId requerido' }, { status: 400 })
  }

  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, storeId: true },
  })
  if (!vendor) {
    return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 })
  }

  const [feedbacks, agg] = await Promise.all([
    prisma.feedback.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.feedback.aggregate({
      where: { vendorId },
      _avg: { rating: true },
      _count: true,
    }),
  ])

  const distribution = await Promise.all(
    [1, 2, 3, 4, 5].map(async (r) => ({
      rating: r,
      count: await prisma.feedback.count({ where: { vendorId, rating: r } }),
    })),
  )

  return NextResponse.json({
    vendor,
    feedbacks,
    stats: {
      total: agg._count,
      avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
      distribution,
    },
  })
}
