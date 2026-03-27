'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Upload, FileText, Loader2, BadgeCheck, Clock, XCircle, Plus, Trash2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const DOC_TYPES = [
  'National ID (NIN)',
  "Driver's License",
  'Trade Certificate',
  'Work Experience Letter',
  'Professional Licence',
  'Utility Bill',
]

interface Doc {
  id: number
  docType: string
  filePath: string
  uploadDate: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
}

interface QueuedDoc {
  docType: string
  file: File
}

export default function VerificationPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueuedDoc[]>([])
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchDocs() {
    const res = await fetch('/api/verifications')
    const data = await res.json()
    setDocs(Array.isArray(data) ? data : (data.documents ?? []))
    setRejectionReason(data.rejectionReason ?? null)
    setLoadingDocs(false)
  }

  useEffect(() => { fetchDocs() }, [])

  function addToQueue() {
    if (!file || !docType) {
      toast.error('Select a document type and file')
      return
    }
    setQueue((prev) => [...prev, { docType, file }])
    setFile(null)
    setDocType('')
    if (fileRef.current) fileRef.current.value = ''
    toast.success(`"${docType}" added to queue`)
  }

  function removeFromQueue(index: number) {
    setQueue((prev) => prev.filter((_, i) => i !== index))
  }

  async function submitAll() {
    if (queue.length === 0) {
      toast.error('Add at least one document to the queue')
      return
    }

    const hasPending = docs.some((d) => d.status === 'PENDING')
    if (hasPending) {
      const confirmed = window.confirm(
        'You already have a pending application. Submitting will replace it with these new documents. Continue?'
      )
      if (!confirmed) return
    }

    setUploading(true)

    // Clear previous pending application so new one replaces it
    await fetch('/api/verifications', { method: 'DELETE' })

    let successCount = 0
    for (const item of queue) {
      const fd = new FormData()
      fd.append('file', item.file)
      fd.append('docType', item.docType)
      const res = await fetch('/api/verifications', { method: 'POST', body: fd })
      if (res.ok) {
        successCount++
      } else {
        const d = await res.json()
        toast.error(`Failed to upload "${item.docType}": ${d.error ?? 'Unknown error'}`)
      }
    }

    setUploading(false)
    setQueue([])

    if (successCount > 0) {
      toast.success(`${successCount} document${successCount > 1 ? 's' : ''} submitted for review!`)
      fetchDocs()
    }
  }

  const statusIcon = (status: Doc['status']) => {
    if (status === 'VERIFIED') return <BadgeCheck size={16} className="text-green-600" />
    if (status === 'PENDING') return <Clock size={16} className="text-yellow-500" />
    return <XCircle size={16} className="text-red-500" />
  }

  const statusLabel = (status: Doc['status']) => {
    if (status === 'VERIFIED') return <span className="text-green-700 text-xs font-medium">Verified</span>
    if (status === 'PENDING') return <span className="text-yellow-700 text-xs font-medium">Pending Review</span>
    return <span className="text-red-700 text-xs font-medium">Rejected</span>
  }

  const pendingDocs = docs.filter((d) => d.status === 'PENDING')
  const hasPendingApplication = pendingDocs.length > 0

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Documents</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Upload government-issued ID or trade certificates to get your verified badge.
          Queue multiple documents and submit them as a single application. Reviewed within 24–48 hours.
        </p>
      </div>

      {/* Rejection reason banner */}
      {rejectionReason && !hasPendingApplication && (
        <div className="rounded-2xl p-4 bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Previous application was declined</p>
            <p className="text-xs text-red-700 mt-0.5">Reason: {rejectionReason}</p>
            <p className="text-xs text-gray-500 mt-1">You can submit a new application below.</p>
          </div>
        </div>
      )}

      {/* Pending application status */}
      {hasPendingApplication && (
        <div className="rounded-2xl p-4 bg-yellow-50 border border-yellow-200 flex items-start gap-3">
          <Clock size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Application under review</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {pendingDocs.length} document{pendingDocs.length > 1 ? 's' : ''} submitted and awaiting review.
              Submitting a new application below will replace this one.
            </p>
          </div>
        </div>
      )}

      {/* Add to queue form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Add Document to Queue</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Select type…</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File (JPG, PNG or PDF · max 5MB)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              {file ? (
                <p className="text-sm text-primary-700 font-medium">{file.name}</p>
              ) : (
                <p className="text-sm text-gray-400">Click to browse or drag &amp; drop</p>
              )}
              <input
                ref={fileRef} type="file" className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addToQueue}
            className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-primary-300 text-primary-700 font-medium py-2.5 rounded-xl hover:bg-primary-50 transition-colors text-sm"
          >
            <Plus size={16} /> Add to Queue
          </button>
        </div>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Ready to Submit ({queue.length} document{queue.length > 1 ? 's' : ''})
          </h2>
          <div className="flex flex-col gap-2 mb-4">
            {queue.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
                <FileText size={18} className="text-primary-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{item.docType}</p>
                  <p className="text-xs text-gray-500 truncate">{item.file.name}</p>
                </div>
                <button
                  onClick={() => removeFromQueue(i)}
                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                  aria-label="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={submitAll}
            disabled={uploading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {uploading && <Loader2 size={16} className="animate-spin" />}
            {uploading ? 'Uploading…' : `Submit ${queue.length} Document${queue.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Submitted documents */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Submitted Documents</h2>
        {loadingDocs ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No documents submitted yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <FileText size={20} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{doc.docType}</p>
                  <p className="text-xs text-gray-400">Uploaded {formatDate(doc.uploadDate)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusIcon(doc.status)}
                  {statusLabel(doc.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
