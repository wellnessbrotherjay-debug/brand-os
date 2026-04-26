"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Search, Package, Maximize2, Weight } from "lucide-react"
import MainLayout from "@/components/MainLayout"
import { NexusCard } from "@/components/ui/NexusCard"
import { NexusButton } from "@/components/ui/NexusButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type EquipmentRecord = {
  id?: string
  equipment_name: string
  category: string | null
  size_length: number | null
  size_width: number | null
  size_height: number | null
  weight: number | null
  required_space: number | null
  image_url: string | null
}

const CATEGORIES = ["Strength", "Cardio", "Functional", "Recovery", "Studio A", "Studio B", "Other"]

export default function EquipmentLibraryAdminPage() {
  const [rows, setRows] = useState<EquipmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingItem, setEditingItem] = useState<EquipmentRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/equipment-library")
      const data = await response.json()
      if (!response.ok) throw new Error("Unable to load equipment")
      setRows(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    
    try {
      const response = await fetch("/api/admin/equipment-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      })
      if (!response.ok) throw new Error("Failed to save item")
      setIsDialogOpen(false)
      fetchRows()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return
    try {
      const response = await fetch(`/api/admin/equipment-library?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete equipment")
      fetchRows()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredRows = rows.filter(row => 
    row.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout title="Equipment Inventory" subtitle="Asset Control">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or category..." 
              className="pl-10 bg-black/20 border-white/10 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <NexusButton className="gap-2" onClick={() => setEditingItem({
                equipment_name: "",
                category: "Strength",
                size_length: null,
                size_width: null,
                size_height: null,
                weight: null,
                required_space: null,
                image_url: ""
              })}>
                <Plus className="h-4 w-4" /> Add Equipment
              </NexusButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif italic tracking-wide">
                  {editingItem?.id ? "Modify Equipment" : "Register Equipment"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="grid gap-5 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="eq-name">Equipment Name</Label>
                  <Input 
                    id="eq-name" 
                    value={editingItem?.equipment_name || ""} 
                    onChange={e => setEditingItem(p => ({ ...p!, equipment_name: e.target.value }))}
                    className="bg-black/30 border-white/10"
                    placeholder="e.g., Rogue Adjustable Bench"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="eq-cat">Category</Label>
                  <Select 
                    value={editingItem?.category || "Strength"} 
                    onValueChange={v => setEditingItem(p => ({ ...p!, category: v }))}
                  >
                    <SelectTrigger className="bg-black/30 border-white/10">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-white/10 text-white">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                    <Label className="flex items-center gap-2"><Weight className="h-3 w-3" /> Weight (kg)</Label>
                    <Input 
                      type="number"
                      value={editingItem?.weight || ""} 
                      onChange={e => setEditingItem(p => ({ ...p!, weight: parseFloat(e.target.value) }))}
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2"><Maximize2 className="h-3 w-3" /> Space (sqm)</Label>
                    <Input 
                      type="number"
                      value={editingItem?.required_space || ""} 
                      onChange={e => setEditingItem(p => ({ ...p!, required_space: parseFloat(e.target.value) }))}
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <NexusButton variant="ghost" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</NexusButton>
                  <NexusButton type="submit">Save Asset</NexusButton>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Equipment Table */}
        <NexusCard className="overflow-hidden border-white/10 bg-black/40 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                <tr>
                  <th className="px-6 py-4">Asset Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Specs</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">Inventory syncing...</td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No equipment found.</td></tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-white/5 rounded-lg">
                             <Package className="h-4 w-4 text-cyan-400" />
                           </div>
                           <span className="font-semibold text-white">{row.equipment_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 uppercase text-[10px] tracking-widest text-emerald-400 font-bold">
                        {row.category}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-xs">
                        {row.weight ? `${row.weight}kg` : '-'} • {row.required_space ? `${row.required_space}m²` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingItem(row)
                              setIsDialogOpen(true)
                            }}
                            className="p-1 px-2 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(row.id!)}
                            className="p-1 px-2 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </NexusCard>
      </div>
    </MainLayout>
  )
}
