'use client'

import { useState, useCallback } from 'react'
import { WishlistItem, NewWishlistItem } from '@/lib/db/schema'
import { PageTitle } from '@/components/PageTitle'
import { GradientButton } from '@/components/GradientButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
import { Plus, Trash2 } from 'lucide-react'

const OWNERS = ['natalia', 'oskar'] as const
type Owner = typeof OWNERS[number]

const ownerGradient: Record<Owner, string> = {
  natalia: 'linear-gradient(110deg, #f472b6 0%, #e879a0 100%)',
  oskar:   'linear-gradient(110deg, #818cf8 0%, #60a5fa 100%)',
}

const ownerGlow: Record<Owner, string> = {
  natalia: 'rgba(244,114,182,0.5)',
  oskar:   'rgba(129,140,248,0.5)',
}

interface WishlistBoardProps {
  initialItems: WishlistItem[]
}

function ColumnHeader({ owner }: { owner: Owner }) {
  return (
    <h2
      className="text-2xl font-bold tracking-tight"
      style={{
        fontFamily: 'var(--font-space-mono), monospace',
        background: ownerGradient[owner],
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: `drop-shadow(0 0 8px ${ownerGlow[owner]})`,
        textTransform: 'capitalize',
      }}
    >
      {owner}
    </h2>
  )
}

function ItemCard({ item, onClick }: { item: WishlistItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border p-3 text-left transition-all hover:shadow-md"
      style={{ borderColor: 'rgba(168,85,247,0.2)', background: '#120820' }}
    >
      <p className="text-sm font-medium leading-snug" style={{ color: '#e0c4ff' }}>{item.title}</p>
      {item.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
      )}
    </button>
  )
}

export function WishlistBoard({ initialItems }: WishlistBoardProps) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems)
  const [selected, setSelected] = useState<WishlistItem | null>(null)
  const [detailForm, setDetailForm] = useState<{ title: string; description: string }>({ title: '', description: '' })
  const [detailSaving, setDetailSaving] = useState(false)
  const [deleteItem, setDeleteItem] = useState<WishlistItem | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [addOwner, setAddOwner] = useState<Owner>('natalia')
  const [addForm, setAddForm] = useState({ title: '', description: '' })
  const [addSaving, setAddSaving] = useState(false)

  function openDetail(item: WishlistItem) {
    setSelected(item)
    setDetailForm({ title: item.title, description: item.description ?? '' })
  }

  function openAdd(owner: Owner) {
    setAddOwner(owner)
    setAddForm({ title: '', description: '' })
    setShowAdd(true)
  }

  const handleAdd = useCallback(async () => {
    if (!addForm.title) return
    setAddSaving(true)
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, owner: addOwner }),
    })
    if (res.ok) {
      const item: WishlistItem = await res.json()
      setItems((prev) => [item, ...prev])
      setShowAdd(false)
    }
    setAddSaving(false)
  }, [addForm, addOwner])

  const handleDetailSave = useCallback(async () => {
    if (!selected) return
    setDetailSaving(true)
    const res = await fetch(`/api/wishlist/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detailForm),
    })
    if (res.ok) {
      const updated: WishlistItem = await res.json()
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      setSelected(null)
    }
    setDetailSaving(false)
  }, [selected, detailForm])

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return
    await fetch(`/api/wishlist/${deleteItem.id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== deleteItem.id))
    setDeleteItem(null)
    setSelected(null)
  }, [deleteItem])

  return (
    <div className="flex h-full flex-col gap-4">
      <PageTitle>Wishlist</PageTitle>

      <div className="grid flex-1 grid-cols-2 gap-6 overflow-hidden">
        {OWNERS.map((owner) => (
          <div key={owner} className="flex flex-col gap-3 overflow-hidden rounded-xl border p-4"
            style={{ borderColor: 'rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.04)' }}>
            <div className="flex items-center justify-between">
              <ColumnHeader owner={owner} />
              <GradientButton onClick={() => openAdd(owner)}>
                <Plus className="h-4 w-4" />
                Add
              </GradientButton>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto">
              {items.filter((i) => i.owner === owner).length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">Nothing here yet.</p>
              )}
              {items
                .filter((i) => i.owner === owner)
                .map((item) => (
                  <ItemCard key={item.id} item={item} onClick={() => openDetail(item)} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[420px] overflow-y-auto sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle style={{ color: '#e0c4ff' }}>{selected?.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={detailForm.title} onChange={(e) => setDetailForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Description / URL</Label>
              <Textarea
                rows={5}
                value={detailForm.description}
                onChange={(e) => setDetailForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" disabled={detailSaving || !detailForm.title} onClick={handleDetailSave}>
                {detailSaving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteItem(selected)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              Add to{' '}
              <span style={{ background: ownerGradient[addOwner], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textTransform: 'capitalize' }}>
                {addOwner}
              </span>
              's wishlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={addForm.title} onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Description / URL</Label>
              <Textarea
                rows={4}
                placeholder="What is it? Add a link if you have one."
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button disabled={addSaving || !addForm.title} onClick={handleAdd}>
              {addSaving ? 'Saving…' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteItem?.title}&rdquo;?</AlertDialogTitle>
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
