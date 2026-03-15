import { db } from '@/lib/db'
import { wishlist, users } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { WishlistBoard } from '@/components/wishlist/WishlistBoard'

export default async function WishlistPage() {
  const [items, allUsers] = await Promise.all([
    db.select().from(wishlist).orderBy(desc(wishlist.createdAt)),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users),
  ])
  return <WishlistBoard initialItems={items} users={allUsers} />
}
