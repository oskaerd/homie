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
import { Plus, ArrowUpDown, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { WarmEarthyPlaceholder } from '@/components/WarmEarthyPlaceholder'
import { format, isPast, isWithinInterval, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface InventoryTableProps {
  initialItems: InventoryItem[]
}

function expiryMeta(item: InventoryItem): { label: string; className: string } | null {
  if (!item.expirationDate) return null
  const expiry = new Date(item.expirationDate)
  if (isPast(expiry)) return { label: 'Expired', className: 'text-red-400' }
  if (isWithinInterval(expiry, { start: new Date(), end: addDays(new Date(), 7) }))
    return { label: 'Soon', className: 'text-yellow-400' }
  return null
}

function rowBg(item: InventoryItem) {
  if (!item.expirationDate) return ''
  const expiry = new Date(item.expirationDate)
  if (isPast(expiry)) return 'bg-red-950/20'
  if (isWithinInterval(expiry, { start: new Date(), end: addDays(new Date(), 7) }))
    return 'bg-yellow-950/20'
  return ''
}


const emptyForm: Partial<NewInventoryItem> = { quantity: 1 }

export function InventoryTable({ initialItems }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [sortField, setSortField] = useState<'expiry' | 'name'>('expiry')
  const [sortAsc, setSortAsc] = useState(true)

  // detail sheet
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [detailForm, setDetailForm] = useState<Partial<InventoryItem>>({})
  const [detailPreview, setDetailPreview] = useState<string | null>(null)
  const [detailUploading, setDetailUploading] = useState(false)
  const [detailSaving, setDetailSaving] = useState(false)
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null)
  const detailFileRef = useRef<HTMLInputElement>(null)

  // add dialog
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<Partial<NewInventoryItem>>(emptyForm)
  const [addPreview, setAddPreview] = useState<string | null>(null)
  const [addUploading, setAddUploading] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const addFileRef = useRef<HTMLInputElement>(null)

  const sorted = [...items].sort((a, b) => {
    const valA = sortField === 'name' ? a.name : (a.expirationDate ?? '')
    const valB = sortField === 'name' ? b.name : (b.expirationDate ?? '')
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
  })

  function openDetail(item: InventoryItem) {
    setSelectedItem(item)
    setDetailForm({ ...item })
    setDetailPreview(item.imageUrl ?? null)
  }

  function updateDetail<K extends keyof InventoryItem>(key: K, value: InventoryItem[K]) {
    setDetailForm((f) => ({ ...f, [key]: value }))
  }

  function updateAdd<K extends keyof NewInventoryItem>(key: K, value: NewInventoryItem[K]) {
    setAddForm((f) => ({ ...f, [key]: value }))
  }

  async function uploadImage(
    file: File,
    setUploading: (v: boolean) => void,
    setPreview: (url: string) => void,
    setUrl: (url: string) => void,
  ) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/inventory/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setPreview(url)
      setUrl(url)
    }
    setUploading(false)
  }

  const handleDetailSave = useCallback(async () => {
    if (!selectedItem) return
    setDetailSaving(true)
    const { name, expirationDate, quantity, unit, imageUrl } = detailForm
    const res = await fetch(`/api/inventory/${selectedItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, expirationDate, quantity, unit, imageUrl }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.deleted) {
        setItems((prev) => prev.filter((i) => i.id !== selectedItem.id))
      } else {
        setItems((prev) => prev.map((i) => (i.id === data.id ? data : i)))
      }
      setSelectedItem(null)
    }
    setDetailSaving(false)
  }, [selectedItem, detailForm])

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return
    await fetch(`/api/inventory/${deleteItem.id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== deleteItem.id))
    setDeleteItem(null)
    setSelectedItem(null)
  }, [deleteItem])

  const handleAdd = useCallback(async () => {
    if (!addForm.name || !addForm.expirationDate || addForm.quantity == null || !addForm.unit) return
    setAddSaving(true)
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    if (res.ok) {
      const item: InventoryItem = await res.json()
      setItems((prev) => [...prev, item])
      setShowAdd(false)
      setAddForm(emptyForm)
      setAddPreview(null)
    }
    setAddSaving(false)
  }, [addForm])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle>Inventory</PageTitle>
        <div className="flex items-center gap-3">
          <GradientButton onClick={() => { setShowAdd(true); setAddForm(emptyForm); setAddPreview(null) }}>
            <Plus className="h-4 w-4" />
            Add Item
          </GradientButton>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(168,85,247,0.15)', background: 'rgba(168,85,247,0.06)' }}>
              <th className="px-4 py-3 text-left font-medium">
                <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => { if (sortField === 'name') setSortAsc((v) => !v); else { setSortField('name'); setSortAsc(true) } }}>
                  Name
                  <ArrowUpDown className={cn('h-3 w-3', sortField === 'name' ? 'text-foreground' : 'opacity-40')} />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => { if (sortField === 'expiry') setSortAsc((v) => !v); else { setSortField('expiry'); setSortAsc(true) } }}>
                  Expiry Date
                  <ArrowUpDown className={cn('h-3 w-3', sortField === 'expiry' ? 'text-foreground' : 'opacity-40')} />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">Quantity</th>
              <th className="px-4 py-3 text-left font-medium">Unit</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No items yet. Add one above.
                </td>
              </tr>
            )}
            {sorted.map((item) => {
              const meta = expiryMeta(item)
              return (
                <tr
                  key={item.id}
                  onClick={() => openDetail(item)}
                  className={cn(
                    'cursor-pointer border-b last:border-0 transition-colors hover:bg-[rgba(168,85,247,0.06)]',
                    rowBg(item)
                  )}
                  style={{ borderColor: 'rgba(168,85,247,0.1)' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#e0c4ff' }}>{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.expirationDate ? (
                      <span className="flex items-center gap-2">
                        {format(new Date(item.expirationDate), 'PP')}
                        {meta && <span className={cn('text-xs font-medium', meta.className)}>{meta.label}</span>}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.unit ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#e0c4ff' }}>{selectedItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Image */}
            <div
              className="relative h-52 w-full cursor-pointer overflow-hidden rounded-xl"
              onClick={() => detailFileRef.current?.click()}
            >
              {detailPreview ? (
                <Image src={detailPreview} alt="item" fill className="object-cover" unoptimized />
              ) : (
                <WarmEarthyPlaceholder />
              )}
              <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 transition-opacity hover:opacity-100 bg-black/20">
                <span className="flex items-center gap-1 rounded-md bg-black/60 px-3 py-1 text-xs text-white">
                  {detailUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                  {detailUploading ? 'Uploading…' : 'Change photo'}
                </span>
              </div>
            </div>
            <input
              ref={detailFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage(
                  file,
                  setDetailUploading,
                  setDetailPreview,
                  (url) => updateDetail('imageUrl', url),
                )
                e.target.value = ''
              }}
            />

            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={detailForm.name ?? ''} onChange={(e) => updateDetail('name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={detailForm.expirationDate ?? ''}
                onChange={(e) => updateDetail('expirationDate', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={detailForm.quantity ?? 1}
                  onChange={(e) => updateDetail('quantity', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Input
                  placeholder="e.g. kg, pcs"
                  value={detailForm.unit ?? ''}
                  onChange={(e) => updateDetail('unit', e.target.value ?? null)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" disabled={detailSaving || detailUploading} onClick={handleDetailSave}>
                {detailSaving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => { setDeleteItem(selectedItem); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) { setShowAdd(false); setAddPreview(null) } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4">
            <div className="shrink-0 space-y-1">
              <Label>Photo</Label>
              <div
                className="relative h-28 w-28 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed"
                style={{ borderColor: 'rgba(168,85,247,0.3)' }}
                onClick={() => addFileRef.current?.click()}
              >
                {addPreview ? (
                  <Image src={addPreview} alt="preview" fill className="object-cover" unoptimized />
                ) : (
                  <WarmEarthyPlaceholder />
                )}
                <div className="absolute inset-0 flex items-end justify-center pb-1.5 opacity-0 transition-opacity hover:opacity-100 bg-black/20">
                  <span className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
                    {addUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                    {addUploading ? 'Uploading…' : 'Add'}
                  </span>
                </div>
              </div>
              <input
                ref={addFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImage(
                    file,
                    setAddUploading,
                    setAddPreview,
                    (url) => updateAdd('imageUrl', url),
                  )
                  e.target.value = ''
                }}
              />
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input value={addForm.name ?? ''} onChange={(e) => updateAdd('name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Expiry Date *</Label>
                <Input
                  type="date"
                  value={addForm.expirationDate ?? ''}
                  onChange={(e) => updateAdd('expirationDate', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={addForm.quantity ?? 1}
                    onChange={(e) => updateAdd('quantity', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Unit *</Label>
                  <Input
                    placeholder="e.g. kg, pcs"
                    value={addForm.unit ?? ''}
                    onChange={(e) => updateAdd('unit', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setAddPreview(null) }}>Cancel</Button>
            <Button disabled={addSaving || addUploading || !addForm.name || !addForm.expirationDate || addForm.quantity == null || !addForm.unit} onClick={handleAdd}>
              {addSaving ? 'Saving…' : 'Add'}
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
