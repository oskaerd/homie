'use client'

import { useState, useCallback } from 'react'
import { Ticket, NewTicket } from '@/lib/db/schema'
import { KanbanColumn } from './KanbanColumn'
import { TicketDialog } from './TicketDialog'
import { CreateTicketDialog } from './CreateTicketDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const COLUMNS = ['todo', 'in_progress', 'blocked', 'qa', 'done'] as const

interface KanbanBoardProps {
  initialTickets: Ticket[]
}

export function KanbanBoard({ initialTickets }: KanbanBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const ticketsByStatus = COLUMNS.reduce(
    (acc, status) => {
      acc[status] = tickets.filter((t) => t.status === status)
      return acc
    },
    {} as Record<string, Ticket[]>
  )

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
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-5 gap-3 overflow-hidden">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={ticketsByStatus[status] ?? []}
            onTicketClick={setSelectedTicket}
          />
        ))}
      </div>

      <TicketDialog
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <CreateTicketDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
