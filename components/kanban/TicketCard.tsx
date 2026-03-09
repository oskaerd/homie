'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Ticket } from '@/lib/db/schema'
import { format } from 'date-fns'

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

interface TicketCardProps {
  ticket: Ticket
  onClick: () => void
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="w-full rounded-lg border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing"
    >
      <p className="text-sm font-medium leading-snug">{ticket.title}</p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[ticket.priority]}`}
        >
          {ticket.priority}
        </span>

        {ticket.dueDate && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(ticket.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {ticket.assignee && (
        <div className="mt-2 flex items-center gap-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {ticket.assignee.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground">{ticket.assignee}</span>
        </div>
      )}
    </button>
  )
}
