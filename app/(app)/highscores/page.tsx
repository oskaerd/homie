import { db } from '@/lib/db'
import { highscoreCategories, highscoreItems } from '@/lib/db/schema'
import { HighscoresBoard } from '@/components/highscores/HighscoresBoard'

export default async function HighscoresPage() {
  const [categories, items] = await Promise.all([
    db.select().from(highscoreCategories).orderBy(highscoreCategories.name),
    db.select().from(highscoreItems),
  ])

  return <HighscoresBoard initialCategories={categories} initialItems={items} />
}
