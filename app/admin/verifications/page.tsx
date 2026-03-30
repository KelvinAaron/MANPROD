'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

interface VerificationDoc {
  id: number
  docType: string
  filePath: string
  uploadDate: string
}

interface Application {
  providerId: number
  submittedAt: string
  provider: {
    skillSet: string
    user: { name: string; email: string }
  }
  documents: VerificationDoc[]
}

export default function AdminVerificationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function openDocument(filePath: string) {
    if (filePath.startsWith('data:')) {
      const [header, base64] = filePath.split(',')
      const mimeType = header.split(':')[1].split(';')[0]
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: mimeType })
      window.open(URL.createObjectURL(blob), '_blank')
    } else {
      window.open(filePath, '_blank')
    }
  }

  async function load() {
    setLoading(true)
    const res = await fetch('/api/verifications')
    const data = await res.json()
    setApps(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleApprove(providerId: number) {
    setActioning(providerId)
    const res = await fetch(`/api/verifications/${providerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    setActioning(null)
    if (res.ok) {
      toast.success('Provider verified!')
      load()
    } else {
      toast.error('Action failed')
    }
  }

  async function handleReject(providerId: number) {
    setActioning(providerId)
    const res = await fetch(`/api/verifications/${providerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reason: rejectReason.trim() || undefined }),
    })
    setActioning(null)
    if (res.ok) {
      toast.success('Application rejected')
      setRejectingId(null)
      setRejectReason('')
      load()
    } else {
      toast.error('Action failed')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Verifications</h1>
        <p className="text-gray-500 text-sm mt-1">
          Each card is one provider application. Approve or reject the entire application at once.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary-600" />
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-500 font-medium">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No pending verification applications.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {apps.map((app) => (
            <div key={app.providerId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

              {/* Provider header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {getInitials(app.provider.user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{app.provider.user.name}</p>
                  <p className="text-xs text-gray-400">{app.provider.user.email}</p>
                  <p className="text-xs text-primary-600 font-medium">{app.provider.skillSet}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  Submitted {formatDate(app.submittedAt)}
                </p>
              </div>

              {/* Documents list */}
              <div className="flex flex-col gap-2 mb-4">
                {app.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <FileText size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{doc.docType}</p>
                      <p className="text-xs text-gray-400">Uploaded {formatDate(doc.uploadDate)}</p>
                    </div>
                    <button
                      onClick={() => openDocument(doc.filePath)}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline whitespace-nowrap"
                    >
                      View <ExternalLink size={11} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Inline rejection reason form */}
              {rejectingId === app.providerId && (
                <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection reason{' '}
                    <span className="text-gray-400 font-normal">(optional — shown to provider)</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="e.g. Document is unclear, please resubmit with a higher quality image."
                    className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleReject(app.providerId)}
                      disabled={actioning === app.providerId}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl"
                    >
                      {actioning === app.providerId
                        ? <Loader2 size={14} className="animate-spin" />
                        : <XCircle size={14} />}
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Approve / Reject buttons */}
              {rejectingId !== app.providerId && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(app.providerId)}
                    disabled={actioning === app.providerId}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl"
                  >
                    {actioning === app.providerId
                      ? <Loader2 size={14} className="animate-spin" />
                      : <CheckCircle size={14} />}
                    Approve Application
                  </button>
                  <button
                    onClick={() => setRejectingId(app.providerId)}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-xl border border-red-200"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && apps.length > 0 && (
        <p className="text-sm text-gray-400 text-center">
          {apps.length} pending application{apps.length !== 1 ? 's' : ''} awaiting review
        </p>
      )}
    </div>
  )
}
