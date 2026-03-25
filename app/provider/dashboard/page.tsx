'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { BadgeCheck, Briefcase, Star, Clock, ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ProviderDashboard() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then(setProfile)
    fetch('/api/bookings').then((r) => r.json()).then(setBookings)
  }, [])

  const provider = profile?.provider
  const verificationStatus = provider?.isVerified
    ? 'VERIFIED'
    : provider?.documents?.some((d: any) => d.status === 'PENDING')
    ? 'PENDING'
    : 'UNVERIFIED'

  const stats = [
    {
      label: 'Active Listings',
      value: provider?.listings?.filter((l: any) => l.isActive).length ?? 0,
      icon: <Briefcase size={20} className="text-primary-600" />,
      href: '/provider/listings',
    },
    {
      label: 'Avg. Rating',
      value: provider?.averageRating > 0 ? provider.averageRating.toFixed(1) : '—',
      icon: <Star size={20} className="text-yellow-500" />,
    },
    {
      label: 'Total Bookings',
      value: bookings.length,
      icon: <Clock size={20} className="text-blue-500" />,
      href: '/provider/bookings',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your MANPROD profile.</p>
      </div>

      {/* Verification banner */}
      {verificationStatus !== 'VERIFIED' && (
        <div className={`rounded-2xl p-4 flex items-center justify-between ${
          verificationStatus === 'PENDING'
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div>
            <p className={`font-semibold text-sm ${verificationStatus === 'PENDING' ? 'text-yellow-800' : 'text-blue-800'}`}>
              {verificationStatus === 'PENDING'
                ? 'Verification under review'
                : 'Get verified to unlock more bookings'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {verificationStatus === 'PENDING'
                ? 'Your documents are being reviewed by our team.'
                : 'Upload your ID or trade certificate to get the verified badge.'}
            </p>
          </div>
          {verificationStatus !== 'PENDING' && (
            <Link href="/provider/verification" className="text-sm font-medium text-blue-700 hover:underline whitespace-nowrap ml-4">
              Upload docs →
            </Link>
          )}
        </div>
      )}

      {verificationStatus === 'VERIFIED' && (
        <div className="rounded-2xl p-4 bg-green-50 border border-green-200 flex items-center gap-3">
          <BadgeCheck className="text-green-600" size={24} />
          <div>
            <p className="font-semibold text-green-800 text-sm">Verified Provider</p>
            <p className="text-xs text-gray-500">Your account is verified. Clients can find and trust you.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{s.label}</span>
              {s.icon}
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            {s.href && (
              <Link href={s.href} className="text-xs text-primary-600 hover:underline mt-1 inline-flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/provider/listings"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-primary-300 transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-gray-900">Manage Listings</p>
            <p className="text-sm text-gray-500 mt-0.5">Create or edit your service offers</p>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>
        <Link
          href="/provider/verification"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-primary-300 transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-gray-900">Verification Documents</p>
            <p className="text-sm text-gray-500 mt-0.5">Upload ID or trade certificates</p>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Booking Requests</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No bookings yet. Get verified to attract clients!</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {bookings.slice(0, 5).map((b: any) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.listing.title}</p>
                  <p className="text-xs text-gray-400">
                    {b.seeker.user.name} · {formatDate(b.bookingDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} type="booking" />
                  {b.status === 'PENDING' && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/bookings/${b.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'CONFIRMED' }),
                        })
                        fetch('/api/bookings').then((r) => r.json()).then(setBookings)
                      }}
                      className="text-xs bg-primary-600 text-white px-2.5 py-1 rounded-lg hover:bg-primary-700"
                    >
                      Accept
                    </button>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/bookings/${b.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'COMPLETED' }),
                        })
                        fetch('/api/bookings').then((r) => r.json()).then(setBookings)
                      }}
                      className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {bookings.length > 5 && (
          <Link href="/provider/bookings" className="text-sm text-primary-600 hover:underline mt-3 inline-block">
            View all bookings →
          </Link>
        )}
      </div>
    </div>
  )
}
