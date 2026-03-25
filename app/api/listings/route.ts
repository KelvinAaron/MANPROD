import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/listings?category=&search=&page=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? ''
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const pageSize = 12

  const listings = await prisma.serviceListing.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      provider: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  return NextResponse.json(listings)
}

// POST /api/listings — create a new listing (providers only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, category, price, location } = await req.json()
  if (!title || !description || !category || !price || !location) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const userId = Number((session.user as any).id)
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } })
  if (!provider) {
    return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
  }

  const listing = await prisma.serviceListing.create({
    data: {
      providerId: provider.id,
      title,
      description,
      category,
      price: parseFloat(price),
      location,
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
