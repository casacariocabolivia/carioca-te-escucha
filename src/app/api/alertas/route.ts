import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const storeSlug = req.nextUrl.searchParams.get('storeSlug') ?? 'centro'
  const store = await prisma.store.findUnique({ where: { slug: storeSlug } })
  if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })

  const [rules, openAlerts] = await Promise.all([
    prisma.alertRule.findMany({
      where: { storeId: store.id },
      include: { vendor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.alert.findMany({
      where: { feedback: { storeId: store.id }, status: 'OPEN' },
      include: {
        rule: true,
        feedback: {
          include: { vendor: { select: { id: true, name: true } }, alerts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return NextResponse.json({ rules, openAlerts })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeSlug, name, type, operator, value, vendorId } = body

  const store = await prisma.store.findUnique({ where: { slug: storeSlug ?? 'centro' } })
  if (!store) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })

  const rule = await prisma.alertRule.create({
    data: { storeId: store.id, name, type, operator: operator ?? null, value, vendorId: vendorId ?? null },
  })
  return NextResponse.json({ rule }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, active } = body
  const rule = await prisma.alertRule.update({ where: { id }, data: { active } })
  return NextResponse.json({ rule })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  await prisma.alertRule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
