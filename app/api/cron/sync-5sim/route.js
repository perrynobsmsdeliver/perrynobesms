import { prisma } from '@/lib/prisma'

export async function GET() {
  // 1. Get all orders that are still PENDING on your site
  const pendingOrders = await prisma.order.findMany({
    where: { status: { in: ['PENDING', 'WAITING_SMS'] } }
  })

  for (const order of pendingOrders) {
    // 2. Check real status from 5sim
    const res = await fetch(`https://5sim.net/v1/user/check/${order.fiveSimId}`, {
      headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
    })
    const data = await res.json() // status: CANCELED, TIMEOUT, etc

    // 3. Check if your 10 mins has expired
    const tenMinutesPassed = Date.now() - new Date(order.createdAt).getTime() > 10 * 60 * 1000

    // CASE A: 5sim says CANCELED / TIMEOUT -> refund user
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

    // CASE B: Your 10 mins expired but 5sim still active -> Cancel it on 5sim + refund user
    if (tenMinutesPassed && data.status === 'PENDING') {
      // tell 5sim to cancel
      await fetch(`https://5sim.net/v1/user/cancel/${order.fiveSimId}`, {
        headers: { Authorization: `Bearer ${process.env.FIVESIM_API_KEY}` }
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

  return Response.json({ ok: true })
}
