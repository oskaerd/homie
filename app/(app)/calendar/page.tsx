import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { gte } from 'drizzle-orm'
import { CalendarView } from '@/components/calendar/CalendarView'
import { startOfMonth, format } from 'date-fns'

export default async function CalendarPage() {
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd'T'00:00:00")
  const allEvents = await db.select().from(events).where(gte(events.startTime, monthStart))
  return <CalendarView initialEvents={allEvents} />
}
