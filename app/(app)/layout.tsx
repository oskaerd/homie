import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { MobileHeader } from '@/components/MobileHeader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
      <MobileHeader user={session.user} />
      <div className="hidden md:block">
        <Sidebar user={session.user} />
      </div>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  )
}
