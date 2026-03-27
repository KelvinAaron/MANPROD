import Link from 'next/link'
import { Star, BadgeCheck, MapPin, CheckCircle2 } from 'lucide-react'
import { formatCurrency, getInitials } from '@/lib/utils'

interface ProviderCardProps {
  provider: {
    id: number
    skillSet: string
    bio?: string | null
    isVerified: boolean
    averageRating: number
    completedJobsCount?: number
    user: { name: string }
    listings: Array<{
      id: number
      title: string
      price: number
      location: string
    }>
  }
}

function formatJobCount(count: number): string {
  if (count >= 1000) return '1000+'
  if (count >= 100) return '100+'
  return String(count)
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  const listing = provider.listings[0]
  const jobCount = provider.completedJobsCount ?? 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {getInitials(provider.user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 truncate">{provider.user.name}</h3>
            {provider.isVerified && (
              <BadgeCheck size={16} className="text-primary-600 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-primary-600 font-medium">{provider.skillSet}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1">
              <Star size={13} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-gray-600">
                {provider.averageRating > 0 ? provider.averageRating.toFixed(1) : 'No ratings yet'}
              </span>
            </div>
            {jobCount > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-green-500" />
                <span className="text-xs text-gray-600">{formatJobCount(jobCount)} jobs done</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {provider.bio && (
        <p className="text-sm text-gray-600 line-clamp-2">{provider.bio}</p>
      )}

      {/* Listing preview */}
      {listing && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-sm font-medium text-gray-800 truncate">{listing.title}</p>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />
              <span className="truncate">{listing.location}</span>
            </div>
            <span className="text-sm font-semibold text-primary-700">
              {formatCurrency(listing.price)}
            </span>
          </div>
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/providers/${provider.id}`}
        className="mt-auto block text-center bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        View Profile
      </Link>
    </div>
  )
}
