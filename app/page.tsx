import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { BadgeCheck, Search, Star, Briefcase, ArrowRight, Shield, Users, TrendingUp } from 'lucide-react'
import { SKILL_CATEGORIES } from '@/lib/utils'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Find Trusted Local<br className="hidden sm:block" /> Skilled Workers
          </h1>
          <p className="mt-5 text-primary-100 text-lg md:text-xl max-w-2xl mx-auto">
            Connect with verified plumbers, electricians, tutors and more in your community.
            Every worker is document-verified so you can hire with confidence.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors"
            >
              <Search size={18} /> Find a Service
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-primary-500 border border-primary-400 text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-400 transition-colors"
            >
              Offer Your Skills <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900">How MANPROD Works</h2>
          <p className="text-gray-500 text-center mt-2 mb-12">Simple steps to get the help you need</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search size={28} className="text-primary-600" />,
                step: '1',
                title: 'Search Services',
                desc: 'Browse by category or post a service request. Filter by location and skill type.',
              },
              {
                icon: <BadgeCheck size={28} className="text-primary-600" />,
                step: '2',
                title: 'Choose a Verified Worker',
                desc: 'View provider profiles, check verification badges, ratings and reviews before booking.',
              },
              {
                icon: <Star size={28} className="text-primary-600" />,
                step: '3',
                title: 'Get the Job Done & Review',
                desc: 'Receive the service and leave a review that helps build the worker\'s digital work history.',
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-4 bg-primary-600 text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: <Users size={32} />, value: 'Workers', label: 'Skilled Providers Ready' },
            { icon: <Shield size={32} />, value: 'Verified', label: 'Document-Verified Badges' },
            { icon: <TrendingUp size={32} />, value: 'Experience', label: 'Built Into Work History' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2">
              <div className="text-primary-200">{stat.icon}</div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-primary-200 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Browse categories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Browse by Category</h2>
          <p className="text-gray-500 mb-8">Find the right skill for your needs</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {SKILL_CATEGORIES.slice(0, 12).map((cat) => (
              <Link
                key={cat}
                href={`/services?category=${encodeURIComponent(cat)}`}
                className="flex items-center justify-center text-center p-3 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 text-sm text-gray-700 hover:text-primary-700 font-medium transition-all"
              >
                {cat}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/services" className="text-primary-600 font-medium hover:underline inline-flex items-center gap-1">
              See all categories <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA for providers */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <Briefcase size={40} className="text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Are You a Skilled Worker?
          </h2>
          <p className="text-gray-500 mb-6 text-lg">
            Join MANPROD, get verified, and start earning. Every job you complete builds your
            digital work history that you can use as professional experience.
          </p>
          <Link
            href="/register?role=PROVIDER"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Register as a Provider <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="font-bold text-white text-lg">MANPROD</p>
          <p>Empowering local communities through verified skills exchange.</p>
          <div className="flex gap-4">
            <Link href="/services" className="hover:text-white transition-colors">Services</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
