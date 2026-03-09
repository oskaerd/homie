import { db } from '@/lib/db'
import { tickets, users } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { auth } from '@/lib/auth'

export default async function KanbanPage() {
  const [allTickets, allUsers, session] = await Promise.all([
    db.select().from(tickets).orderBy(desc(tickets.createdAt)),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users),
    auth(),
  ])
  const userName = session?.user?.name ?? session?.user?.email ?? ''
  return <KanbanBoard initialTickets={allTickets} users={allUsers} userName={userName} />
}
