import { db } from '@/lib/db'
import { meals } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { MealPlanner } from '@/components/meals/MealPlanner'
import { startOfWeek, format } from 'date-fns'

function getMonday(): string {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
  return format(monday, 'yyyy-MM-dd')
}

export default async function MealsPage() {
  const weekStart = getMonday()
  const weekMeals = await db.select().from(meals).where(eq(meals.weekStart, weekStart))

  return <MealPlanner initialMeals={weekMeals} initialWeekStart={weekStart} />
}
