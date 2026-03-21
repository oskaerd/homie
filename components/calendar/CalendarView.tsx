'use client'

import { useState, useCallback } from 'react'
import { Event, NewEvent } from '@/lib/db/schema'
import { PageTitle } from '@/components/PageTitle'
import { GradientButton } from '@/components/GradientButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns'
import { cn } from '@/lib/utils'

const submitterColors = [
  { bg: 'rgba(244,114,182,0.2)', text: 'rgb(244,114,182)' },   // pink
  { bg: 'rgba(96,165,250,0.2)', text: 'rgb(96,165,250)' },     // blue
  { bg: 'rgba(52,211,153,0.2)', text: 'rgb(52,211,153)' },     // green
  { bg: 'rgba(251,146,60,0.2)', text: 'rgb(251,146,60)' },     // orange
  { bg: 'rgba(168,85,247,0.2)', text: 'rgb(168,85,247)' },     // purple
  { bg: 'rgba(250,204,21,0.2)', text: 'rgb(202,164,17)' },     // yellow
  { bg: 'rgba(45,212,191,0.2)', text: 'rgb(45,212,191)' },     // teal
  { bg: 'rgba(248,113,113,0.2)', text: 'rgb(248,113,113)' },   // red
]

function getSubmitterColor(name: string | null) {
  if (!name) return { bg: 'rgba(var(--primary), 0.2)', text: 'rgb(var(--primary))' }
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return submitterColors[Math.abs(hash) % submitterColors.length]
}

interface CalendarViewProps {
  initialEvents: Event[]
  userName: string
}

export function CalendarView({ initialEvents, userName }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [form, setForm] = useState<Partial<NewEvent>>({ submitter: userName })
  const [saving, setSaving] = useState(false)

  function update<K extends keyof NewEvent>(key: K, value: NewEvent[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const weeks: Date[][] = []
  let day = calStart
  while (day <= calEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(day)
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  function eventsForDay(date: Date) {
    return events.filter((e) => isSameDay(parseISO(e.startTime), date))
  }

  function openEdit(ev: Event) {
    setEditingEvent(ev)
    setForm({
      title: ev.title,
      location: ev.location ?? '',
      submitter: ev.submitter ?? '',
      startTime: ev.startTime,
      endTime: ev.endTime ?? '',
    })
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.startTime) return
    if (form.endTime && form.endTime < form.startTime) return
    setSaving(true)

    if (editingEvent) {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const updated: Event = await res.json()
        setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)))
        setShowDialog(false)
        setEditingEvent(null)
        setForm({ submitter: userName })
      }
    } else {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const created: Event = await res.json()
        setEvents((prev) => [...prev, created])
        setShowDialog(false)
        setForm({ submitter: userName })
      }
    }
    setSaving(false)
  }

  const handleDelete = useCallback(async (id: number) => {
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle>Calendar</PageTitle>
        <GradientButton
          onClick={() => {
            setEditingEvent(null)
            setShowDialog(true)
            if (selectedDay) {
              const dateStr = format(selectedDay, "yyyy-MM-dd'T'HH:mm")
              setForm({ submitter: userName, startTime: dateStr })
            } else {
              setForm({ submitter: userName })
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Add Event
        </GradientButton>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="w-36 text-center text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
          Today
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-0">
            {week.map((d, di) => {
              const isCurrentMonth = isSameMonth(d, currentMonth)
              const isSelected = selectedDay ? isSameDay(d, selectedDay) : false
              const isToday = isSameDay(d, new Date())
              const dayEvents = eventsForDay(d)

              return (
                <button
                  key={di}
                  onClick={() => setSelectedDay(isSameDay(d, selectedDay ?? new Date('invalid')) ? null : d)}
                  className={cn(
                    'min-h-[80px] border-r p-2 text-left last:border-r-0 hover:bg-muted/40',
                    !isCurrentMonth && 'opacity-40',
                    isSelected && 'bg-primary/10'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm',
                      isToday && 'bg-primary text-primary-foreground font-bold'
                    )}
                  >
                    {format(d, 'd')}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const color = getSubmitterColor(ev.submitter)
                      return (
                        <div
                          key={ev.id}
                          className="truncate rounded px-1 text-[10px]"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {ev.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">{format(selectedDay, 'EEEE, MMMM d')}</h3>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => openEdit(ev)}
                  className="flex w-full items-start justify-between rounded border p-3 text-left hover:bg-muted/40"
                >
                  <div>
                    <p className="font-medium">{ev.title}</p>
                    {ev.location && (
                      <p className="text-xs text-muted-foreground">{ev.location}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(ev.startTime), 'HH:mm')}
                      {ev.endTime && ` – ${format(parseISO(ev.endTime), 'HH:mm')}`}
                    </p>
                    {ev.submitter && (
                      <p className="text-xs text-muted-foreground">by {ev.submitter}</p>
                    )}
                  </div>
                  <span
                    role="button"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(ev.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit event dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) { setShowDialog(false); setEditingEvent(null); setForm({ submitter: userName }) } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                value={form.title ?? ''}
                onChange={(e) => update('title', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input
                value={form.location ?? ''}
                onChange={(e) => update('location', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Submitted by</Label>
              <Input
                value={form.submitter ?? ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start *</Label>
                <Input
                  type="datetime-local"
                  value={form.startTime ?? ''}
                  onChange={(e) => update('startTime', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={form.endTime ?? ''}
                  onChange={(e) => update('endTime', e.target.value)}
                  min={form.startTime ?? undefined}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); setEditingEvent(null); setForm({ submitter: userName }) }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingEvent ? 'Save Changes' : 'Add Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
