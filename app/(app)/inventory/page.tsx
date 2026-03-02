import { db } from '@/lib/db'
import { inventory } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { InventoryTable } from '@/components/inventory/InventoryTable'

export default async function InventoryPage() {
  const items = await db.select().from(inventory).orderBy(asc(inventory.expirationDate))
  return <InventoryTable initialItems={items} />
}
