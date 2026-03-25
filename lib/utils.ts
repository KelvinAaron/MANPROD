export const SKILL_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Mechanics / Auto Repair',
  'Tutoring / Education',
  'Cleaning / Housekeeping',
  'Tailoring / Fashion',
  'Catering / Cooking',
  'Hairdressing / Barbing',
  'Photography',
  'Phone / Electronics Repair',
  'Welding / Fabrication',
  'Landscaping / Gardening',
  'Moving / Logistics',
  'Security',
  'Event Planning',
  'Graphic Design',
] as const

export type SkillCategory = (typeof SKILL_CATEGORIES)[number]

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getVerificationStatusColor(status: string) {
  switch (status) {
    case 'VERIFIED':
      return 'text-green-600 bg-green-50'
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-50'
    case 'REJECTED':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function getBookingStatusColor(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'text-blue-600 bg-blue-50'
    case 'COMPLETED':
      return 'text-green-600 bg-green-50'
    case 'CANCELLED':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-yellow-600 bg-yellow-50'
  }
}
