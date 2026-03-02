import { Ticket } from '@/lib/db/schema'
import { TicketCard } from './TicketCard'

const columnLabels: Record<string, string> = {
  todo: 'TODO',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  qa: 'QA',
  done: 'Done',
}

const columnColors: Record<string, string> = {
  todo: 'border-t-slate-400',
  in_progress: 'border-t-blue-400',
  blocked: 'border-t-red-400',
  qa: 'border-t-purple-400',
  done: 'border-t-green-400',
}

interface KanbanColumnProps {
  status: string
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
}

export function KanbanColumn({ status, tickets, onTicketClick }: KanbanColumnProps) {
  return (
    <div className={`flex flex-col rounded-lg border border-t-4 bg-muted/30 ${columnColors[status]}`}>
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold">{columnLabels[status]}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tickets.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2 min-h-[100px]">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket)} />
        ))}
      </div>
    </div>
  )
}
