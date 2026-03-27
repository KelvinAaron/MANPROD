import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH — update booking status (provider confirms/completes/cancels, seeker cancels)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status, reason } = body
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
    include: {
      listing: { select: { title: true } },
      seeker: { select: { userId: true } },
    },
  })

  if (role === 'PROVIDER') {
    const providerUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })
    const providerName = providerUser?.name ?? 'Your provider'

    if (status === 'CONFIRMED') {
      await prisma.notification.create({
        data: {
          userId: updated.seeker.userId,
          title: 'Booking Accepted',
          message: `${providerName} has accepted your booking for "${updated.listing.title}". They will be in touch soon!`,
        },
      })
    }

    if (status === 'CANCELLED') {
      await prisma.notification.create({
        data: {
          userId: updated.seeker.userId,
          title: 'Booking Declined',
          message: `${providerName} has declined your booking for "${updated.listing.title}"${reason ? `. Reason: ${reason}` : ''}. You can search for another provider.`,
        },
      })
    }

    if (status === 'COMPLETED') {
      await prisma.notification.create({
        data: {
          userId: updated.seeker.userId,
          title: 'Service Completed',
          message: `${providerName} has marked "${updated.listing.title}" as completed. You can now leave a review!`,
        },
      })
    }
  }

  return NextResponse.json(updated)
}
