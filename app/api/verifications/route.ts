import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET — provider: own docs + rejectionReason; admin: grouped applications (one per provider)
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

    // Group documents by provider — one application card per provider
    const appMap = new Map<number, any>()
    for (const doc of docs) {
      const pid = doc.providerId
      if (!appMap.has(pid)) {
        appMap.set(pid, {
          providerId: pid,
          provider: doc.provider,
          submittedAt: doc.uploadDate,
          documents: [],
        })
      }
      appMap.get(pid).documents.push({
        id: doc.id,
        docType: doc.docType,
        filePath: doc.filePath,
        uploadDate: doc.uploadDate,
      })
    }

    return NextResponse.json(Array.from(appMap.values()))
  }

  if (role === 'PROVIDER') {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } })
    if (!provider) return NextResponse.json({ documents: [], rejectionReason: null })
    const docs = await prisma.verificationDocument.findMany({
      where: { providerId: provider.id },
      orderBy: { uploadDate: 'desc' },
    })
    return NextResponse.json({ documents: docs, rejectionReason: provider.rejectionReason })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — provider uploads one document (called per-doc after DELETE clears old pending)
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

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  const doc = await prisma.verificationDocument.create({
    data: {
      providerId: provider.id,
      docType,
      filePath: dataUrl,
      status: 'PENDING',
    },
  })

  return NextResponse.json(doc, { status: 201 })
}

// DELETE — provider clears their pending docs before submitting a fresh application
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = Number((session.user as any).id)
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } })
  if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.verificationDocument.deleteMany({
    where: { providerId: provider.id, status: 'PENDING' },
  })

  return NextResponse.json({ success: true })
}
