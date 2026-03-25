'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { SKILL_CATEGORIES, formatCurrency } from '@/lib/utils'

interface Listing {
  id: number
  title: string
  description: string
  category: string
  price: number
  location: string
  isActive: boolean
}

const emptyForm = {
  title: '',
  description: '',
  category: '',
  price: '',
  location: '',
}

export default function ProviderListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchListings() {
    const res = await fetch('/api/profile')
    const data = await res.json()
    setListings(data.provider?.listings ?? [])
  }

  useEffect(() => { fetchListings() }, [])

  function openEdit(l: Listing) {
    setForm({
      title: l.title,
      description: l.description,
      category: l.category,
      price: String(l.price),
      location: l.location,
    })
    setEditingId(l.id)
    setShowForm(true)
  }

  function closeForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/listings/${editingId}` : '/api/listings'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Something went wrong')
        return
      }
      toast.success(editingId ? 'Listing updated!' : 'Listing created!')
      closeForm()
      fetchListings()
    } finally {
      setLoading(false)
    }
  }

  async function deleteListing(id: number) {
    if (!confirm('Delete this listing?')) return
    const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Listing deleted')
      fetchListings()
    } else {
      toast.error('Failed to delete')
    }
  }

  async function toggleActive(l: Listing) {
    await fetch(`/api/listings/${l.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !l.isActive }),
    })
    fetchListings()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Service Listings</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage the services you offer</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> New Listing
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">{editingId ? 'Edit Listing' : 'New Listing'}</h2>
              <button onClick={closeForm}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Professional Plumbing Repairs"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Select category…</option>
                  {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe what you offer…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                  <input
                    required type="number" min="0" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="5000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    required value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Lekki, Lagos"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listings grid */}
      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 mb-4">You haven&apos;t created any listings yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-700"
          >
            Create your first listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{l.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {l.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-xs text-primary-600 font-medium mt-0.5">{l.category}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{l.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div>
                  <p className="text-lg font-bold text-primary-700">{formatCurrency(l.price)}</p>
                  <p className="text-xs text-gray-400">{l.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(l)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    {l.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-500">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => deleteListing(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
