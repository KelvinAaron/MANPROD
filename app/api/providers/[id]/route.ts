import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const provider = await prisma.serviceProvider.findUnique({
    where: { id: Number(params.id) },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      listings: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch completed bookings with reviews through listings
  const completedBookings = await prisma.booking.findMany({
    where: {
      listing: { providerId: provider.id },
      status: 'COMPLETED',
      review: { isNot: null },
    },
    include: {
      review: true,
      seeker: { include: { user: { select: { name: true } } } },
    },
    orderBy: { bookingDate: 'desc' },
    take: 10,
  })

  const reviews = completedBookings
    .filter((b) => b.review)
    .map((b) => ({
      ...b.review!,
      seekerName: b.seeker.user.name,
    }))

  return NextResponse.json({ ...provider, reviews })
}
