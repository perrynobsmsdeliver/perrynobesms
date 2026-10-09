import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const pendingOrders = await prisma.order.findMany({
      where: { status: { in: ['PENDING', 'WAITING_SMS', 'PENDING_SMS'] } }
    })

    for (const order of pendingOrders) {
      const res = await fetch(`https://5sim.net/v1/user/check/${order.fiveSimId || order.providerOrderId}`, {
        headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY || process.env.FIVE_SIM_API_KEY}` }
      })
      
      if (!res.ok) continue
      const data = await res.json()

      const tenMinutesPassed = Date.now() - new Date(order.createdAt).getTime() > 10 * 60 * 1000

      if (['CANCELED', 'TIMEOUT', 'BANNED'].includes(data.status)) {
        if (order.status !== 'CANCELED') {
          await prisma.$transaction([
            prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELED' } }),
            prisma.user.update({ 
              where: { id: order.userId }, 
              data: { balance: { increment: order.price } } 
            })
          ])
        }
      }

      if (tenMinutesPassed && data.status === 'PENDING') {
        await fetch(`https://5sim.net/v1/user/cancel/${order.fiveSimId || order.providerOrderId}`, {
          headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY || process.env.FIVE_SIM_API_KEY}` }
        })
        
        await prisma.$transaction([
          prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELED' } }),
          prisma.user.update({ 
            where: { id: order.userId }, 
            data: { balance: { increment: order.price } } 
          })
        ])
      }
    }

    return Response.json({ ok: true, checked: pendingOrders.length })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
