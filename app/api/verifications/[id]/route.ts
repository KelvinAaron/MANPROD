import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH — admin approves or rejects an entire application (id = providerId)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, reason } = await req.json()
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const providerId = Number(params.id)
  const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED'

  // Update ALL pending documents for this provider at once
  await prisma.verificationDocument.updateMany({
    where: { providerId, status: 'PENDING' },
    data: { status: newStatus },
  })

  // Update provider isVerified flag and store rejection reason
  if (action === 'approve') {
    await prisma.serviceProvider.update({
      where: { id: providerId },
      data: { isVerified: true, rejectionReason: null },
    })
  } else {
    await prisma.serviceProvider.update({
      where: { id: providerId },
      data: { isVerified: false, rejectionReason: reason ?? null },
    })
  }

  // Notify the provider
  const provider = await prisma.serviceProvider.findUnique({
    where: { id: providerId },
    select: { userId: true },
  })

  if (provider) {
    if (action === 'approve') {
      await prisma.notification.create({
        data: {
          userId: provider.userId,
          title: 'Verification Approved',
          message:
            'Your verification application has been approved! You are now a verified provider on MANPROD.',
        },
      })
    } else {
      await prisma.notification.create({
        data: {
          userId: provider.userId,
          title: 'Verification Declined',
          message: `Your verification application was declined${reason ? `. Reason: ${reason}` : ''}. You may submit new documents to reapply.`,
        },
      })
    }
  }

  return NextResponse.json({ success: true, status: newStatus })
}
