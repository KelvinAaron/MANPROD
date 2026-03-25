'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import StarRating from '@/components/StarRating'
import { BadgeCheck, MapPin, Phone, Mail, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const router = useRouter()
  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<number | null>(null) // listingId being booked
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/providers/${id}`)
      .then((r) => r.json())
      .then((d) => { setProvider(d); setLoading(false) })
  }, [id])

  async function handleBook(listingId: number) {
    if (!session) { router.push('/login'); return }
    const role = (session.user as any).role
    if (role !== 'SEEKER') { toast.error('Only service seekers can book'); return }

    setBooking(listingId)
    setBookingLoading(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    })
    setBookingLoading(false)
    setBooking(null)

    if (res.ok) {
      toast.success('Booking request sent!')
      router.push('/seeker/bookings')
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Booking failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  if (!provider || provider.error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Provider not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {getInitials(provider.user.name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{provider.user.name}</h1>
              {provider.isVerified && (
                <BadgeCheck size={22} className="text-primary-600" />
              )}
              {!provider.isVerified && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Unverified</span>
              )}
            </div>
            <p className="text-primary-600 font-semibold mt-0.5">{provider.skillSet}</p>
            {provider.averageRating > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={Math.round(provider.averageRating)} readonly size={16} />
                <span className="text-sm text-gray-600">
                  {provider.averageRating.toFixed(1)} · {provider.reviews.length} review{provider.reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {provider.bio && <p className="text-gray-500 text-sm mt-2">{provider.bio}</p>}
            <div className="flex flex-wrap gap-3 mt-3">
              {provider.user.email && (
                <a href={`mailto:${provider.user.email}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
                  <Mail size={14} /> {provider.user.email}
                </a>
              )}
              {provider.user.phone && (
                <a href={`tel:${provider.user.phone}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
                  <Phone size={14} /> {provider.user.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Listings */}
        {provider.listings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Services Offered</h2>
            <div className="flex flex-col gap-3">
              {provider.listings.map((l: any) => (
                <div key={l.id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{l.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{l.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin size={12} />{l.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-lg font-bold text-primary-700">{formatCurrency(l.price)}</span>
                    <button
                      onClick={() => handleBook(l.id)}
                      disabled={bookingLoading && booking === l.id}
                      className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      {bookingLoading && booking === l.id && <Loader2 size={14} className="animate-spin" />}
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {provider.reviews.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Client Reviews</h2>
            <div className="flex flex-col gap-4">
              {provider.reviews.map((r: any) => (
                <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">{r.seekerName}</p>
                    <span className="text-xs text-gray-400">{formatDate(r.datePosted)}</span>
                  </div>
                  <StarRating value={r.rating} readonly size={14} />
                  {r.comment && <p className="text-sm text-gray-500 mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
