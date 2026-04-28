import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndCreateAlerts } from '@/lib/alerts'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeSlug, rating, vendorId, comment } = body

  if (!storeSlug || rating == null) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Calificación inválida' }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } })
  if (!store) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  }

  const feedback = await prisma.feedback.create({
    data: {
      rating,
      comment: comment?.trim() || null,
      storeId: store.id,
      vendorId: vendorId || null,
    },
  })

  await checkAndCreateAlerts({
    id: feedback.id,
    rating: feedback.rating,
    comment: feedback.comment,
    storeId: feedback.storeId,
    vendorId: feedback.vendorId,
  })

  return NextResponse.json({ feedbackId: feedback.id }, { status: 201 })
}
