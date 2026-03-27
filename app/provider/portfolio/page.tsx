'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Download, Loader2, Star, CheckCircle2, BadgeCheck } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PortfolioPage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/bookings').then((r) => r.json()),
    ]).then(([profileData, bookingsData]) => {
      setProfile(profileData)
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
      setLoading(false)
    })
  }, [])

  const provider = profile?.provider
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED')
  const activeListings = provider?.listings?.filter((l: any) => l.isActive) ?? []

  // Currency formatter for PDF (avoids ₦ symbol which jsPDF can't render)
  function pdfAmount(amount: number): string {
    return 'NGN ' + new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0 }).format(amount)
  }

  async function generatePDF() {
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = 210
      const margin = 20
      const contentW = pageW - margin * 2
      let y = 0

      // ── Helper: draw filled/empty star dots ──────────────────────────
      const drawStars = (x: number, yPos: number, rating: number) => {
        const r = 1.4
        const gap = 4
        for (let i = 0; i < 5; i++) {
          if (i < rating) {
            doc.setFillColor(234, 179, 8) // yellow
          } else {
            doc.setFillColor(209, 213, 219) // gray
          }
          doc.circle(x + i * gap, yPos, r, 'F')
        }
      }

      // ── Helper: draw verified badge (green circle + white checkmark) ──
      const drawVerifiedBadge = (x: number, yPos: number) => {
        doc.setFillColor(22, 163, 74)
        doc.circle(x, yPos, 3.2, 'F')
        doc.setDrawColor(255, 255, 255)
        doc.setLineWidth(0.7)
        doc.line(x - 1.5, yPos + 0.2, x - 0.3, yPos + 1.4)
        doc.line(x - 0.3, yPos + 1.4, x + 1.8, yPos - 1.2)
      }

      // ── Helper: section label (small caps style) ──────────────────────
      const sectionLabel = (text: string, yPos: number) => {
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(107, 114, 128)
        doc.text(text.toUpperCase(), margin, yPos)
      }

      // ── Helper: horizontal divider ────────────────────────────────────
      const divider = (yPos: number) => {
        doc.setDrawColor(229, 231, 235)
        doc.setLineWidth(0.3)
        doc.line(margin, yPos, pageW - margin, yPos)
      }

      // ════════════════════════════════════════════════════════
      // GREEN HEADER
      // ════════════════════════════════════════════════════════
      doc.setFillColor(22, 163, 74)
      doc.rect(0, 0, pageW, 38, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('MANPROD', margin, 16)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text("Nigeria's Local Skills Marketplace  \xB7  Professional Skills Portfolio", margin, 24)

      doc.setFontSize(8)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageW - margin, 24, { align: 'right' })

      y = 50

      // ════════════════════════════════════════════════════════
      // NAME + VERIFIED BADGE
      // ════════════════════════════════════════════════════════
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      const providerName = profile?.name ?? ''
      doc.text(providerName, margin, y)

      if (provider?.isVerified) {
        const nameWidth = doc.getTextWidth(providerName)
        drawVerifiedBadge(margin + nameWidth + 6, y - 1)
      }
      y += 8

      // SKILL
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(22, 163, 74)
      doc.text(provider?.skillSet ?? '', margin, y)
      y += 6

      // EMAIL / PHONE
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      const contactParts = [profile?.email]
      if (profile?.phone) contactParts.push(profile.phone)
      doc.text(contactParts.join('  \xB7  '), margin, y)
      y += 6

      divider(y)
      y += 8

      // ════════════════════════════════════════════════════════
      // ABOUT
      // ════════════════════════════════════════════════════════
      if (provider?.bio) {
        sectionLabel('About', y)
        y += 6

        doc.setFontSize(9.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(55, 65, 81)
        const bioLines = doc.splitTextToSize(provider.bio, contentW)
        doc.text(bioLines, margin, y)
        y += bioLines.length * 5 + 4

        divider(y)
        y += 8
      }

      // ════════════════════════════════════════════════════════
      // PERFORMANCE SUMMARY — 4 boxes in a row
      // ════════════════════════════════════════════════════════
      sectionLabel('Performance Summary', y)
      y += 7

      const stats = [
        { value: String(completedBookings.length), label: 'Jobs Done' },
        {
          value: provider?.averageRating > 0 ? `${provider.averageRating.toFixed(1)} / 5` : 'N/A',
          label: 'Avg Rating',
        },
      ]

      const boxW = (contentW - 2) / 2
      const boxH = 16
      stats.forEach((s, i) => {
        const bx = margin + i * (boxW + 2)
        const by = y

        doc.setFillColor(249, 250, 251)
        doc.roundedRect(bx, by, boxW, boxH, 2, 2, 'F')

        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(22, 163, 74)
        doc.text(s.value, bx + boxW / 2, by + 7, { align: 'center' })

        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(107, 114, 128)
        doc.text(s.label, bx + boxW / 2, by + 13, { align: 'center' })
      })

      // Member since row below boxes
      y += boxH + 4
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text(`Member since ${formatDate(profile?.registrationDate)}`, margin, y)
      y += 6

      divider(y)
      y += 8

      // ════════════════════════════════════════════════════════
      // SERVICES OFFERED
      // ════════════════════════════════════════════════════════
      if (activeListings.length > 0) {
        sectionLabel('Services Offered', y)
        y += 7

        for (const listing of activeListings.slice(0, 6)) {
          if (y > 255) { doc.addPage(); y = 20 }

          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(17, 24, 39)
          doc.text(listing.title, margin, y)

          doc.setFont('helvetica', 'normal')
          doc.setTextColor(107, 114, 128)
          doc.setFontSize(8.5)
          doc.text(`${listing.location}  \xB7  ${pdfAmount(listing.price)}`, pageW - margin, y, { align: 'right' })

          y += 5

          // subtle underline between rows
          doc.setDrawColor(243, 244, 246)
          doc.setLineWidth(0.2)
          doc.line(margin, y, pageW - margin, y)
          y += 4
        }

        y += 2
        divider(y)
        y += 8
      }

      // ════════════════════════════════════════════════════════
      // RECENT WORK
      // ════════════════════════════════════════════════════════
      if (completedBookings.length > 0) {
        sectionLabel('Recent Work', y)
        y += 7

        for (const booking of completedBookings.slice(0, 15)) {
          if (y > 258) { doc.addPage(); y = 20 }

          const itemStartY = y

          // Green left accent bar
          doc.setFillColor(22, 163, 74)
          const barHeight = booking.review?.comment ? 14 : 9
          doc.rect(margin, itemStartY - 1, 2, barHeight, 'F')

          // Job title
          doc.setFontSize(9.5)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(17, 24, 39)
          doc.text(booking.listing.title, margin + 5, y)

          // Date right-aligned
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(107, 114, 128)
          doc.setFontSize(8.5)
          doc.text(formatDate(booking.bookingDate), pageW - margin, y, { align: 'right' })
          y += 5

          // Stars + comment
          if (booking.review) {
            drawStars(margin + 5, y, booking.review.rating)

            if (booking.review.comment) {
              doc.setFontSize(8.5)
              doc.setFont('helvetica', 'italic')
              doc.setTextColor(107, 114, 128)
              const commentLines = doc.splitTextToSize(`"${booking.review.comment}"`, contentW - 30)
              doc.text(commentLines, margin + 25, y)
              y += commentLines.length * 4
            } else {
              y += 3
            }
          }

          y += 7
        }
      }

      // ════════════════════════════════════════════════════════
      // FOOTER on every page
      // ════════════════════════════════════════════════════════
      const totalPages = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(156, 163, 175)
        doc.text(
          "Generated by MANPROD \xB7 Nigeria's Local Skills Marketplace | manprod.vercel.app",
          pageW / 2,
          290,
          { align: 'center' }
        )
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, 290, { align: 'right' })
      }

      const safeName = (profile?.name ?? 'portfolio').replace(/\s+/g, '-').toLowerCase()
      doc.save(`${safeName}-manprod-portfolio.pdf`)
      toast.success('Portfolio downloaded!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Download a professional PDF portfolio of your work on MANPROD — use it as proof of experience for real job applications.
          </p>
        </div>
        <button
          onClick={generatePDF}
          disabled={generating}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {generating ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      {/* Preview card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Green header preview */}
        <div className="bg-primary-600 px-6 py-5 text-white">
          <p className="text-xl font-bold">MANPROD</p>
          <p className="text-primary-200 text-xs mt-0.5">Nigeria's Local Skills Marketplace · Professional Skills Portfolio</p>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Identity */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{profile?.name}</h2>
              {provider?.isVerified && <BadgeCheck size={18} className="text-primary-600" />}
            </div>
            <p className="text-primary-600 font-semibold text-sm">{provider?.skillSet}</p>
            <p className="text-xs text-gray-400 mt-0.5">{profile?.email}{profile?.phone ? ` · ${profile.phone}` : ''}</p>
          </div>

          {/* Bio */}
          {provider?.bio && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About</p>
              <p className="text-sm text-gray-700">{provider.bio}</p>
            </div>
          )}

          {/* Stats grid */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Performance Summary</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <CheckCircle2 size={15} className="text-green-500" />, value: completedBookings.length, label: 'Jobs Done' },
                { icon: <Star size={15} className="text-yellow-400" />, value: provider?.averageRating > 0 ? provider.averageRating.toFixed(1) : '—', label: 'Avg Rating' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-[11px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Services preview */}
          {activeListings.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services Offered</p>
              <div className="flex flex-col gap-2">
                {activeListings.slice(0, 4).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-800 font-medium">{l.title}</span>
                    <span className="text-gray-400 text-xs">{l.location} · {formatCurrency(l.price)}</span>
                  </div>
                ))}
                {activeListings.length > 4 && (
                  <p className="text-xs text-gray-400">+{activeListings.length - 4} more in PDF</p>
                )}
              </div>
            </div>
          )}

          {/* Work history preview */}
          {completedBookings.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Work</p>
              <div className="flex flex-col gap-3">
                {completedBookings.slice(0, 4).map((b: any) => (
                  <div key={b.id} className="border-l-2 border-primary-200 pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{b.listing.title}</p>
                      <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(b.bookingDate)}</p>
                    </div>
                    {b.review && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-yellow-400 text-xs">{'★'.repeat(b.review.rating)}{'☆'.repeat(5 - b.review.rating)}</span>
                        {b.review.comment && (
                          <span className="text-xs text-gray-500 italic truncate">"{b.review.comment}"</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {completedBookings.length > 4 && (
                  <p className="text-xs text-gray-400">+{completedBookings.length - 4} more jobs included in PDF</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-gray-400">
              Complete your first job to populate your work history.
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        The PDF includes your full work history, all completed jobs, client reviews, and a performance summary — formatted as a professional document.
      </p>
    </div>
  )
}
