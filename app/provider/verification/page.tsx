'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Upload, FileText, Loader2, BadgeCheck, Clock, XCircle } from 'lucide-react'
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

export default function VerificationPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchDocs() {
    const res = await fetch('/api/verifications')
    const data = await res.json()
    setDocs(Array.isArray(data) ? data : [])
  }

  useEffect(() => { fetchDocs() }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !docType) {
      toast.error('Select a document type and file')
      return
    }

    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('docType', docType)

    const res = await fetch('/api/verifications', { method: 'POST', body: fd })
    setUploading(false)

    if (!res.ok) {
      const d = await res.json()
      toast.error(d.error ?? 'Upload failed')
      return
    }

    toast.success('Document submitted for review!')
    setFile(null)
    setDocType('')
    if (fileRef.current) fileRef.current.value = ''
    fetchDocs()
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

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Documents</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Upload government-issued ID or trade certificates to get your verified badge.
          Documents are reviewed by our admin team within 24–48 hours.
        </p>
      </div>

      {/* Upload form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Upload a Document</h2>
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              required value={docType}
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
            type="submit" disabled={uploading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {uploading && <Loader2 size={16} className="animate-spin" />}
            {uploading ? 'Uploading…' : 'Submit Document'}
          </button>
        </form>
      </div>

      {/* Submitted docs */}
      {docs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Submitted Documents</h2>
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
        </div>
      )}
    </div>
  )
}
