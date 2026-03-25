'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

export default function AdminVerificationsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/verifications')
    const data = await res.json()
    setDocs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAction(id: number, action: 'approve' | 'reject') {
    setActioning(id)
    const res = await fetch(`/api/verifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setActioning(null)
    if (res.ok) {
      toast.success(action === 'approve' ? 'Provider verified!' : 'Document rejected')
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
          Review and approve or reject provider documents.
          Approved providers receive the verified badge.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary-600" />
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-500 font-medium">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No pending verification requests.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {docs.map((doc: any) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Provider info */}
                <div className="flex items-center gap-3 sm:w-48 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {getInitials(doc.provider.user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{doc.provider.user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{doc.provider.user.email}</p>
                    <p className="text-xs text-primary-600">{doc.provider.skillSet}</p>
                  </div>
                </div>

                {/* Document info */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText size={18} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{doc.docType}</p>
                      <p className="text-xs text-gray-400">Submitted {formatDate(doc.uploadDate)}</p>
                    </div>
                  </div>

                  {/* View doc link */}
                  <a
                    href={doc.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                  >
                    View Document <ExternalLink size={12} />
                  </a>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(doc.id, 'approve')}
                      disabled={actioning === doc.id}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl"
                    >
                      {actioning === doc.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(doc.id, 'reject')}
                      disabled={actioning === doc.id}
                      className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 text-sm font-medium px-4 py-2 rounded-xl border border-red-200"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats summary */}
      {!loading && docs.length > 0 && (
        <p className="text-sm text-gray-400 text-center">
          {docs.length} pending document{docs.length !== 1 ? 's' : ''} awaiting review
        </p>
      )}
    </div>
  )
}
