'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Home, ClipboardList, Package, UtensilsCrossed, CalendarDays, LogOut } from 'lucide-react'
import { LanguageSelect } from '@/components/LanguageSelect'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/kanban', label: 'Kanban', icon: ClipboardList },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
]

interface SidebarProps {
  user?: { name?: string | null; email?: string | null }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <span
          className="text-xl font-bold tracking-tight"
          style={{
            fontFamily: 'var(--font-space-mono), monospace',
            background: 'linear-gradient(110deg, #f472b6 0%, #a855f7 45%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.6))',
          }}
        >
          HOMIE
        </span>
        <LanguageSelect />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <p className="mb-2 truncate px-3 text-xs text-muted-foreground">{user?.name ?? user?.email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
