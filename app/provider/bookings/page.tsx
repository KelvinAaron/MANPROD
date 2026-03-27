'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Loader2, X } from 'lucide-react'

interface DeclineState {
  bookingId: number
  title: string
}

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [declining, setDeclining] = useState<DeclineState | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [actioning, setActioning] = useState<number | null>(null)

  async function load() {
    const res = await fetch('/api/bookings')
    const data = await res.json()
    setBookings(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: number, status: string, reason?: string) {
    setActioning(id)
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    })
    setActioning(null)
    if (res.ok) {
      toast.success(status === 'CONFIRMED' ? 'Booking accepted' : status === 'CANCELLED' ? 'Booking declined' : 'Job marked complete')
      setDeclining(null)
      setDeclineReason('')
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

      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                  <div className="h-8 w-20 bg-gray-100 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
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
                  {b.status === 'PENDING' && declining?.bookingId !== b.id && (
                    <>
                      <button
                        onClick={() => updateStatus(b.id, 'CONFIRMED')}
                        disabled={actioning === b.id}
                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 disabled:opacity-60 flex items-center gap-1"
                      >
                        {actioning === b.id && <Loader2 size={11} className="animate-spin" />}
                        Accept
                      </button>
                      <button
                        onClick={() => { setDeclining({ bookingId: b.id, title: b.listing.title }); setDeclineReason('') }}
                        className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-100"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateStatus(b.id, 'COMPLETED')}
                      disabled={actioning === b.id}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-1"
                    >
                      {actioning === b.id && <Loader2 size={11} className="animate-spin" />}
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

              {/* Inline decline form */}
              {declining?.bookingId === b.id && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-red-800">Decline "{b.listing.title}"</p>
                    <button onClick={() => setDeclining(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={2}
                    placeholder="Reason for declining (optional — will be sent to the client)"
                    className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => updateStatus(b.id, 'CANCELLED', declineReason.trim() || undefined)}
                      disabled={actioning === b.id}
                      className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-1"
                    >
                      {actioning === b.id && <Loader2 size={11} className="animate-spin" />}
                      Confirm Decline
                    </button>
                    <button
                      onClick={() => setDeclining(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
