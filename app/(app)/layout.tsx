import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { LanguageSelect } from '@/components/LanguageSelect'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={session.user} />
      <main className="relative flex-1 overflow-y-auto p-6">
        <div className="absolute right-6 top-6 z-10">
          <LanguageSelect />
        </div>
        {children}
      </main>
    </div>
  )
}
