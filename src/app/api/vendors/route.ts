import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const storeSlug = req.nextUrl.searchParams.get('storeSlug')
  if (!storeSlug) {
    return NextResponse.json({ error: 'storeSlug requerido' }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } })
  if (!store) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  }

  const vendors = await prisma.user.findMany({
    where: { storeId: store.id, role: 'VENDOR' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const vendorsWithAvg = await Promise.all(
    vendors.map(async (v) => {
      const agg = await prisma.feedback.aggregate({
        where: { vendorId: v.id },
        _avg: { rating: true },
        _count: true,
      })
      return {
        ...v,
        avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
        totalFeedbacks: agg._count,
      }
    }),
  )

  return NextResponse.json({ vendors: vendorsWithAvg, store: { id: store.id, name: store.name } })
}
