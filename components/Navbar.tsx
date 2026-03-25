'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const role = (session?.user as any)?.role

  const dashboardHref =
    role === 'PROVIDER'
      ? '/provider/dashboard'
      : role === 'ADMIN'
      ? '/admin/verifications'
      : '/seeker/dashboard'

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
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
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
              <Link href={dashboardHref} onClick={() => setMenuOpen(false)} className="text-gray-700 text-sm font-medium py-2">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-red-600 text-sm font-medium py-2 text-left"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
