'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import StatusBadge from '@/components/StatusBadge'
import StarRating from '@/components/StarRating'
import { formatDate, formatCurrency } from '@/lib/utils'
import { X, Loader2 } from 'lucide-react'

export default function SeekerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [reviewModal, setReviewModal] = useState<{ bookingId: number; title: string } | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    const res = await fetch('/api/bookings')
    const data = await res.json()
    setBookings(Array.isArray(data) ? data : [])
  }

  useEffect(() => { load() }, [])

  async function cancelBooking(id: number) {
    if (!confirm('Cancel this booking?')) return
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    if (res.ok) { toast.success('Booking cancelled'); load() }
    else toast.error('Cancel failed')
  }

  async function submitReview() {
    if (!rating || !reviewModal) { toast.error('Please select a rating'); return }
    setSubmitting(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: reviewModal.bookingId, rating, comment }),
    })
    setSubmitting(false)
    if (res.ok) {
      toast.success('Review submitted!')
      setReviewModal(null)
      setRating(0)
      setComment('')
      load()
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Failed to submit review')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your service bookings</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400">No bookings yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{b.listing.title}</p>
                  <p className="text-sm text-gray-500">Provider: {b.listing.provider.user.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(b.bookingDate)} · {formatCurrency(b.listing.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={b.status} type="booking" />
                  {b.status === 'PENDING' && (
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  )}
                  {b.status === 'COMPLETED' && !b.review && (
                    <button
                      onClick={() => setReviewModal({ bookingId: b.id, title: b.listing.title })}
                      className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600"
                    >
                      Leave Review
                    </button>
                  )}
                  {b.review && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-lg">
                      ★ {b.review.rating}/5 reviewed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Leave a Review</h2>
              <button onClick={() => setReviewModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{reviewModal.title}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <StarRating value={rating} onChange={setRating} size={28} />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Tell others about your experience…"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <button
              onClick={submitReview} disabled={submitting}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Submit Review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
