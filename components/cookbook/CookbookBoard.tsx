'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Recipe } from '@/lib/db/schema'
import { PageTitle } from '@/components/PageTitle'
import { GradientButton } from '@/components/GradientButton'
import { WarmEarthyPlaceholder } from '@/components/WarmEarthyPlaceholder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Ingredient = { name: string; amount: string; unit: string }
type RecipeLabel = 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'dessert' | 'snack' | 'drink' | 'other'
type ParsedRecipe = Omit<Recipe, 'ingredients'> & { ingredients: Ingredient[] }

const LABELS: RecipeLabel[] = ['breakfast', 'brunch', 'lunch', 'dinner', 'dessert', 'snack', 'drink', 'other']

const LABEL_COLORS: Record<RecipeLabel, string> = {
  breakfast: '#f59e0b',
  brunch:    '#f472b6',
  lunch:     '#22c55e',
  dinner:    '#60a5fa',
  dessert:   '#a855f7',
  snack:     '#eab308',
  drink:     '#14b8a6',
  other:     '#6b7280',
}

const LABEL_DISPLAY: Record<RecipeLabel, string> = {
  breakfast: 'Breakfast',
  brunch:    'Brunch',
  lunch:     'Lunch',
  dinner:    'Dinner',
  dessert:   'Dessert',
  snack:     'Snack',
  drink:     'Drink',
  other:     'Other',
}

type MacroForm = { calories: string; protein: string; fat: string; sugar: string; fiber: string }
type RecipeForm = {
  title: string
  description: string
  label: RecipeLabel
  portionCount: number
  imageUrl: string
  ingredients: Ingredient[]
  macros: MacroForm
}

const emptyMacros = (): MacroForm => ({ calories: '', protein: '', fat: '', sugar: '', fiber: '' })
const emptyForm = (): RecipeForm => ({ title: '', description: '', label: 'other', portionCount: 2, imageUrl: '', ingredients: [], macros: emptyMacros() })

function recipeToForm(r: ParsedRecipe): RecipeForm {
  return {
    title: r.title,
    description: r.description ?? '',
    label: r.label as RecipeLabel,
    portionCount: r.portionCount,
    imageUrl: r.imageUrl ?? '',
    ingredients: r.ingredients,
    macros: {
      calories: r.calories?.toString() ?? '',
      protein:  r.protein?.toString() ?? '',
      fat:      r.fat?.toString() ?? '',
      sugar:    r.sugar?.toString() ?? '',
      fiber:    r.fiber?.toString() ?? '',
    },
  }
}

function formToPayload(form: RecipeForm) {
  return {
    title:       form.title,
    description: form.description || null,
    label:       form.label,
    portionCount: form.portionCount,
    imageUrl:    form.imageUrl || null,
    ingredients: form.ingredients,
    calories: form.macros.calories ? Number(form.macros.calories) : null,
    protein:  form.macros.protein  ? Number(form.macros.protein)  : null,
    fat:      form.macros.fat      ? Number(form.macros.fat)      : null,
    sugar:    form.macros.sugar    ? Number(form.macros.sugar)    : null,
    fiber:    form.macros.fiber    ? Number(form.macros.fiber)    : null,
  }
}

interface Props {
  initialRecipes: ParsedRecipe[]
}

