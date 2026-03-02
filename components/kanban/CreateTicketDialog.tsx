'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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
import { NewTicket } from '@/lib/db/schema'

interface CreateTicketDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (data: NewTicket) => Promise<void>
}

const defaultForm: Partial<NewTicket> = {
  priority: 'medium',
  status: 'todo',
}

export function CreateTicketDialog({ open, onClose, onCreate }: CreateTicketDialogProps) {
  const [form, setForm] = useState<Partial<NewTicket>>(defaultForm)
  const [saving, setSaving] = useState(false)

  function update<K extends keyof NewTicket>(key: K, value: NewTicket[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    await onCreate(form as NewTicket)
    setSaving(false)
    setForm(defaultForm)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input
              value={form.title ?? ''}
              onChange={(e) => update('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={form.description ?? ''}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select
                value={form.priority ?? 'medium'}
                onValueChange={(v) => update('priority', v as NewTicket['priority'])}
              >
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

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.status ?? 'todo'}
                onValueChange={(v) => update('status', v as NewTicket['status'])}
              >
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Reporter</Label>
              <Input value={form.reporter ?? ''} onChange={(e) => update('reporter', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Assignee</Label>
              <Input value={form.assignee ?? ''} onChange={(e) => update('assignee', e.target.value)} />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
