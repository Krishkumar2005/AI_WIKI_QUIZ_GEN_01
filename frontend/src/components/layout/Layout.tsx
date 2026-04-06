import { NavLink } from 'react-router-dom'
import { BookOpen, Clock, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import type { ReactNode } from 'react'

const navItems = [
  { to: '/',        label: 'Generate', icon: Sparkles },
  { to: '/history', label: 'History',  icon: Clock },
]

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-parchment-200 bg-parchment-50/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <BookOpen size={16} className="text-parchment-50" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold text-ink-900 tracking-tight">
                WikiQuiz
              </span>
              <span className="font-mono text-[9px] tracking-widest text-ink-400 uppercase">
                AI-Powered
              </span>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent-500 text-white shadow-sm'
                      : 'text-ink-600 hover:bg-parchment-200 hover:text-ink-900'
                  )
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="page-enter">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-parchment-200 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <span className="font-mono text-xs text-ink-300">WikiQuiz v1.0</span>
          <span className="font-mono text-xs text-ink-300">Flask + React + Supabase</span>
        </div>
      </footer>
    </div>
  )
}
