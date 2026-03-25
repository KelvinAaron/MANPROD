import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH — admin approves or rejects a document
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action } = await req.json() // action: 'approve' | 'reject'
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const doc = await prisma.verificationDocument.findUnique({
    where: { id: Number(params.id) },
  })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED'

  await prisma.verificationDocument.update({
    where: { id: doc.id },
    data: { status: newStatus },
  })

  // If approved, mark provider as verified
  if (action === 'approve') {
    await prisma.serviceProvider.update({
      where: { id: doc.providerId },
      data: { isVerified: true },
    })
  }

  // If rejected, recheck if any verified docs remain; if not, remove badge
  if (action === 'reject') {
    const verifiedDocs = await prisma.verificationDocument.count({
      where: { providerId: doc.providerId, status: 'VERIFIED' },
    })
    if (verifiedDocs === 0) {
      await prisma.serviceProvider.update({
        where: { id: doc.providerId },
        data: { isVerified: false },
      })
    }
  }

  return NextResponse.json({ success: true, status: newStatus })
}
