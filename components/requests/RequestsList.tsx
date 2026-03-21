'use client'

import { useState } from 'react'
import { Request } from '@/lib/db/schema'
import { PageTitle } from '@/components/PageTitle'
import { GradientButton } from '@/components/GradientButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, RotateCcw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-500 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
}

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

interface RequestsListProps {
  initialRequests: Request[]
}

export function RequestsList({ initialRequests }: RequestsListProps) {
  const [items, setItems] = useState<Request[]>(initialRequests)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<string>('medium')
  const [saving, setSaving] = useState(false)

  const sorted = [...items].sort((a, b) =>
    (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) -
    (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2)
  )

  async function handlePriorityChange(item: Request, newPriority: string) {
    const res = await fetch(`/api/requests/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: newPriority }),
    })
    if (res.ok) {
      const updated: Request = await res.json()
      setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), priority }),
    })
    if (res.ok) {
      const created: Request = await res.json()
      setItems((prev) => [...prev, created])
      setShowCreate(false)
      setTitle('')
      setPriority('medium')
    }
    setSaving(false)
  }

  async function toggleComplete(item: Request) {
    const res = await fetch(`/api/requests/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !item.completed }),
    })
    if (res.ok) {
      const updated: Request = await res.json()
      setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/requests/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle>Requests</PageTitle>
        <GradientButton onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Request
        </GradientButton>
      </div>

      <div className="rounded-lg border">
        {sorted.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No requests yet</p>
        ) : (
          <div className="divide-y">
            {sorted.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Select value={item.priority} onValueChange={(v) => handlePriorityChange(item, v)}>
                  <SelectTrigger className={cn('h-auto w-auto gap-1 border px-2 py-0.5 text-xs font-medium', priorityColors[item.priority])}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">critical</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="low">low</SelectItem>
                  </SelectContent>
                </Select>
                <span
                  className={cn(
                    'flex-1 text-sm',
                    item.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {item.title}
                </span>
                {item.submitter && (
                  <span className="text-xs text-muted-foreground">{item.submitter}</span>
                )}
                {item.completed ? (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleComplete(item)}
                      title="Restore"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-green-500 hover:text-green-500"
                    onClick={() => toggleComplete(item)}
                    title="Complete"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Feature request or bug report..."
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
