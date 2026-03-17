'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { HighscoreCategory, HighscoreItem } from '@/lib/db/schema'
import { PageTitle } from '@/components/PageTitle'
import { GradientButton } from '@/components/GradientButton'
import { WarmEarthyPlaceholder } from '@/components/WarmEarthyPlaceholder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, FolderPlus, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  initialCategories: HighscoreCategory[]
  initialItems: HighscoreItem[]
}

export function HighscoresBoard({ initialCategories, initialItems }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [items, setItems] = useState(initialItems)
  const [activeCat, setActiveCat] = useState<HighscoreCategory | null>(initialCategories[0] ?? null)

  // add category
  const [showAddCat, setShowAddCat] = useState(false)
  const [catName, setCatName] = useState('')
  const [catSaving, setCatSaving] = useState(false)

  // add item
  const [showAddItem, setShowAddItem] = useState(false)
  const [addForm, setAddForm] = useState({ title: '', description: '', location: '', imageUrl: '' })
  const [addPreview, setAddPreview] = useState<string | null>(null)
  const [addUploading, setAddUploading] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const addFileRef = useRef<HTMLInputElement>(null)

  // detail
  const [selected, setSelected] = useState<HighscoreItem | null>(null)
  const [detailForm, setDetailForm] = useState({ title: '', description: '', location: '', imageUrl: '' })
  const [detailPreview, setDetailPreview] = useState<string | null>(null)
  const [detailUploading, setDetailUploading] = useState(false)
  const [detailSaving, setDetailSaving] = useState(false)
  const [deleteItem, setDeleteItem] = useState<HighscoreItem | null>(null)
  const detailFileRef = useRef<HTMLInputElement>(null)

  const visibleItems = items.filter((i) => i.categoryId === activeCat?.id)

  async function uploadImage(file: File, setUploading: (v: boolean) => void, onDone: (url: string) => void) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/highscores/upload', { method: 'POST', body: fd })
    if (res.ok) { const { url } = await res.json(); onDone(url) }
    setUploading(false)
  }

  const handleAddCat = useCallback(async () => {
    if (!catName.trim()) return
    setCatSaving(true)
    const res = await fetch('/api/highscores/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName.trim() }),
    })
    if (res.ok) {
      const cat: HighscoreCategory = await res.json()
      setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
      setActiveCat(cat)
      setShowAddCat(false)
      setCatName('')
    }
    setCatSaving(false)
  }, [catName])

  const handleAddItem = useCallback(async () => {
    if (!activeCat || !addForm.title || !addForm.location) return
    setAddSaving(true)
    const res = await fetch('/api/highscores/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, categoryId: activeCat.id }),
    })
    if (res.ok) {
      const item: HighscoreItem = await res.json()
      setItems((prev) => [item, ...prev])
      setShowAddItem(false)
      setAddForm({ title: '', description: '', location: '', imageUrl: '' })
      setAddPreview(null)
    }
    setAddSaving(false)
  }, [activeCat, addForm])

  const handleDetailSave = useCallback(async () => {
    if (!selected) return
    setDetailSaving(true)
    const res = await fetch(`/api/highscores/items/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detailForm),
    })
    if (res.ok) {
      const updated: HighscoreItem = await res.json()
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      setSelected(null)
    }
    setDetailSaving(false)
  }, [selected, detailForm])

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return
    await fetch(`/api/highscores/items/${deleteItem.id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== deleteItem.id))
    setDeleteItem(null)
    setSelected(null)
  }, [deleteItem])

  function openDetail(item: HighscoreItem) {
    setSelected(item)
    setDetailForm({ title: item.title, description: item.description ?? '', location: item.location, imageUrl: item.imageUrl ?? '' })
    setDetailPreview(item.imageUrl ?? null)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle>Highscores</PageTitle>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            className="gap-1.5 border-[rgba(168,85,247,0.4)] text-[#9b78c9] hover:bg-[rgba(168,85,247,0.08)] hover:text-[#f472b6]"
            onClick={() => setShowAddCat(true)}
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New Category</span>
          </Button>
          {activeCat && (
            <GradientButton onClick={() => { setAddForm({ title: '', description: '', location: '', imageUrl: '' }); setAddPreview(null); setShowAddItem(true) }}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Item</span>
            </GradientButton>
          )}
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat)}
              className={cn('rounded-full px-4 py-1 text-sm font-medium transition-all', activeCat?.id === cat.id
                ? 'text-white'
                : 'text-muted-foreground hover:text-foreground')}
              style={activeCat?.id === cat.id ? {
                background: 'linear-gradient(110deg, #f472b6 0%, #a855f7 45%, #60a5fa 100%)',
                boxShadow: '0 0 10px rgba(168,85,247,0.4)',
              } : { background: 'rgba(168,85,247,0.1)' }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Items grid */}
      {categories.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No categories yet. Create one to get started.</p>
      ) : visibleItems.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No items in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => openDetail(item)}
              className="flex flex-col overflow-hidden rounded-xl border text-left transition-all hover:shadow-lg"
              style={{ borderColor: 'rgba(168,85,247,0.2)', background: '#120820' }}
            >
              <div className="relative h-36 w-full shrink-0">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized />
                ) : (
                  <WarmEarthyPlaceholder />
                )}
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <p className="truncate text-sm font-semibold" style={{ color: '#e0c4ff' }}>{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.location}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#e0c4ff' }}>{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="relative h-52 w-full cursor-pointer overflow-hidden rounded-xl" onClick={() => detailFileRef.current?.click()}>
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
            <input ref={detailFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadImage(file, setDetailUploading, (url) => { setDetailPreview(url); setDetailForm((f) => ({ ...f, imageUrl: url })) })
              e.target.value = ''
            }} />
            <div className="space-y-1"><Label>Title</Label><Input value={detailForm.title} onChange={(e) => setDetailForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Location</Label><Input value={detailForm.location} onChange={(e) => setDetailForm((f) => ({ ...f, location: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea rows={4} value={detailForm.description} onChange={(e) => setDetailForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" disabled={detailSaving || detailUploading || !detailForm.title || !detailForm.location || !detailForm.description} onClick={handleDetailSave}>
                {detailSaving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteItem(selected)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add item dialog */}
      <Dialog open={showAddItem} onOpenChange={(o) => !o && setShowAddItem(false)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Add to {activeCat?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4">
            <div className="shrink-0 space-y-1">
              <Label>Photo</Label>
              <div
                className="relative h-28 w-28 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed"
                style={{ borderColor: 'rgba(168,85,247,0.3)' }}
                onClick={() => addFileRef.current?.click()}
              >
                {addPreview ? <Image src={addPreview} alt="preview" fill className="object-cover" unoptimized /> : <WarmEarthyPlaceholder />}
                <div className="absolute inset-0 flex items-end justify-center pb-1.5 opacity-0 transition-opacity hover:opacity-100 bg-black/20">
                  <span className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
                    {addUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                    {addUploading ? 'Uploading…' : 'Add'}
                  </span>
                </div>
              </div>
              <input ref={addFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage(file, setAddUploading, (url) => { setAddPreview(url); setAddForm((f) => ({ ...f, imageUrl: url })) })
                e.target.value = ''
              }} />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <div className="space-y-1"><Label>Title *</Label><Input value={addForm.title} onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Location *</Label><Input value={addForm.location} onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>Cancel</Button>
            <Button disabled={addSaving || addUploading || !addForm.title || !addForm.location} onClick={handleAddItem}>
              {addSaving ? 'Saving…' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add category dialog */}
      <Dialog open={showAddCat} onOpenChange={(o) => !o && setShowAddCat(false)}>
        <DialogContent className="sm:max-w-[340px]">
          <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
          <div className="space-y-1"><Label>Name *</Label><Input value={catName} onChange={(e) => setCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCat()} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCat(false)}>Cancel</Button>
            <Button disabled={catSaving || !catName.trim()} onClick={handleAddCat}>{catSaving ? 'Saving…' : 'Create'}</Button>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
