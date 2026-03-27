import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET — fetch notifications for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number((session.user as any).id)
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(notifications)
}

// PATCH — mark notifications as read (all, or specific ids)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number((session.user as any).id)
  const body = await req.json().catch(() => ({}))
  const ids: number[] | undefined = body.ids

  if (ids && ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { isRead: true },
    })
  } else {
    await prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ success: true })
}
