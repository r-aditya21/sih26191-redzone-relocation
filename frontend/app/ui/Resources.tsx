"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, Box, Download, HeartPulse, Plus, Search, SlidersHorizontal, Stethoscope, Tent, Truck, Users, UtensilsCrossed, Warehouse } from "lucide-react";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import { useApi } from "../../lib/useApi";
import { fetchSites } from "../../lib/api";

type Category = "Shelter" | "Medical" | "Food & Water" | "Transport" | "Personnel";
type Resource = { id: string; name: string; category: Category; site: string; district: string; stock: number; capacity: number; unit: string; status: "Adequate" | "Low" | "Critical" };

const resources: Resource[] = [
    { id: "R-101", name: "Prefab shelter units", category: "Shelter", site: "Site S-008, Dharasu", district: "Uttarkashi", stock: 980, capacity: 1350, unit: "units", status: "Adequate" },
    { id: "R-098", name: "Field medical camp", category: "Medical", site: "Site S-005, Guptkashi", district: "Rudraprayag", stock: 6, capacity: 10, unit: "beds", status: "Low" },
    { id: "R-087", name: "Ration kits (30-day)", category: "Food & Water", site: "Site S-012, Karnaprayag", district: "Chamoli", stock: 420, capacity: 1100, unit: "kits", status: "Critical" },
    { id: "R-076", name: "Off-road relief trucks", category: "Transport", site: "Regional depot, Rudraprayag", district: "Rudraprayag", stock: 9, capacity: 14, unit: "vehicles", status: "Low" },
    { id: "R-065", name: "NDRF response team", category: "Personnel", site: "Site S-011, Nandprayag", district: "Chamoli", stock: 22, capacity: 30, unit: "personnel", status: "Adequate" },
    { id: "R-054", name: "Water purification units", category: "Food & Water", site: "Site S-003, New Tehri", district: "Tehri Garhwal", stock: 14, capacity: 16, unit: "units", status: "Adequate" },
    { id: "R-043", name: "Trauma care staff", category: "Medical", site: "Site S-014, Joshimath East", district: "Chamoli", stock: 3, capacity: 12, unit: "staff", status: "Critical" },
    { id: "R-032", name: "Temporary storage warehouse", category: "Shelter", site: "Regional depot, Pithoragarh", district: "Pithoragarh", stock: 2, capacity: 4, unit: "warehouses", status: "Low" },
];

const catIcon: Record<Category, any> = { Shelter: Tent, Medical: Stethoscope, ["Food & Water"]: UtensilsCrossed, Transport: Truck, Personnel: Users };
const statusStyle = { Adequate: "bg-safe/10 text-safe", Low: "bg-amber-500/10 text-amber-600", Critical: "bg-danger/10 text-danger" };

