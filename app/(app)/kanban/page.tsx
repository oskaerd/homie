import { db } from '@/lib/db'
import { tickets } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

export default async function KanbanPage() {
  const allTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt))
  return <KanbanBoard initialTickets={allTickets} />
}
