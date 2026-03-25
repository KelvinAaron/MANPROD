'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function RedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    const role = (session?.user as any)?.role
    if (role === 'PROVIDER') router.replace('/provider/dashboard')
    else if (role === 'ADMIN') router.replace('/admin/verifications')
    else if (role === 'SEEKER') router.replace('/seeker/dashboard')
    else router.replace('/login')
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  )
}
