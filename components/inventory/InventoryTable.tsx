'use client'

import { useState, useCallback } from 'react'
import { InventoryItem, NewInventoryItem } from '@/lib/db/schema'
import { PageTitle } from '@/components/PageTitle'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react'
import { format, isPast, isWithinInterval, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface InventoryTableProps {
  initialItems: InventoryItem[]
}

function rowClass(item: InventoryItem) {
  if (!item.expirationDate) return ''
  const expiry = new Date(item.expirationDate)
  if (isPast(expiry)) return 'bg-red-50 dark:bg-red-950/20'
  if (isWithinInterval(expiry, { start: new Date(), end: addDays(new Date(), 7) }))
    return 'bg-yellow-50 dark:bg-yellow-950/20'
  return ''
}

const emptyForm: Partial<NewInventoryItem> = { quantity: 1 }

export function InventoryTable({ initialItems }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [sortAsc, setSortAsc] = useState(true)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<NewInventoryItem>>(emptyForm)
  const [saving, setSaving] = useState(false)

  const sorted = [...items].sort((a, b) => {
    const da = a.expirationDate ?? ''
    const db_ = b.expirationDate ?? ''
    return sortAsc ? da.localeCompare(db_) : db_.localeCompare(da)
  })

  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setForm({
      name: item.name,
      expirationDate: item.expirationDate ?? undefined,
      quantity: item.quantity,
      unit: item.unit ?? undefined,
    })
  }

  function update<K extends keyof NewInventoryItem>(key: K, value: NewInventoryItem[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleAdd = useCallback(async () => {
    if (!form.name) return
    setSaving(true)
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const item: InventoryItem = await res.json()
      setItems((prev) => [...prev, item])
      setShowAdd(false)
      setForm(emptyForm)
    }
    setSaving(false)
  }, [form])

  const handleEdit = useCallback(async () => {
    if (!editItem) return
    setSaving(true)
    const res = await fetch(`/api/inventory/${editItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const updated: InventoryItem = await res.json()
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      setEditItem(null)
    }
    setSaving(false)
  }, [editItem, form])

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return
    await fetch(`/api/inventory/${deleteItem.id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== deleteItem.id))
    setDeleteItem(null)
  }, [deleteItem])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle>Inventory</PageTitle>
        <Button size="sm" onClick={() => { setShowAdd(true); setForm(emptyForm) }}>
          <Plus className="mr-1 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  className="flex items-center gap-1"
                  onClick={() => setSortAsc((a) => !a)}
                >
                  Expiry Date
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">Quantity</th>
              <th className="px-4 py-3 text-left font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No items yet. Add one above.
                </td>
              </tr>
            )}
            {sorted.map((item) => (
              <tr key={item.id} className={cn('border-b last:border-0', rowClass(item))}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.expirationDate
                    ? format(new Date(item.expirationDate), 'PP')
                    : '—'}
                </td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.unit ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteItem(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit dialog */}
      <Dialog
        open={showAdd || !!editItem}
        onOpenChange={(o) => {
          if (!o) { setShowAdd(false); setEditItem(null) }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={form.name ?? ''}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expirationDate ?? ''}
                onChange={(e) => update('expirationDate', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={form.quantity ?? 1}
                  onChange={(e) => update('quantity', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Input
                  placeholder="e.g. kg, pcs"
                  value={form.unit ?? ''}
                  onChange={(e) => update('unit', e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditItem(null) }}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={editItem ? handleEdit : handleAdd}>
              {saving ? 'Saving…' : editItem ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteItem?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
