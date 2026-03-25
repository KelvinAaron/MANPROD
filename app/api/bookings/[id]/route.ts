import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH — update booking status (provider confirms/completes/cancels)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await req.json()
  const validStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELLED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const userId = Number((session.user as any).id)
  const role = (session.user as any).role
  const booking = await prisma.booking.findUnique({
    where: { id: Number(params.id) },
    include: { listing: true, seeker: true },
  })

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Provider can confirm/complete; seeker can cancel
  if (role === 'PROVIDER') {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } })
    if (!provider || booking.listing.providerId !== provider.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (role === 'SEEKER') {
    const seeker = await prisma.serviceSeeker.findUnique({ where: { userId } })
    if (!seeker || booking.seekerId !== seeker.id || status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.booking.update({
    where: { id: Number(params.id) },
    data: { status },
  })
  return NextResponse.json(updated)
}
