import { db } from '@/lib/db'
import { requests } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { RequestsList } from '@/components/requests/RequestsList'

export default async function RequestsPage() {
  const items = await db.select().from(requests).orderBy(desc(requests.createdAt))
  return <RequestsList initialRequests={items} />
}
