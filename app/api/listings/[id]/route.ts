import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const listing = await prisma.serviceListing.findUnique({
    where: { id: Number(params.id) },
    include: {
      provider: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          documents: { select: { status: true }, orderBy: { uploadDate: 'desc' }, take: 1 },
        },
      },
    },
  })

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(listing)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = Number((session.user as any).id)
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } })
  if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const listing = await prisma.serviceListing.findUnique({ where: { id: Number(params.id) } })
  if (!listing || listing.providerId !== provider.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = await req.json()
  const updated = await prisma.serviceListing.update({
    where: { id: Number(params.id) },
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price ? parseFloat(data.price) : undefined,
      location: data.location,
      isActive: data.isActive,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = Number((session.user as any).id)
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } })
  if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const listing = await prisma.serviceListing.findUnique({ where: { id: Number(params.id) } })
  if (!listing || listing.providerId !== provider.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.serviceListing.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ success: true })
}
