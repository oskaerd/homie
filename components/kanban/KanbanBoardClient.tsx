'use client'

import dynamic from 'next/dynamic'
import { Ticket } from '@/lib/db/schema'

interface UserOption {
  id: string
  name: string | null
  email: string
}

interface Props {
  initialTickets: Ticket[]
  users: UserOption[]
  userName: string
}

const KanbanBoard = dynamic(
  () => import('./KanbanBoard').then((m) => m.KanbanBoard),
  { ssr: false, loading: () => null }
)

export function KanbanBoardClient(props: Props) {
  return <KanbanBoard {...props} />
}
