'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Menu, Home, ClipboardList, Package, UtensilsCrossed, CalendarDays, Gift, Trophy, BookOpen, MessageSquarePlus, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home',       label: 'Home',       icon: Home },
  { href: '/kanban',     label: 'Kanban',     icon: ClipboardList },
  { href: '/inventory',  label: 'Inventory',  icon: Package },
  { href: '/meals',      label: 'Meals',      icon: UtensilsCrossed },
  { href: '/calendar',   label: 'Calendar',   icon: CalendarDays },
  { href: '/wishlist',   label: 'Wishlist',   icon: Gift },
  { href: '/highscores', label: 'Highscores', icon: Trophy },
  { href: '/cookbook',   label: 'Cookbook',   icon: BookOpen },
  { href: '/requests',  label: 'Requests',  icon: MessageSquarePlus },
]

interface Props {
  user?: { name?: string | null; email?: string | null }
}

export function MobileHeader({ user }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="flex h-14 shrink-0 items-center border-b px-4 md:hidden" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} style={{ color: '#9b78c9' }}>
        <Menu className="h-5 w-5" />
      </Button>
      <Link
        href="/home"
        className="ml-3 text-xl font-bold tracking-tight"
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
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-56 flex-col p-0 border-r" style={{ borderColor: 'rgba(168,85,247,0.2)', background: 'var(--card)' }}>
          <VisuallyHidden><SheetTitle>Navigation</SheetTitle></VisuallyHidden>
          <div className="flex h-14 items-center border-b px-4" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
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
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all',
                    active ? 'border-l-2 pl-[10px]' : 'hover:bg-[rgba(168,85,247,0.08)]'
                  )}
                  style={active ? {
                    borderColor: '#f472b6',
                    background: 'rgba(168,85,247,0.12)',
                    color: 'transparent',
                    backgroundImage: 'linear-gradient(110deg, #f472b6 0%, #a855f7 45%, #60a5fa 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.4))',
                  } : { color: '#9b78c9' }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={active ? { color: '#f472b6' } : {}} />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t p-3" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
            <p className="mb-2 truncate px-3 text-xs" style={{ color: '#7a5a9e' }}>{user?.name ?? user?.email}</p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 transition-colors hover:bg-[rgba(244,114,182,0.08)] hover:text-[#f472b6]"
              style={{ color: '#7a5a9e' }}
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
