import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number((session.user as any).id)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      provider: {
        include: {
          documents: { orderBy: { uploadDate: 'desc' } },
          listings: { orderBy: { createdAt: 'desc' } },
        },
      },
      seeker: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { passwordHash: _, ...safeUser } = user
  return NextResponse.json(safeUser)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number((session.user as any).id)
  const { name, phone, bio, skillSet } = await req.json()

  await prisma.user.update({
    where: { id: userId },
    data: { name: name || undefined, phone: phone || undefined },
  })

  if ((session.user as any).role === 'PROVIDER' && (bio !== undefined || skillSet)) {
    await prisma.serviceProvider.update({
      where: { userId },
      data: {
        bio: bio || undefined,
        skillSet: skillSet || undefined,
      },
    })
  }

  return NextResponse.json({ success: true })
}
