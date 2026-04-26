"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Plus, Edit2, Trash2, Video, Search, Package, Maximize2, Weight, PlayCircle, X } from "lucide-react"
import MainLayout from "@/components/MainLayout"
import { NexusCard } from "@/components/ui/NexusCard"
import { NexusButton } from "@/components/ui/NexusButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CloudflarePlayer from "@/components/CloudflarePlayer"

type ExerciseRecord = {
  id?: string
  exercise_name: string
  primary_muscle_group: string | null
  required_equipment: string | null
  difficulty_level: string | null
  intensity: string | null
  training_type: string | null
  video_url: string | null
  thumbnail_url: string | null
}

type EquipmentRecord = {
  id?: string
  equipment_name: string
  category: string | null
  weight: number | null
  required_space: number | null
}

const CATEGORIES = ["Bodyweight", "Dumbbell", "Barbell", "Bands", "Plate", "Kettlebell", "Sandbag", "Bench", "TRX", "BOSU", "Treadmill", "Bike", "Box"]
const MUSCLES = ["Biceps", "Triceps", "Shoulders", "Back", "Chest", "Quads", "Hamstrings", "Glutes", "Legs", "Core", "Full Body"]
const EQUIP_CATS = ["Strength", "Cardio", "Functional", "Recovery", "Studio A", "Studio B", "Other"]

