import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { action, resolvedById } = await req.json()

  if (action === 'reviewed') {
    const feedback = await prisma.feedback.update({
      where: { id: params.id },
      data: {
        reviewed: true,
        reviewedById: resolvedById ?? null,
        reviewedAt: new Date(),
      },
    })
    await prisma.alert.updateMany({
      where: { feedbackId: params.id, status: 'OPEN' },
      data: { status: 'RESOLVED', resolvedById, resolvedAt: new Date() },
    })
    return NextResponse.json({ feedback })
  }

  if (action === 'create_task') {
    const { description, assignedToId } = await req.json().catch(() => ({}))
    const alert = await prisma.alert.findFirst({
      where: { feedbackId: params.id, status: 'OPEN' },
    })

    if (alert) {
      await prisma.task.create({
        data: {
          alertId: alert.id,
          feedbackId: params.id,
          assignedToId: assignedToId ?? resolvedById,
          description: description ?? 'Seguimiento de feedback crítico',
        },
      })
      await prisma.alert.update({
        where: { id: alert.id },
        data: { status: 'TASK_CREATED' },
      })
    }

    await prisma.feedback.update({
      where: { id: params.id },
      data: { reviewed: true, reviewedById: resolvedById, reviewedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
