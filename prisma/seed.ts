import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos...')

  const store = await prisma.store.upsert({
    where: { slug: 'centro' },
    update: {},
    create: { name: 'Carioca · Tienda Centro', slug: 'centro' },
  })

  const hash = await bcrypt.hash('carioca2026', 10)

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@carioca.com' },
    update: {},
    create: {
      name: 'María S.',
      email: 'supervisor@carioca.com',
      password: hash,
      role: 'SUPERVISOR',
      storeId: store.id,
    },
  })

  const vendorData = [
    { name: 'Edwin', email: 'edwin@carioca.com' },
    { name: 'Elias', email: 'elias@carioca.com' },
    { name: 'Alvaro', email: 'alvaro@carioca.com' },
    { name: 'Silvia', email: 'silvia@carioca.com' },
  ]

  const vendors = await Promise.all(
    vendorData.map((v) =>
      prisma.user.upsert({
        where: { email: v.email },
        update: {},
        create: { ...v, password: hash, role: 'VENDOR', storeId: store.id },
      }),
    ),
  )

  const [ana, luis, sara, carlos] = vendors

  // Reglas de alerta por defecto
  await prisma.alertRule.upsert({
    where: { id: 'rule-rating-critico' },
    update: {},
    create: {
      id: 'rule-rating-critico',
      storeId: store.id,
      name: 'Calificación crítica',
      type: 'THRESHOLD',
      field: 'rating',
      operator: '<=',
      value: '1',
      active: true,
    },
  })

  await prisma.alertRule.upsert({
    where: { id: 'rule-keyword-fraude' },
    update: {},
    create: {
      id: 'rule-keyword-fraude',
      storeId: store.id,
      name: 'Palabra clave: fraude',
      type: 'KEYWORD',
      field: 'comment',
      value: 'fraude',
      active: true,
    },
  })

  // Feedback de muestra
  const sampleFeedbacks = [
    { rating: 5, comment: 'Excelente atención, muy amable y rápida.', vendorId: ana.id },
    { rating: 4, comment: 'Buena experiencia, la tienda estaba ordenada.', vendorId: luis.id },
    { rating: 2, comment: 'Esperé mucho tiempo sin que nadie me atendiera.', vendorId: sara.id },
    { rating: 1, comment: 'Muy mala atención. Pésimo servicio.', vendorId: carlos.id },
    { rating: 5, comment: null, vendorId: ana.id },
    { rating: 3, comment: 'Todo normal, nada especial.', vendorId: luis.id },
    { rating: 4, comment: 'Me ayudaron a encontrar lo que buscaba rápido.', vendorId: sara.id },
    { rating: 1, comment: 'Intentaron cobrarme de más, huele a fraude.', vendorId: carlos.id },
    { rating: 5, comment: 'Increíble servicio, volvería sin duda.', vendorId: ana.id },
    { rating: 2, comment: 'El vendedor estuvo distraído todo el tiempo.', vendorId: luis.id },
  ]

  for (const fb of sampleFeedbacks) {
    const createdAt = new Date(
      Date.now() - Math.floor(Math.random() * 48 * 60 * 60 * 1000),
    )
    await prisma.feedback.create({
      data: { ...fb, storeId: store.id, createdAt },
    })
  }

  console.log('✅ Datos sembrados exitosamente')
  console.log('')
  console.log('👤 Usuarios de prueba:')
  console.log('  Supervisor: supervisor@carioca.com / carioca2026')
  console.log('  Vendedora:  ana@carioca.com / carioca2026')
  console.log('')
  console.log('🔗 URLs:')
  console.log('  Feedback cliente:  http://localhost:3000/feedback/centro')
  console.log('  Tablero:           http://localhost:3000/dashboard')
  console.log('  Historial:         http://localhost:3000/historial')
  console.log('  Alertas:           http://localhost:3000/alertas')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
