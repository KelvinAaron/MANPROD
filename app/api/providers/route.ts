import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/providers?category=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? ''
  const search = searchParams.get('search') ?? ''

  const rawProviders = await prisma.serviceProvider.findMany({
    where: {
      listings: { some: { isActive: true } },
      ...(category ? { skillSet: category } : {}),
      ...(search
        ? {
            OR: [
              { skillSet: { contains: search, mode: 'insensitive' } },
              { bio: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
              {
                listings: {
                  some: {
                    isActive: true,
                    OR: [
                      { title: { contains: search, mode: 'insensitive' } },
                      { location: { contains: search, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { name: true } },
      listings: {
        select: {
          id: true,
          title: true,
          price: true,
          location: true,
          isActive: true,
          _count: { select: { bookings: { where: { status: 'COMPLETED' } } } },
        },
      },
    },
    orderBy: { averageRating: 'desc' },
  })

  const providers = rawProviders.map((p) => {
    const completedJobsCount = p.listings.reduce(
      (sum, l) => sum + (l._count?.bookings ?? 0),
      0
    )
    const firstActiveListing = p.listings
      .filter((l) => l.isActive)
      .slice(0, 1)
      .map(({ _count, isActive, ...rest }) => rest)

    return {
      id: p.id,
      skillSet: p.skillSet,
      bio: p.bio,
      isVerified: p.isVerified,
      averageRating: p.averageRating,
      user: p.user,
      completedJobsCount,
      listings: firstActiveListing,
    }
  })

  return NextResponse.json(providers)
}
