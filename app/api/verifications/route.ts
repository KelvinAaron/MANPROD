import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// GET — provider fetches their own docs; admin fetches all pending
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number((session.user as any).id)
  const role = (session.user as any).role

  if (role === 'ADMIN') {
    const docs = await prisma.verificationDocument.findMany({
      where: { status: 'PENDING' },
      include: {
        provider: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { uploadDate: 'asc' },
    })
    return NextResponse.json(docs)
  }

  if (role === 'PROVIDER') {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } })
    if (!provider) return NextResponse.json([])
    const docs = await prisma.verificationDocument.findMany({
      where: { providerId: provider.id },
      orderBy: { uploadDate: 'desc' },
    })
    return NextResponse.json(docs)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — provider uploads a verification document
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = Number((session.user as any).id)
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } })
  if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const docType = formData.get('docType') as string | null

  if (!file || !docType) {
    return NextResponse.json({ error: 'file and docType are required' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'File must be JPG, PNG, WEBP or PDF' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  // Save file to /public/uploads/
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()
  const filename = `${provider.id}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  const doc = await prisma.verificationDocument.create({
    data: {
      providerId: provider.id,
      docType,
      filePath: `/uploads/${filename}`,
      status: 'PENDING',
    },
  })

  return NextResponse.json(doc, { status: 201 })
}
