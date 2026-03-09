'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { InventoryItem, NewInventoryItem } from '@/lib/db/schema'
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
import { Plus, Pencil, Trash2, ArrowUpDown, ImagePlus, Loader2 } from 'lucide-react'
import { format, isPast, isWithinInterval, addDays } from 'date-fns'

interface InventoryTableProps {
  initialItems: InventoryItem[]
}

function expiryBadge(item: InventoryItem) {
  if (!item.expirationDate) return null
  const expiry = new Date(item.expirationDate)
  if (isPast(expiry))
    return <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Expired</span>
  if (isWithinInterval(expiry, { start: new Date(), end: addDays(new Date(), 7) }))
    return <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">Expiring soon</span>
  return null
}

function WarmEarthyPlaceholder() {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-3"
      style={{ background: '#f5ede0' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 60%, rgba(210,160,90,0.15) 0%, transparent 70%), radial-gradient(ellipse at 75% 30%, rgba(180,120,70,0.1) 0%, transparent 60%)',
        }}
      />
      <svg style={{ position: 'relative', zIndex: 1, opacity: 0.45 }} width="52" height="52" viewBox="0 0 72 72" fill="none">
        <path d="M28 14 C28 10 32 10 32 6" stroke="#b07840" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M36 16 C36 12 40 12 40 8" stroke="#b07840" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M44 14 C44 10 48 10 48 6" stroke="#b07840" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 36 C14 52 58 52 58 36" stroke="#c8956a" strokeWidth="1.5" fill="rgba(180,120,70,0.06)"/>
        <line x1="12" y1="36" x2="60" y2="36" stroke="#c8956a" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M26 52 L24 58 M46 52 L48 58" stroke="#d4a880" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="58" x2="50" y2="58" stroke="#d4a880" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10" y1="24" x2="10" y2="46" stroke="#d4a880" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8"  y1="24" x2="8"  y2="30" stroke="#d4a880" strokeWidth="1" strokeLinecap="round"/>
        <line x1="12" y1="24" x2="12" y2="30" stroke="#d4a880" strokeWidth="1" strokeLinecap="round"/>
        <line x1="62" y1="24" x2="62" y2="46" stroke="#d4a880" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M62 24 L65 30 L62 32" stroke="#d4a880" strokeWidth="1" strokeLinecap="round" fill="none"/>
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-fraunces), serif',
          fontStyle: 'italic',
          fontWeight: 300,
          color: '#c8a882',
          fontSize: '14px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        No photo
      </span>
    </div>
  )
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
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sorted = [...items].sort((a, b) => {
    const da = a.expirationDate ?? ''
    const db_ = b.expirationDate ?? ''
    return sortAsc ? da.localeCompare(db_) : db_.localeCompare(da)
  })

  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setImagePreview(item.imageUrl ?? null)
    setForm({
      name: item.name,
      expirationDate: item.expirationDate ?? undefined,
      quantity: item.quantity,
      unit: item.unit ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
    })
  }

  function openAdd() {
    setShowAdd(true)
    setForm(emptyForm)
    setImagePreview(null)
  }

  function update<K extends keyof NewInventoryItem>(key: K, value: NewInventoryItem[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/inventory/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      update('imageUrl', url)
      setImagePreview(url)
    }
    setUploading(false)
    e.target.value = ''
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
      setImagePreview(null)
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
      setImagePreview(null)
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
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setSortAsc((a) => !a)}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort by expiry
          </button>
          <GradientButton onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Item
          </GradientButton>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No items yet. Add one above.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="flex flex-col overflow-hidden rounded-xl border"
              style={{ borderColor: 'rgba(168,85,247,0.2)', background: '#120820' }}
            >
              {/* Image area */}
              <div className="relative h-36 w-full shrink-0">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <WarmEarthyPlaceholder />
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="truncate font-semibold text-sm leading-snug" style={{ color: '#e0c4ff' }}>
                  {item.name}
                </p>
                {item.expirationDate && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.expirationDate), 'PP')}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                </p>
                {expiryBadge(item)}
              </div>

              {/* Actions */}
              <div className="flex border-t px-2 py-1.5" style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteItem(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog
        open={showAdd || !!editItem}
        onOpenChange={(o) => {
          if (!o) { setShowAdd(false); setEditItem(null); setImagePreview(null) }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Image upload */}
            <div className="space-y-1">
              <Label>Photo</Label>
              <div
                className="relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors hover:border-primary"
                style={{ borderColor: 'rgba(168,85,247,0.3)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="preview" fill className="object-cover" unoptimized />
                ) : (
                  <WarmEarthyPlaceholder />
                )}
                <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 transition-opacity hover:opacity-100 bg-black/20">
                  <span className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                    {uploading ? 'Uploading…' : 'Change photo'}
                  </span>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>

            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name ?? ''} onChange={(e) => update('name', e.target.value)} required />
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
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditItem(null); setImagePreview(null) }}>
              Cancel
            </Button>
            <Button disabled={saving || uploading} onClick={editItem ? handleEdit : handleAdd}>
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
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
