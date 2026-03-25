import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST — submit a review after a completed booking
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SEEKER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookingId, rating, comment } = await req.json()
  if (!bookingId || !rating) {
    return NextResponse.json({ error: 'bookingId and rating are required' }, { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  const userId = Number((session.user as any).id)
  const seeker = await prisma.serviceSeeker.findUnique({ where: { userId } })
  if (!seeker) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
    include: { review: true },
  })

  if (!booking || booking.seekerId !== seeker.id) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (booking.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 })
  }
  if (booking.review) {
    return NextResponse.json({ error: 'You already reviewed this booking' }, { status: 409 })
  }

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      rating: Number(rating),
      comment: comment || null,
    },
  })

  // Recalculate provider average rating
  const listing = await prisma.serviceListing.findUnique({
    where: { id: booking.listingId },
    include: {
      provider: {
        include: {
          listings: {
            include: {
              bookings: { include: { review: true } },
            },
          },
        },
      },
    },
  })

  if (listing?.provider) {
    const allReviews = listing.provider.listings.flatMap((l) =>
      l.bookings.flatMap((b) => (b.review ? [b.review.rating] : []))
    )
    const avg = allReviews.length > 0
      ? allReviews.reduce((a, b) => a + b, 0) / allReviews.length
      : 0

    await prisma.serviceProvider.update({
      where: { id: listing.provider.id },
      data: { averageRating: parseFloat(avg.toFixed(2)) },
    })
  }

  return NextResponse.json(review, { status: 201 })
}