export function CookbookBoard({ initialRecipes }: Props) {
  const [recipes, setRecipes] = useState(initialRecipes)
  const [hiddenLabels, setHiddenLabels] = useState<Set<RecipeLabel>>(new Set())

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<RecipeForm>(emptyForm())
  const [addPreview, setAddPreview] = useState<string | null>(null)
  const [addUploading, setAddUploading] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const addFileRef = useRef<HTMLInputElement>(null)

  const [selected, setSelected] = useState<ParsedRecipe | null>(null)
  const [detailForm, setDetailForm] = useState<RecipeForm>(emptyForm())
  const [detailPreview, setDetailPreview] = useState<string | null>(null)
  const [detailUploading, setDetailUploading] = useState(false)
  const [detailSaving, setDetailSaving] = useState(false)
  const [deleteItem, setDeleteItem] = useState<ParsedRecipe | null>(null)
  const detailFileRef = useRef<HTMLInputElement>(null)

  const visible = recipes.filter(r => !hiddenLabels.has(r.label as RecipeLabel))

  async function uploadImage(file: File, setUploading: (v: boolean) => void, onDone: (url: string) => void) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/cookbook/upload', { method: 'POST', body: fd })
    if (res.ok) { const { url } = await res.json(); onDone(url) }
    setUploading(false)
  }

  const handleAdd = useCallback(async () => {
    if (!addForm.title) return
    setAddSaving(true)
    const res = await fetch('/api/cookbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToPayload(addForm)),
    })
    if (res.ok) {
      const recipe: ParsedRecipe = await res.json()
      setRecipes(prev => [recipe, ...prev])
      setShowAdd(false)
      setAddForm(emptyForm())
      setAddPreview(null)
    }
    setAddSaving(false)
  }, [addForm])

  const handleDetailSave = useCallback(async () => {
    if (!selected) return
    setDetailSaving(true)
    const res = await fetch(`/api/cookbook/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToPayload(detailForm)),
    })
    if (res.ok) {
      const updated: ParsedRecipe = await res.json()
      setRecipes(prev => prev.map(r => r.id === updated.id ? updated : r))
      setSelected(null)
    }
    setDetailSaving(false)
  }, [selected, detailForm])

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return
    await fetch(`/api/cookbook/${deleteItem.id}`, { method: 'DELETE' })
    setRecipes(prev => prev.filter(r => r.id !== deleteItem.id))
    setDeleteItem(null)
    setSelected(null)
  }, [deleteItem])

  function openDetail(recipe: ParsedRecipe) {
    setSelected(recipe)
    setDetailForm(recipeToForm(recipe))
    setDetailPreview(recipe.imageUrl ?? null)
  }

  function updateIngredient(
    setter: React.Dispatch<React.SetStateAction<RecipeForm>>,
    idx: number, field: keyof Ingredient, value: string,
  ) {
    setter(f => ({ ...f, ingredients: f.ingredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing) }))
  }

  function removeIngredient(setter: React.Dispatch<React.SetStateAction<RecipeForm>>, idx: number) {
    setter(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }))
  }

  function addIngredient(setter: React.Dispatch<React.SetStateAction<RecipeForm>>) {
    setter(f => ({ ...f, ingredients: [...f.ingredients, { name: '', amount: '', unit: '' }] }))
  }

  function IngredientsEditor({ form, setForm }: { form: RecipeForm; setForm: React.Dispatch<React.SetStateAction<RecipeForm>> }) {
    return (
      <div className="space-y-2">
        <Label>Ingredients</Label>
        {form.ingredients.map((ing, idx) => (
          <div key={idx} className="flex gap-2">
            <Input placeholder="Ingredient" value={ing.name} onChange={e => updateIngredient(setForm, idx, 'name', e.target.value)} className="flex-1" />
            <Input placeholder="Amt" value={ing.amount} onChange={e => updateIngredient(setForm, idx, 'amount', e.target.value)} className="w-16" />
            <Input placeholder="Unit" value={ing.unit} onChange={e => updateIngredient(setForm, idx, 'unit', e.target.value)} className="w-16" />
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeIngredient(setForm, idx)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addIngredient(setForm)}>
          <Plus className="h-3 w-3" /> Add ingredient
        </Button>
      </div>
    )
  }

  function MacrosEditor({ form, setForm }: { form: RecipeForm; setForm: React.Dispatch<React.SetStateAction<RecipeForm>> }) {
    const fields: { key: keyof MacroForm; label: string }[] = [
      { key: 'calories', label: 'Calories (kcal)' },
      { key: 'protein',  label: 'Protein (g)' },
      { key: 'fat',      label: 'Fat (g)' },
      { key: 'sugar',    label: 'Sugar (g)' },
      { key: 'fiber',    label: 'Fiber (g)' },
    ]
    return (
      <div className="space-y-2">
        <Label>Macros per portion <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {fields.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                type="number" min={0}
                value={form.macros[key]}
                onChange={e => setForm(f => ({ ...f, macros: { ...f.macros, [key]: e.target.value } }))}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageTitle>Cookbook</PageTitle>
        <GradientButton onClick={() => { setAddForm(emptyForm()); setAddPreview(null); setShowAdd(true) }}>
          <Plus className="h-4 w-4" />
          Add Recipe
        </GradientButton>
      </div>

      {/* Label filter pills — all on by default, click to hide */}
      <div className="flex flex-wrap gap-2">
        {LABELS.map(label => {
          const hidden = hiddenLabels.has(label)
          return (
            <button
              key={label}
              onClick={() => setHiddenLabels(prev => {
                const next = new Set(prev)
                hidden ? next.delete(label) : next.add(label)
                return next
              })}
              className={cn('rounded-full px-4 py-1 text-sm font-medium transition-all', hidden ? 'text-muted-foreground line-through' : 'text-white')}
              style={hidden
                ? { background: 'rgba(168,85,247,0.1)' }
                : { background: LABEL_COLORS[label], boxShadow: `0 0 10px ${LABEL_COLORS[label]}99` }}
            >
              {LABEL_DISPLAY[label]}
            </button>
          )
        })}
      </div>

      {/* Recipe grid */}
      {visible.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No recipes yet. Add one to get started.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map(recipe => (
            <button
              key={recipe.id}
              onClick={() => openDetail(recipe)}
              className="flex flex-col overflow-hidden rounded-xl border text-left transition-all hover:shadow-lg"
              style={{ borderColor: 'rgba(168,85,247,0.2)', background: '#120820' }}
            >
              <div className="relative h-36 w-full shrink-0">
                {recipe.imageUrl ? (
                  <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" unoptimized />
                ) : (
                  <WarmEarthyPlaceholder />
                )}
                <span
                  className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ background: LABEL_COLORS[recipe.label as RecipeLabel] }}
                >
                  {LABEL_DISPLAY[recipe.label as RecipeLabel]}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <p className="truncate text-sm font-semibold" style={{ color: '#e0c4ff' }}>{recipe.title}</p>
                <p className="text-xs text-muted-foreground">{recipe.portionCount} portion{recipe.portionCount !== 1 ? 's' : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail / edit dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#e0c4ff' }}>{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {/* Photo */}
            <div className="relative h-52 w-full cursor-pointer overflow-hidden rounded-xl" onClick={() => detailFileRef.current?.click()}>
              {detailPreview ? (
                <Image src={detailPreview} alt="recipe" fill className="object-cover" unoptimized />
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
            <input ref={detailFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0]
              if (file) uploadImage(file, setDetailUploading, url => { setDetailPreview(url); setDetailForm(f => ({ ...f, imageUrl: url })) })
              e.target.value = ''
            }} />

            {/* Core fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Title *</Label>
                <Input value={detailForm.title} onChange={e => setDetailForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Label *</Label>
                <select
                  value={detailForm.label}
                  onChange={e => setDetailForm(f => ({ ...f, label: e.target.value as RecipeLabel }))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  style={{ borderColor: 'rgba(168,85,247,0.3)', color: '#e0c4ff' }}
                >
                  {LABELS.map(l => <option key={l} value={l}>{LABEL_DISPLAY[l]}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Portions *</Label>
                <Input type="number" min={1} value={detailForm.portionCount} onChange={e => setDetailForm(f => ({ ...f, portionCount: Number(e.target.value) }))} />
              </div>
            </div>

            <IngredientsEditor form={detailForm} setForm={setDetailForm} />
            <MacrosEditor form={detailForm} setForm={setDetailForm} />

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={3} value={detailForm.description} onChange={e => setDetailForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" disabled={detailSaving || detailUploading || !detailForm.title} onClick={handleDetailSave}>
                {detailSaving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteItem(selected)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add recipe dialog */}
      <Dialog open={showAdd} onOpenChange={o => !o && setShowAdd(false)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              {/* Photo */}
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
                <input ref={addFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) uploadImage(file, setAddUploading, url => { setAddPreview(url); setAddForm(f => ({ ...f, imageUrl: url })) })
                  e.target.value = ''
                }} />
              </div>
              {/* Title + Label + Portions */}
              <div className="flex flex-1 flex-col gap-3">
                <div className="space-y-1">
                  <Label>Title *</Label>
                  <Input value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Label *</Label>
                  <select
                    value={addForm.label}
                    onChange={e => setAddForm(f => ({ ...f, label: e.target.value as RecipeLabel }))}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    style={{ borderColor: 'rgba(168,85,247,0.3)', color: '#e0c4ff' }}
                  >
                    {LABELS.map(l => <option key={l} value={l}>{LABEL_DISPLAY[l]}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Portions *</Label>
                  <Input type="number" min={1} value={addForm.portionCount} onChange={e => setAddForm(f => ({ ...f, portionCount: Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            <IngredientsEditor form={addForm} setForm={setAddForm} />
            <MacrosEditor form={addForm} setForm={setAddForm} />

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={2} value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button disabled={addSaving || addUploading || !addForm.title} onClick={handleAdd}>
              {addSaving ? 'Saving…' : 'Add Recipe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={o => !o && setDeleteItem(null)}>
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
