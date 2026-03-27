'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Briefcase, FileText, Loader2, BadgeCheck, Save } from 'lucide-react'
import { SKILL_CATEGORIES, formatDate, getInitials } from '@/lib/utils'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const [form, setForm] = useState({ name: '', phone: '', bio: '', skillSet: '' })

  const role = (session?.user as any)?.role

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then((r) => r.json())
        .then((data) => {
          setProfile(data)
          setForm({
            name: data.name ?? '',
            phone: data.phone ?? '',
            bio: data.provider?.bio ?? '',
            skillSet: data.provider?.skillSet ?? '',
          })
          setLoading(false)
        })
    }
  }, [status, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Profile updated')
      setEditing(false)
      // Refresh profile data
      fetch('/api/profile').then((r) => r.json()).then(setProfile)
    } else {
      toast.error('Failed to save changes')
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  const provider = profile?.provider
  const isVerified = provider?.isVerified

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {getInitials(profile?.name ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile?.name}</h1>
              {isVerified && (
                <BadgeCheck size={20} className="text-primary-600" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{profile?.email}</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              role === 'PROVIDER' ? 'bg-primary-100 text-primary-700' :
              role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {role === 'PROVIDER' ? 'Service Provider' : role === 'ADMIN' ? 'Administrator' : 'Service Seeker'}
            </span>
            {role === 'PROVIDER' && provider?.skillSet && (
              <p className="text-sm text-primary-600 font-medium mt-1">{provider.skillSet}</p>
            )}
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Account Details</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-primary-600 hover:underline font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-9 pr-4 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+234 801 234 5678"
                    className="w-full pl-9 pr-4 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {role === 'PROVIDER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skill / Trade</label>
                    <div className="relative">
                      <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={form.skillSet}
                        onChange={(e) => setForm({ ...form, skillSet: e.target.value })}
                        className="w-full pl-9 pr-4 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="">Select a skill…</option>
                        {SKILL_CATEGORIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={3}
                      placeholder="Tell clients about yourself and your experience…"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setForm({
                      name: profile?.name ?? '',
                      phone: profile?.phone ?? '',
                      bio: profile?.provider?.bio ?? '',
                      skillSet: profile?.provider?.skillSet ?? '',
                    })
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Full Name</p>
                  <p className="text-sm text-gray-800 font-medium">{profile?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-800 font-medium">{profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-gray-800 font-medium">{profile?.phone || '—'}</p>
                </div>
              </div>
              {role === 'PROVIDER' && (
                <>
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Skill / Trade</p>
                      <p className="text-sm text-gray-800 font-medium">{provider?.skillSet || '—'}</p>
                    </div>
                  </div>
                  {provider?.bio && (
                    <div className="flex items-start gap-3">
                      <FileText size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Bio</p>
                        <p className="text-sm text-gray-800">{provider.bio}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Member Since</p>
                  <p className="text-sm text-gray-800 font-medium">{formatDate(profile?.registrationDate)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Provider stats */}
        {role === 'PROVIDER' && provider && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Provider Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {provider.averageRating > 0 ? provider.averageRating.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Avg. Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {provider.listings?.filter((l: any) => l.isActive).length ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Active Listings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {provider.documents?.filter((d: any) => d.status === 'VERIFIED').length ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Verified Docs</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
