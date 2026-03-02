'use client'

import { useState, useCallback, useEffect } from 'react'
import { Meal } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOTS = ['breakfast', '2nd_breakfast', 'lunch', 'dinner', 'snacks'] as const
const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  '2nd_breakfast': '2nd Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
}

type Slot = typeof SLOTS[number]

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

interface MealPlannerProps {
  initialMeals: Meal[]
  initialWeekStart: string
}

export function MealPlanner({ initialMeals, initialWeekStart }: MealPlannerProps) {
  const [weekStart, setWeekStart] = useState<Date>(new Date(initialWeekStart))
  const [mealMap, setMealMap] = useState<Map<string, Meal>>(buildMap(initialMeals))
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<{ day: number; slot: Slot } | null>(null)
  const [editValue, setEditValue] = useState('')

  function buildMap(list: Meal[]): Map<string, Meal> {
    const m = new Map<string, Meal>()
    for (const meal of list) {
      m.set(`${meal.day}-${meal.slot}`, meal)
    }
    return m
  }

  function cellKey(day: number, slot: Slot) {
    return `${day}-${slot}`
  }

  const loadWeek = useCallback(async (monday: Date) => {
    setLoading(true)
    const res = await fetch(`/api/meals?weekStart=${toIsoDate(monday)}`)
    if (res.ok) {
      const data: Meal[] = await res.json()
      setMealMap(buildMap(data))
    }
    setLoading(false)
  }, [])

  function prevWeek() {
    const newDate = subWeeks(weekStart, 1)
    setWeekStart(newDate)
    loadWeek(newDate)
  }

  function nextWeek() {
    const newDate = addWeeks(weekStart, 1)
    setWeekStart(newDate)
    loadWeek(newDate)
  }

  function startEdit(day: number, slot: Slot) {
    const existing = mealMap.get(cellKey(day, slot))
    setEditing({ day, slot })
    setEditValue(existing?.content ?? '')
  }

  async function saveEdit() {
    if (!editing) return
    const { day, slot } = editing
    const key = cellKey(day, slot)
    const existing = mealMap.get(key)

    if (!editValue.trim()) {
      // Delete if empty
      if (existing) {
        await fetch(`/api/meals/${existing.id}`, { method: 'DELETE' })
        setMealMap((prev) => {
          const next = new Map(prev)
          next.delete(key)
          return next
        })
      }
      setEditing(null)
      return
    }

    if (existing) {
      const res = await fetch(`/api/meals/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editValue }),
      })
      if (res.ok) {
        const updated: Meal = await res.json()
        setMealMap((prev) => new Map(prev).set(key, updated))
      }
    } else {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: toIsoDate(weekStart),
          day,
          slot,
          content: editValue,
        }),
      })
      if (res.ok) {
        const created: Meal = await res.json()
        setMealMap((prev) => new Map(prev).set(key, created))
      }
    }
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meal Planner</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek} disabled={loading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-44 text-center text-sm font-medium">
            Week of {format(weekStart, 'MMM d, yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={nextWeek} disabled={loading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-28 px-3 py-2 text-left font-medium text-muted-foreground">Meal</th>
              {DAYS.map((day, idx) => (
                <th key={day} className="px-3 py-2 text-center font-medium">
                  <div>{day}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {format(addDays(weekStart, idx), 'd MMM')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot) => (
              <tr key={slot} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium text-muted-foreground">
                  {SLOT_LABELS[slot]}
                </td>
                {DAYS.map((_, dayIdx) => {
                  const key = cellKey(dayIdx, slot)
                  const meal = mealMap.get(key)
                  const isEditing = editing?.day === dayIdx && editing?.slot === slot

                  return (
                    <td
                      key={dayIdx}
                      className={cn(
                        'border-l px-2 py-1 align-top',
                        !isEditing && 'cursor-pointer hover:bg-muted/40'
                      )}
                      onClick={() => !isEditing && startEdit(dayIdx, slot)}
                    >
                      {isEditing ? (
                        <textarea
                          autoFocus
                          className="w-full resize-none rounded border bg-background px-2 py-1 text-xs focus:outline-none"
                          rows={3}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              saveEdit()
                            }
                            if (e.key === 'Escape') setEditing(null)
                          }}
                        />
                      ) : (
                        <p className="min-h-[40px] whitespace-pre-wrap text-xs">
                          {meal?.content ?? ''}
                        </p>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
