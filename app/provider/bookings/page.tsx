'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])

  async function load() {
    const res = await fetch('/api/bookings')
    const data = await res.json()
    setBookings(Array.isArray(data) ? data : [])
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(`Booking ${status.toLowerCase()}`)
      load()
    } else {
      toast.error('Update failed')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Manage all service requests from clients</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400">No booking requests yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{b.listing.title}</p>
                  <p className="text-sm text-gray-500">
                    {b.seeker.user.name}
                    {b.seeker.user.phone && ` · ${b.seeker.user.phone}`}
                    {b.seeker.user.email && ` · ${b.seeker.user.email}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(b.bookingDate)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={b.status} type="booking" />
                  {b.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus(b.id, 'CONFIRMED')}
                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, 'CANCELLED')}
                        className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-100"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateStatus(b.id, 'COMPLETED')}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                  )}
                  {b.review && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                      ★ {b.review.rating}/5
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
