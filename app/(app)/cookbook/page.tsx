import { db } from '@/lib/db'
import { recipes } from '@/lib/db/schema'
import { CookbookBoard } from '@/components/cookbook/CookbookBoard'

export default async function CookbookPage() {
  const rows = await db.select().from(recipes).orderBy(recipes.createdAt)
  const parsed = rows.map(r => ({ ...r, ingredients: JSON.parse(r.ingredients) }))
  return <CookbookBoard initialRecipes={parsed} />
}
