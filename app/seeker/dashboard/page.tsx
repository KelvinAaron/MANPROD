'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Search, ChevronRight, Clock } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'

export default function SeekerDashboard() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/bookings').then((r) => r.json()).then((d) => setBookings(Array.isArray(d) ? d : []))
  }, [])

  const active = bookings.filter((b) => ['PENDING', 'CONFIRMED'].includes(b.status))
  const completed = bookings.filter((b) => b.status === 'COMPLETED')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Find and manage your service requests.</p>
      </div>

      {/* Quick search CTA */}
      <Link
        href="/services"
        className="bg-primary-600 rounded-2xl p-5 flex items-center justify-between hover:bg-primary-700 transition-colors text-white"
      >
        <div>
          <p className="font-bold text-lg">Find a Service</p>
          <p className="text-primary-200 text-sm mt-0.5">Browse verified workers near you</p>
        </div>
        <Search size={32} className="text-primary-200" />
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Bookings', value: active.length, href: '/seeker/bookings' },
          { label: 'Completed Jobs', value: completed.length, href: '/seeker/bookings' },
          { label: 'Reviews Left', value: completed.filter((b) => b.review).length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            {s.href && (
              <Link href={s.href} className="text-xs text-primary-600 hover:underline mt-1 inline-flex items-center gap-1">
                View <ChevronRight size={12} />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link href="/seeker/bookings" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No bookings yet.</p>
            <Link href="/services" className="text-sm text-primary-600 hover:underline mt-1 inline-block">
              Find a service →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {bookings.slice(0, 5).map((b: any) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.listing.title}</p>
                  <p className="text-xs text-gray-400">
                    {b.listing.provider.user.name} · {formatDate(b.bookingDate)}
                  </p>
                </div>
                <StatusBadge status={b.status} type="booking" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
