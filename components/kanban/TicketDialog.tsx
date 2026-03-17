'use client'

import { useState, useEffect } from 'react'
import { Ticket } from '@/lib/db/schema'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'

interface UserOption {
  id: string
  name: string | null
  email: string
}

interface TicketDialogProps {
  ticket: Ticket | null
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Ticket>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  users: UserOption[]
}

export function TicketDialog({ ticket, open, onClose, onSave, onDelete, users }: TicketDialogProps) {
  const [form, setForm] = useState<Partial<Ticket>>(ticket ?? {})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setForm(ticket ?? {})
  }, [ticket])

  function update<K extends keyof Ticket>(key: K, value: Ticket[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  async function handleDelete() {
    if (!ticket) return
    setDeleting(true)
    await onDelete(ticket.id)
    setDeleting(false)
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket #{ticket.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={form.title ?? ''} onChange={(e) => update('title', e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={form.description ?? ''}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update('status', v as Ticket['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">TODO</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update('priority', v as Ticket['priority'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Reporter</Label>
              <Input value={form.reporter ?? ''} readOnly className="cursor-default bg-muted" />
            </div>
            <div className="space-y-1">
              <Label>Assignee</Label>
              <Select
                value={form.assignee ?? '__none__'}
                onValueChange={(v) => update('assignee', v === '__none__' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.name ?? u.email}>
                      {u.name ?? u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={form.dueDate ?? ''}
              onChange={(e) => update('dueDate', e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Created:{' '}
            {ticket.createdAt ? format(new Date(ticket.createdAt), 'PPP') : '—'}
          </p>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
