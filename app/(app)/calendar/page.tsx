import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { gte } from 'drizzle-orm'
import { CalendarView } from '@/components/calendar/CalendarView'
import { startOfMonth, format } from 'date-fns'
import { auth } from '@/lib/auth'

export default async function CalendarPage() {
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd'T'00:00:00")
  const [allEvents, session] = await Promise.all([
    db.select().from(events).where(gte(events.startTime, monthStart)),
    auth(),
  ])
  const userName = session?.user?.name ?? session?.user?.email ?? ''
  return <CalendarView initialEvents={allEvents} userName={userName} />
}
