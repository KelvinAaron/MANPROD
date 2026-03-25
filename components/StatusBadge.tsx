interface StatusBadgeProps {
  status: string
  type?: 'verification' | 'booking'
}

const verificationColors: Record<string, string> = {
  VERIFIED: 'text-green-700 bg-green-50 border-green-200',
  PENDING: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  REJECTED: 'text-red-700 bg-red-50 border-red-200',
}

const bookingColors: Record<string, string> = {
  PENDING: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  CONFIRMED: 'text-blue-700 bg-blue-50 border-blue-200',
  COMPLETED: 'text-green-700 bg-green-50 border-green-200',
  CANCELLED: 'text-red-700 bg-red-50 border-red-200',
}

export default function StatusBadge({ status, type = 'verification' }: StatusBadgeProps) {
  const colors = type === 'verification' ? verificationColors : bookingColors
  const colorClass = colors[status] ?? 'text-gray-700 bg-gray-50 border-gray-200'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}
