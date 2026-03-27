import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET — fetch bookings for the logged-in user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number((session.user as any).id)
  const role = (session.user as any).role

  if (role === 'SEEKER') {
    const seeker = await prisma.serviceSeeker.findUnique({ where: { userId } })
    if (!seeker) return NextResponse.json([])
    const bookings = await prisma.booking.findMany({
      where: { seekerId: seeker.id },
      include: {
        listing: {
          include: { provider: { include: { user: { select: { name: true } } } } },
        },
        review: true,
      },
      orderBy: { bookingDate: 'desc' },
    })
    return NextResponse.json(bookings)
  }

  if (role === 'PROVIDER') {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } })
    if (!provider) return NextResponse.json([])
    const bookings = await prisma.booking.findMany({
      where: { listing: { providerId: provider.id } },
      include: {
        listing: true,
        seeker: { include: { user: { select: { name: true, phone: true, email: true } } } },
        review: true,
      },
      orderBy: { bookingDate: 'desc' },
    })
    return NextResponse.json(bookings)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — book a service (seekers only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SEEKER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { listingId } = await req.json()
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

  const userId = Number((session.user as any).id)
  const seeker = await prisma.serviceSeeker.findUnique({ where: { userId } })
  if (!seeker) return NextResponse.json({ error: 'Seeker profile not found' }, { status: 404 })

  const listing = await prisma.serviceListing.findUnique({ where: { id: Number(listingId) } })
  if (!listing || !listing.isActive) {
    return NextResponse.json({ error: 'Listing not found or inactive' }, { status: 404 })
  }

  const booking = await prisma.booking.create({
    data: {
      listingId: listing.id,
      seekerId: seeker.id,
    },
  })

  // Notify the provider
  const providerRecord = await prisma.serviceProvider.findUnique({
    where: { id: listing.providerId },
    select: { userId: true },
  })
  const seekerUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })
  if (providerRecord) {
    await prisma.notification.create({
      data: {
        userId: providerRecord.userId,
        title: 'New Booking Request',
        message: `${seekerUser?.name ?? 'A client'} has booked your service: "${listing.title}".`,
      },
    })
  }

  return NextResponse.json(booking, { status: 201 })
}
