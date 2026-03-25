import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/providers?category=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? ''
  const search = searchParams.get('search') ?? ''

  const providers = await prisma.serviceProvider.findMany({
    where: {
      ...(category ? { skillSet: category } : {}),
      ...(search
        ? {
            OR: [
              { skillSet: { contains: search, mode: 'insensitive' } },
              { bio: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { name: true } },
      listings: {
        where: { isActive: true },
        select: { id: true, title: true, price: true, location: true },
        take: 1,
      },
    },
    orderBy: { averageRating: 'desc' },
  })

  return NextResponse.json(providers)
}
