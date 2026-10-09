import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'WAITING_SMS'] }
      },
      orderBy: { createdAt: 'asc' }
    })

    let refunded = 0

    for (const order of pendingOrders) {
      const fiveSimId = (order as any).fiveSimId || (order as any).providerOrderId
      if (!fiveSimId) continue

      const tenMinutesPassed = Date.now() - new Date(order.createdAt).getTime() > 10 * 60 * 1000
      if (!tenMinutesPassed) continue

      // Only refund if still pending after 10 mins
      if (order.status !== 'CANCELED') {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: 'CANCELED' }
          }),
          prisma.user.update({
            where: { id: order.userId },
            data: { balance: { increment: order.price } }
          })
        ])
        refunded++

        // Try to cancel on 5sim too
        try {
          await fetch(`https://5sim.net/v1/user/cancel/${fiveSimId}`, {
            headers: {
              Authorization: `Bearer ${process.env.FIVESIM_API_KEY}`,
            },
          })
        } catch {}
      }
    }

    return Response.json({ ok: true, checked: pendingOrders.length, refunded })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