export default function Resources({ onNavigate }: { onNavigate?: (view: string) => void }) {
    const { data: sites, loading, error } = useApi(fetchSites);
    const [mobileOpen, setMobileOpen] = useState(false), [selected, setSelected] = useState<Resource>(resources[0]), [category, setCategory] = useState("All"), [search, setSearch] = useState("");
    const filtered = useMemo(() => resources.filter(r => (category === "All" || r.category === category) && `${r.name} ${r.site} ${r.district}`.toLowerCase().includes(search.toLowerCase())), [category, search]);
    const counts = { Adequate: resources.filter(r => r.status === "Adequate").length, Low: resources.filter(r => r.status === "Low").length, Critical: resources.filter(r => r.status === "Critical").length };
    const matchedSite = useMemo(() => {
        if (!sites || !selected.site) return null;
        return sites.find(s => selected.site.toLowerCase().includes(s.site_id.toLowerCase()));
    }, [sites, selected]);

    return <div className="min-h-screen bg-surface">
        <AppHeader onOpenMobileNav={() => setMobileOpen(true)} />
        <div className="flex">
            <AppSidebar active="Resources" onNavigate={(v) => onNavigate?.(v)} mobileOpen={mobileOpen} onCloseMobileNav={() => setMobileOpen(false)} badges={{ Resources: resources.length }} />
            <main className="flex-1 min-w-0 p-4 md:p-7"><div className="max-w-[1500px] mx-auto">

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"><div><div className="text-xs text-muted mb-2">State Disaster Management Authority / Resources</div><h1 className="text-2xl md:text-3xl font-bold">Resource Inventory</h1><p className="text-sm text-muted mt-1">Shelter, medical, food, transport, and personnel stock against relocation demand.</p></div><div className="flex gap-2"><button className="px-4 py-2.5 bg-white border border-line rounded-xl text-sm flex gap-2 items-center"><Download size={16} />Export</button><button className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm flex gap-2 items-center"><Plus size={16} />Log resource</button></div></div>

                <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
                    {[["Tracked resources", resources.length, "Across 5 categories", Warehouse], ["Adequate", counts.Adequate, "Within safe threshold", Box], ["Low stock", counts.Low, "Needs replenishment soon", AlertTriangle], ["Critical", counts.Critical, "Immediate resupply needed", HeartPulse]].map(([t, v, s, I]: any) => <div key={t} className="bg-white border border-line rounded-2xl p-4 md:p-5 shadow-soft"><div className="flex justify-between"><span className="text-xs text-muted">{t}</span><div className="p-2 rounded-lg bg-forest/10 text-forest"><I size={17} /></div></div><div className="text-2xl font-bold mt-4">{v}</div><div className="text-[11px] text-muted mt-1">{s}</div></div>)}
                </section>

                <section className="grid xl:grid-cols-[1.55fr_.8fr] gap-5">

                    <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-soft">
                        <div className="p-4 md:p-5 border-b border-line flex flex-col md:flex-row gap-3 justify-between">
                            <div><h2 className="font-semibold">Resource directory</h2><p className="text-xs text-muted mt-1">{filtered.length} of {resources.length} resources shown</p></div>
                            <div className="flex flex-wrap gap-2">
                                <div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resource..." className="w-40 pl-9 pr-3 py-2 rounded-lg border border-line text-xs" /></div>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="border border-line rounded-lg px-2 text-xs bg-white"><option>All</option><option>Shelter</option><option>Medical</option><option>Food & Water</option><option>Transport</option><option>Personnel</option></select>
                                <button className="p-2 border border-line rounded-lg"><SlidersHorizontal size={15} /></button>
                            </div>
                        </div>

                        <div className="hidden md:grid grid-cols-[1.5fr_1.1fr_.9fr_1fr_.7fr] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[.1em] text-muted border-b border-line">
                            <span>Resource</span><span>Site</span><span>Stock</span><span>Level</span><span>Status</span>
                        </div>
                        {loading && <div className="px-5 py-2 text-xs text-muted animate-pulse border-b border-line">Syncing site telemetry from backend…</div>}
                        {error && <div className="px-5 py-2 text-xs text-amber-600 border-b border-line">⚠ Live site telemetry unavailable — showing cached data.</div>}
                        <div className="max-h-[480px] overflow-y-auto">
                            {filtered.map(r => {
                                const Icon = catIcon[r.category]; const pct = Math.min(100, (r.stock / r.capacity) * 100); return <button key={r.id} onClick={() => setSelected(r)} className={`w-full text-left grid md:grid-cols-[1.5fr_1.1fr_.9fr_1fr_.7fr] gap-3 items-center px-5 py-3 border-b border-line last:border-0 hover:bg-surface ${selected.id === r.id ? "bg-forest/5" : ""}`}>
                                    <div className="flex gap-2.5 items-start"><div className="p-1.5 rounded-lg bg-forest/10 text-forest mt-0.5"><Icon size={14} /></div><div><div className="text-sm font-semibold">{r.name}</div><div className="text-[10px] text-muted">{r.id} • {r.category}</div></div></div>
                                    <span className="text-xs">{r.site}</span>
                                    <span className="text-xs">{r.stock.toLocaleString()} / {r.capacity.toLocaleString()} {r.unit}</span>
                                    <div className="flex items-center gap-2"><div className="h-1.5 flex-1 bg-surface rounded-full overflow-hidden"><div className={`h-full rounded-full ${r.status === "Critical" ? "bg-danger" : r.status === "Low" ? "bg-amber-500" : "bg-forest"}`} style={{ width: `${pct}%` }} /></div><span className="text-[10px] text-muted w-8">{Math.round(pct)}%</span></div>
                                    <span className={`w-fit text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[r.status]}`}>{r.status}</span>
                                </button>
                            })}
                            {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted">No resources match your filters.</div>}
                        </div>
                    </div>

                    <div className="bg-white border border-line rounded-2xl shadow-soft p-5 h-fit">
                        <div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.15em] text-muted">Selected resource</div><h2 className="text-lg font-bold mt-1">{selected.name}</h2><p className="text-xs text-muted">{selected.id} • {selected.category}</p></div><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusStyle[selected.status]}`}>{selected.status}</span></div>

                        <div className="mt-4 p-3 rounded-xl bg-surface text-xs">
                            <div className="text-[10px] text-muted mb-1">Location</div>
                            <div className="font-semibold">{selected.site}</div>
                            <div className="text-muted mt-0.5">{selected.district}</div>
                            {matchedSite && (
                                <div className="mt-2 pt-2 border-t border-line/60 grid grid-cols-2 gap-2 text-[11px]">
                                    <div><span className="text-muted">Live Land:</span> <span className="font-medium">{matchedSite.available_land} ha</span></div>
                                    <div><span className="text-muted">Infra Access:</span> <span className="font-medium">{Math.round(matchedSite.infra_access * 100)}%</span></div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4"><div className="flex justify-between text-[10px] text-muted mb-1.5"><span>Stock level</span><span>{selected.stock.toLocaleString()} / {selected.capacity.toLocaleString()} {selected.unit}</span></div><div className="h-2 bg-surface rounded-full overflow-hidden"><div className={`h-full rounded-full ${selected.status === "Critical" ? "bg-danger" : selected.status === "Low" ? "bg-amber-500" : "bg-forest"}`} style={{ width: `${Math.min(100, (selected.stock / selected.capacity) * 100)}%` }} /></div></div>

                        <div className="grid grid-cols-2 gap-3 mt-4">{[["Current stock", selected.stock.toLocaleString()], ["Full capacity", selected.capacity.toLocaleString()], ["Unit", selected.unit], ["Shortfall", Math.max(0, selected.capacity - selected.stock).toLocaleString()]].map(x => <div key={x[0]} className="p-3 rounded-xl bg-surface"><div className="text-[10px] text-muted">{x[0]}</div><div className="font-bold mt-1">{x[1]}</div></div>)}</div>

                        <button className="w-full mt-4 py-2.5 bg-forest text-white rounded-xl text-sm">Request resupply</button>
                    </div>

                </section>
            </div></main></div></div>
}
