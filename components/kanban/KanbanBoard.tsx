'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Ticket, NewTicket } from '@/lib/db/schema'
import { KanbanColumn } from './KanbanColumn'
import { TicketDialog } from './TicketDialog'
import { CreateTicketDialog } from './CreateTicketDialog'
import { Button } from '@/components/ui/button'
import { Plus, Filter } from 'lucide-react'
import { PageTitle } from '@/components/PageTitle'
import { GradientButton } from '@/components/GradientButton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const COLUMNS = ['todo', 'in_progress', 'blocked', 'qa', 'done'] as const

interface UserOption {
  id: string
  name: string | null
  email: string
}

interface KanbanBoardProps {
  initialTickets: Ticket[]
  users: UserOption[]
  userName: string
}

export function KanbanBoard({ initialTickets, users, userName }: KanbanBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set())

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

  function toggleFilter(value: string) {
    setAssigneeFilter((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const isFiltered = assigneeFilter.size > 0
  const filteredTickets = isFiltered
    ? tickets.filter((t) => assigneeFilter.has(t.assignee ?? '__unassigned'))
    : tickets

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const ticketsByStatus = COLUMNS.reduce(
    (acc, status) => {
      acc[status] = filteredTickets
        .filter((t) => t.status === status)
        .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2))
      return acc
    },
    {} as Record<string, Ticket[]>
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const ticketId = active.id as number
    const newStatus = over.id as Ticket['status']

    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.status === newStatus) return

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    )

    const res = await fetch(`/api/kanban/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.ok) {
      // Revert on failure
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: ticket.status } : t))
      )
    }
  }, [tickets])

  const handleSave = useCallback(async (data: Partial<Ticket>) => {
    if (!selectedTicket) return
    const res = await fetch(`/api/kanban/${selectedTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated: Ticket = await res.json()
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setSelectedTicket(null)
    }
  }, [selectedTicket])

  const handleDelete = useCallback(async (id: number) => {
    await fetch(`/api/kanban/${id}`, { method: 'DELETE' })
    setTickets((prev) => prev.filter((t) => t.id !== id))
    setSelectedTicket(null)
  }, [])

  const handleCreate = useCallback(async (data: NewTicket) => {
    const res = await fetch('/api/kanban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const created: Ticket = await res.json()
      setTickets((prev) => [created, ...prev])
      setShowCreate(false)
    }
  }, [])

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <PageTitle>Kanban</PageTitle>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn(isFiltered && 'border-primary text-primary')}>
                  <Filter className="mr-1 h-4 w-4" />
                  Assignee
                  {isFiltered && ` (${assigneeFilter.size})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-2">
                <div className="space-y-1">
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                    <Checkbox
                      checked={assigneeFilter.has('__unassigned')}
                      onCheckedChange={() => toggleFilter('__unassigned')}
                    />
                    <span className="text-muted-foreground italic">Unassigned</span>
                  </label>
                  {users.map((u) => {
                    const label = u.name || u.email
                    return (
                      <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                        <Checkbox
                          checked={assigneeFilter.has(label)}
                          onCheckedChange={() => toggleFilter(label)}
                        />
                        {label}
                      </label>
                    )
                  })}
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 w-full text-xs"
                      onClick={() => setAssigneeFilter(new Set())}
                    >
                      Clear filter
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <GradientButton onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New Ticket
            </GradientButton>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto md:overflow-hidden">
          <div className="flex h-full min-w-max gap-3 md:grid md:min-w-0 md:grid-cols-5">
            {COLUMNS.map((status) => (
              <div key={status} className="flex w-[240px] flex-col md:w-auto">
                <KanbanColumn
                  status={status}
                  tickets={ticketsByStatus[status] ?? []}
                  onTicketClick={setSelectedTicket}
                />
              </div>
            ))}
          </div>
        </div>

        <TicketDialog
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          users={users}
        />

        <CreateTicketDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          userName={userName}
          users={users}
        />
      </div>
    </DndContext>
  )
}
