'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Bell } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface Notification {
  id: number
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const role = (session?.user as any)?.role

  const dashboardHref =
    role === 'PROVIDER'
      ? '/provider/dashboard'
      : role === 'ADMIN'
      ? '/admin/verifications'
      : '/seeker/dashboard'

  const unreadCount = notifications.filter((n) => !n.isRead).length

  async function fetchNotifications() {
    if (!session) return
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch {}
  }

  useEffect(() => {
    if (!session) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [session])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  function formatTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary-600">MANPROD</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/services" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">
            Browse Services
          </Link>
          {!session ? (
            <>
              <Link href="/login" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">
                Log In
              </Link>
              <Link href="/register" className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Get Started
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false) }}
                  className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-50"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-sm text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-primary-50' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false) }}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                    {getInitials(session.user?.name ?? 'U')}
                  </span>
                  <span className="hidden lg:block">{session.user?.name}</span>
                  <ChevronDown size={16} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      href={dashboardHref}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={15} /> Profile
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
          <Link href="/services" onClick={() => setMenuOpen(false)} className="text-gray-700 text-sm font-medium py-2">
            Browse Services
          </Link>
          {!session ? (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-gray-700 text-sm font-medium py-2">
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg text-center"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link href={dashboardHref} onClick={() => setMenuOpen(false)} className="text-gray-700 text-sm font-medium py-2 flex items-center gap-2">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-gray-700 text-sm font-medium py-2 flex items-center gap-2">
                <User size={15} /> Profile
              </Link>
              <Link href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); setNotifOpen(true) }} className="text-gray-700 text-sm font-medium py-2 flex items-center gap-2">
                <Bell size={15} /> Notifications {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-red-600 text-sm font-medium py-2 text-left flex items-center gap-2"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