export default function FullyStandaloneLibraryPage() {
  // Movement State
  const [rows, setRows] = useState<ExerciseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingExercise, setEditingExercise] = useState<ExerciseRecord | null>(null)
  const [isExerciseOpen, setIsExerciseOpen] = useState(false)
  
  // Equipment State
  const [assets, setAssets] = useState<EquipmentRecord[]>([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [assetSearch, setAssetSearch] = useState("")
  const [editingAsset, setEditingAsset] = useState<EquipmentRecord | null>(null)
  const [isAssetOpen, setIsAssetOpen] = useState(false)

  // Dynamic Equipment Options for the Movement Dialog
  const DYNAMIC_CATEGORIES = useMemo(() => {
    const list = assets.map(a => a.equipment_name)
    // Merge with defaults and remove duplicates
    const defaults = ["Bodyweight", "Dumbbell", "Barbell", "Bands", "Plate", "TRX", "BOSU"]
    return Array.from(new Set([...defaults, ...list])).sort()
  }, [assets])

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Get Direct Upload URL
      const res = await fetch("/api/admin/cloudflare/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      })
      
      const { uploadUrl, uid, error } = await res.json()
      if (error) throw new Error(error)

      // 2. Upload to Cloudflare
      const formData = new FormData()
      formData.append("file", file)
      
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) throw new Error("Cloudflare upload failed")

      // 3. Update State
      setEditingExercise(prev => prev ? { ...prev, video_url: uid } : null)
      alert("Successfully uploaded to Studio Cloud! The ID has been linked.")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Upload failed. Check Cloudflare credentials.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setAssetsLoading(true)
    try {
      const [exRes, eqRes] = await Promise.all([
        fetch("/api/admin/exercise-library"),
        fetch("/api/admin/equipment-library")
      ])
      const exData = await exRes.json()
      const eqData = await eqRes.json()
      setRows(Array.isArray(exData) ? exData : [])
      setAssets(Array.isArray(eqData) ? eqData : [])
    } catch (err) {
      console.error(err)
      setRows([])
      setAssets([])
    } finally {
      setLoading(false)
      setAssetsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch("/api/admin/exercise-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingExercise),
      })
      setIsExerciseOpen(false)
      fetchData()
    } catch (err) { alert("Error saving") }
  }

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch("/api/admin/equipment-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAsset),
      })
      setIsAssetOpen(false)
      fetchData()
    } catch (err) { alert("Error saving") }
  }

  const filteredExercises = rows.filter(r => 
    r.exercise_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.required_equipment?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAssets = assets.filter(a => 
    a.equipment_name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.category?.toLowerCase().includes(assetSearch.toLowerCase())
  )

  return (
    <MainLayout title="Asset & Movement Hub" subtitle="Admin Engine">
      <Tabs defaultValue="movements" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-black/40 border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="movements" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-white">Movements</TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white">Studio Assets</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
             <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
               <DialogContent className="max-w-4xl bg-black border-white/20 p-0 overflow-hidden">
                 <div className="aspect-video w-full">
                    {previewUrl && <CloudflarePlayer videoId={previewUrl} />}
                 </div>
               </DialogContent>
             </Dialog>
          </div>
        </div>

        <TabsContent value="movements" className="space-y-6 outline-none">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Find movements..." 
                className="pl-10 bg-black/20 border-white/10 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isExerciseOpen} onOpenChange={setIsExerciseOpen}>
              <DialogTrigger asChild>
                <NexusButton className="gap-2" onClick={() => setEditingExercise({
                  exercise_name: "",
                  primary_muscle_group: "Legs",
                  required_equipment: "Bodyweight",
                  difficulty_level: "Intermediate",
                  training_type: "Strength",
                  intensity: "Moderate",
                  video_url: "",
                  thumbnail_url: ""
                })}>
                  <Plus className="h-4 w-4" /> Add Movement
                </NexusButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-white/10 text-white shadow-2xl">
                <DialogHeader><DialogTitle className="text-2xl font-serif italic tracking-wide">Movement Profile</DialogTitle></DialogHeader>
                <form onSubmit={handleSaveExercise} className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label>Movement Name</Label>
                    <Input value={editingExercise?.exercise_name || ""} onChange={e => setEditingExercise(p => ({ ...p!, exercise_name: e.target.value }))} className="bg-black/30 border-white/10" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Equipment</Label>
                      <Select value={editingExercise?.required_equipment || "Bodyweight"} onValueChange={v => setEditingExercise(p => ({ ...p!, required_equipment: v }))}>
                        <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-neutral-800 text-white">{DYNAMIC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Muscle</Label>
                      <Select value={editingExercise?.primary_muscle_group || "Legs"} onValueChange={v => setEditingExercise(p => ({ ...p!, primary_muscle_group: v }))}>
                        <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-neutral-800 text-white">{MUSCLES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Video Asset</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={editingExercise?.video_url || ""} 
                        onChange={e => setEditingExercise(p => ({ ...p!, video_url: e.target.value }))} 
                        className="bg-black/30 border-white/10 flex-1" 
                        placeholder="Cloudflare ID" 
                      />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="video/*" 
                        className="hidden" 
                      />
                      <NexusButton 
                        type="button" 
                        variant="ghost" 
                        className="border border-white/10 bg-white/5 whitespace-nowrap"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploading ? "Uploading..." : "Record / Upload"}
                      </NexusButton>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <NexusButton variant="ghost" type="button" onClick={() => setIsExerciseOpen(false)}>Cancel</NexusButton>
                    <NexusButton type="submit">Save Movement</NexusButton>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <NexusCard className="overflow-hidden border-white/10 bg-black/40 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Movement</th>
                    <th className="px-6 py-4">Setup</th>
                    <th className="px-6 py-4">Muscle</th>
                    <th className="px-6 py-4">Preview</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">Syncing movements...</td></tr>
                  ) : filteredExercises.map((row) => (
                    <tr key={row.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">{row.exercise_name}</td>
                      <td className="px-6 py-4 uppercase text-[10px] tracking-widest text-[#C8A871]">{row.required_equipment}</td>
                      <td className="px-6 py-4 text-slate-300">{row.primary_muscle_group || <span className="text-red-400/50 italic text-[10px]">Unset</span>}</td>
                      <td className="px-6 py-4">
                        {row.video_url ? (
                          <button 
                            onClick={() => { setPreviewUrl(row.video_url); setIsPreviewOpen(true); }}
                            className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-[10px] font-bold hover:bg-emerald-400/20 transition"
                          >
                            <PlayCircle className="h-3.5 w-3.5" /> WATCH
                          </button>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">No Video</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingExercise(row); setIsExerciseOpen(true); }} className="p-1 px-2 text-xs bg-white/10 text-white rounded hover:bg-white/20">Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NexusCard>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6 outline-none">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Find studio assets..." 
                className="pl-10 bg-black/20 border-white/10 text-white"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
              />
            </div>
            
            <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
              <DialogTrigger asChild>
                <NexusButton className="gap-2" onClick={() => setEditingAsset({
                  equipment_name: "",
                  category: "Strength",
                  weight: 0,
                  required_space: 0
                })}>
                  <Plus className="h-4 w-4" /> Register Asset
                </NexusButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-white/10 text-white shadow-2xl">
                <DialogHeader><DialogTitle className="text-2xl font-serif italic tracking-wide">Asset Details</DialogTitle></DialogHeader>
                <form onSubmit={handleSaveAsset} className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label>Asset Name</Label>
                    <Input value={editingAsset?.equipment_name || ""} onChange={e => setEditingAsset(p => ({ ...p!, equipment_name: e.target.value }))} className="bg-black/30 border-white/10" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={editingAsset?.category || "Strength"} onValueChange={v => setEditingAsset(p => ({ ...p!, category: v }))}>
                      <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-neutral-800 text-white">{EQUIP_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                       <Label><Weight className="h-3 w-3 inline mr-1" /> Weight (kg)</Label>
                       <Input type="number" value={editingAsset?.weight || ""} onChange={e => setEditingAsset(p => ({ ...p!, weight: parseFloat(e.target.value) }))} className="bg-black/30 border-white/10" />
                     </div>
                     <div className="grid gap-2">
                       <Label><Maximize2 className="h-3 w-3 inline mr-1" /> Space (sqm)</Label>
                       <Input type="number" value={editingAsset?.required_space || ""} onChange={e => setEditingAsset(p => ({ ...p!, required_space: parseFloat(e.target.value) }))} className="bg-black/30 border-white/10" />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <NexusButton variant="ghost" type="button" onClick={() => setIsAssetOpen(false)}>Cancel</NexusButton>
                    <NexusButton type="submit">Complete Setup</NexusButton>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <NexusCard className="overflow-hidden border-white/10 bg-black/40 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Asset Name</th>
                    <th className="px-6 py-4">Group</th>
                    <th className="px-6 py-4">Specs</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {assetsLoading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">Inventory syncing...</td></tr>
                  ) : filteredAssets.map((row) => (
                    <tr key={row.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-cyan-400" />
                            <span className="font-semibold text-white">{row.equipment_name}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 uppercase text-[10px] tracking-widest text-emerald-400 font-bold">{row.category}</td>
                      <td className="px-6 py-4 text-slate-300 text-xs">{row.weight ? `${row.weight}kg` : '-'} • {row.required_space ? `${row.required_space}m²` : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingAsset(row); setIsAssetOpen(true); }} className="p-1 px-2 text-xs bg-white/10 text-white rounded hover:bg-white/20">Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NexusCard>
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}
