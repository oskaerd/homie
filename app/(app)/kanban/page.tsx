import { db } from '@/lib/db'
import { tickets, users } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { KanbanBoardClient } from '@/components/kanban/KanbanBoardClient'

export default async function KanbanPage() {
  const [allTickets, allUsers, session] = await Promise.all([
    db.select().from(tickets).orderBy(desc(tickets.createdAt)),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users),
    auth(),
  ])
  const userName = session?.user?.name ?? session?.user?.email ?? ''
  return <KanbanBoardClient initialTickets={allTickets} users={allUsers} userName={userName} />
}
