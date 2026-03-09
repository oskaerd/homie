import { db } from '@/lib/db'
import { wishlist } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { WishlistBoard } from '@/components/wishlist/WishlistBoard'

export default async function WishlistPage() {
  const items = await db.select().from(wishlist).orderBy(desc(wishlist.createdAt))
  return <WishlistBoard initialItems={items} />
}
