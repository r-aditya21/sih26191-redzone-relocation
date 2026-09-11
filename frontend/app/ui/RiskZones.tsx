"use client";
import {useMemo,useState} from "react";
import dynamic from "next/dynamic";
import {AlertTriangle,ChevronRight,Download,MapPinned,Plus,Search,Shield,SlidersHorizontal} from "lucide-react";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import { useApi } from "../../lib/useApi";
import { fetchZones, type Zone as ApiZone } from "../../lib/api";
const RiskMap=dynamic(()=>import("./RiskMap"),{ssr:false});

type Zone={id:string;name:string;district:string;risk:"Critical"|"High"|"Moderate";population:number;households:number;progress:number;hazard:string};
const staticZones:Zone[]=[
{id:"Z-014",name:"Bhagirathi Valley",district:"Uttarkashi",risk:"Critical",population:4821,households:1204,progress:78,hazard:"Landslide + flash flood"},
{id:"Z-022",name:"Mandakini Belt",district:"Rudraprayag",risk:"High",population:3290,households:846,progress:54,hazard:"Slope subsidence"},
{id:"Z-031",name:"Alaknanda Slope",district:"Chamoli",risk:"High",population:2745,households:702,progress:42,hazard:"Rockfall"},
{id:"Z-009",name:"Tehri Ridge",district:"Tehri Garhwal",risk:"Moderate",population:1930,households:511,progress:21,hazard:"Seasonal erosion"},
{id:"Z-017",name:"Pindar Basin",district:"Chamoli",risk:"Critical",population:3980,households:1012,progress:61,hazard:"Glacial lake outburst"},
{id:"Z-025",name:"Bhilangana Fringe",district:"Tehri Garhwal",risk:"High",population:2210,households:588,progress:33,hazard:"Landslide"},
{id:"Z-011",name:"Kali Ganga Bank",district:"Pithoragarh",risk:"Moderate",population:1540,households:402,progress:47,hazard:"Riverbank erosion"},
{id:"Z-006",name:"Dhauliganga Terrace",district:"Chamoli",risk:"Critical",population:2660,households:701,progress:29,hazard:"Debris flow"},
];

const riskStyle:Record<Zone["risk"],string>={Critical:"bg-danger/10 text-danger",High:"bg-orange-500/10 text-orange-600",Moderate:"bg-amber-500/10 text-amber-600"};

// Map backend risk_level (low/medium/high) to UI risk labels
function toUiRisk(level: string): Zone["risk"] {
  if (level === "high") return "Critical";
  if (level === "medium") return "High";
  return "Moderate";
}

export default function RiskZones({onNavigate}:{onNavigate?:(view:string)=>void}){
const { data: apiZones, loading, error } = useApi(fetchZones);

// Merge live API data over static seed; fallback to static if API unavailable
const zones: Zone[] = useMemo(() => {
  if (!apiZones || apiZones.length === 0) return staticZones;
  return apiZones.map((z: ApiZone, i: number) => ({
    id: z.zone_id,
    name: staticZones[i]?.name ?? z.zone_id,
    district: staticZones[i]?.district ?? "Unknown",
    risk: toUiRisk(z.risk_level),
    population: staticZones[i]?.population ?? 0,
    households: staticZones[i]?.households ?? 0,
    progress: staticZones[i]?.progress ?? 0,
    hazard: z.hazard_type,
  }));
}, [apiZones]);

const[mobileOpen,setMobileOpen]=useState(false),[selected,setSelected]=useState<Zone>(zones[0] ?? staticZones[0]),[filter,setFilter]=useState("All"),[district,setDistrict]=useState("All"),[search,setSearch]=useState("");
// FIX: this used to have an empty dependency array, so once live zones
// arrived from the API the district dropdown kept showing only the
// districts present in the very first render (usually the static seed).
const districts=useMemo(()=>["All",...Array.from(new Set(zones.map(z=>z.district)))],[zones]);
const filtered=useMemo(()=>zones.filter(z=>(filter==="All"||z.risk===filter)&&(district==="All"||z.district===district)&&`${z.name} ${z.district} ${z.id}`.toLowerCase().includes(search.toLowerCase())),[filter,district,search,zones]);
const counts={Critical:zones.filter(z=>z.risk==="Critical").length,High:zones.filter(z=>z.risk==="High").length,Moderate:zones.filter(z=>z.risk==="Moderate").length};

// FIX: selected zone could point at a stale/removed record once live
// zones replaced the static seed (e.g. the previously-selected id no
// longer exists in the new list). Fall back to the first visible zone.
const selectedZone = zones.find(z=>z.id===selected.id) ?? zones[0] ?? staticZones[0];

return <div className="min-h-screen bg-surface">
<AppHeader onOpenMobileNav={()=>setMobileOpen(true)}/>
<div className="flex">
<AppSidebar active="Risk Zones" onNavigate={(v)=>onNavigate?.(v)} mobileOpen={mobileOpen} onCloseMobileNav={()=>setMobileOpen(false)} badges={{"Risk Zones":zones.length}}/>
<main className="flex-1 min-w-0 p-4 md:p-7"><div className="max-w-[1500px] mx-auto">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"><div><div className="text-xs text-muted mb-2">State Disaster Management Authority / Risk Zones</div><h1 className="text-2xl md:text-3xl font-bold">Risk Zone Registry</h1><p className="text-sm text-muted mt-1">All classified habitations, ranked by hazard exposure and relocation urgency.</p></div><div className="flex gap-2"><button className="px-4 py-2.5 bg-white border border-line rounded-xl text-sm flex gap-2 items-center"><Download size={16}/>Export</button><button className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm flex gap-2 items-center"><Plus size={16}/>New zone</button></div></div>

<section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
{[["Total zones",zones.length,"Across 4 districts",MapPinned],["Critical",counts.Critical,"Immediate relocation",AlertTriangle],["High",counts.High,"Short-term action",AlertTriangle],["Moderate",counts.Moderate,"Monitoring phase",Shield]].map(([t,v,s,I]:any)=><div key={t} className="bg-white border border-line rounded-2xl p-4 md:p-5 shadow-soft"><div className="flex justify-between"><span className="text-xs text-muted">{t}</span><div className="p-2 rounded-lg bg-forest/10 text-forest"><I size={17}/></div></div><div className="text-2xl font-bold mt-4">{v}</div><div className="text-[11px] text-muted mt-1">{s}</div></div>)}
</section>

<section className="grid xl:grid-cols-[1.55fr_.8fr] gap-5">

<div className="bg-white border border-line rounded-2xl overflow-hidden shadow-soft">
<div className="p-4 md:p-5 border-b border-line flex flex-col md:flex-row gap-3 justify-between">
<div><h2 className="font-semibold">Zone directory</h2><p className="text-xs text-muted mt-1">{filtered.length} of {zones.length} zones shown</p></div>
<div className="flex flex-wrap gap-2">
<div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search zone..." className="w-40 pl-9 pr-3 py-2 rounded-lg border border-line text-xs"/></div>
<select value={filter} onChange={e=>setFilter(e.target.value)} className="border border-line rounded-lg px-2 text-xs bg-white"><option>All</option><option>Critical</option><option>High</option><option>Moderate</option></select>
<select value={district} onChange={e=>setDistrict(e.target.value)} className="border border-line rounded-lg px-2 text-xs bg-white">{districts.map(d=><option key={d}>{d}</option>)}</select>
<button className="p-2 border border-line rounded-lg"><SlidersHorizontal size={15}/></button>
</div>
</div>

<div className="hidden md:grid grid-cols-[1.4fr_.8fr_.7fr_.8fr_1fr_.5fr] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[.1em] text-muted border-b border-line">
<span>Zone</span><span>Risk</span><span>Population</span><span>Households</span><span>Progress</span><span></span>
</div>
{loading && <div className="px-5 py-2 text-xs text-muted animate-pulse">Loading live zones from backend…</div>}
{error && <div className="px-5 py-2 text-xs text-amber-600">⚠ Backend unavailable — showing demo data. ({error})</div>}
<div className="max-h-[480px] overflow-y-auto">
{filtered.map(z=><button key={z.id} onClick={()=>setSelected(z)} className={`w-full text-left grid md:grid-cols-[1.4fr_.8fr_.7fr_.8fr_1fr_.5fr] gap-3 items-center px-5 py-3 border-b border-line last:border-0 hover:bg-surface ${selectedZone.id===z.id?"bg-forest/5":""}`}>
<div><div className="text-sm font-semibold">{z.name}</div><div className="text-[10px] text-muted">{z.id} • {z.district}</div></div>
<span className={`w-fit text-[10px] font-bold px-2 py-1 rounded-full ${riskStyle[z.risk]}`}>{z.risk}</span>
<span className="text-xs">{z.population.toLocaleString()}</span>
<span className="text-xs">{z.households.toLocaleString()}</span>
<div className="flex items-center gap-2"><div className="h-1.5 flex-1 bg-surface rounded-full overflow-hidden"><div className="h-full bg-forest rounded-full" style={{width:`${z.progress}%`}}/></div><span className="text-[10px] text-muted w-8">{z.progress}%</span></div>
<ChevronRight size={15} className="text-muted justify-self-end hidden md:block"/>
</button>)}
{filtered.length===0&&<div className="p-8 text-center text-sm text-muted">No zones match your filters.</div>}
</div>
</div>

<div className="bg-white border border-line rounded-2xl shadow-soft p-5 h-fit">
<div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.15em] text-muted">Selected zone</div><h2 className="text-lg font-bold mt-1">{selectedZone.name}</h2><p className="text-xs text-muted">{selectedZone.id} • {selectedZone.district}</p></div><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${riskStyle[selectedZone.risk]}`}>{selectedZone.risk}</span></div>
<div className="h-[160px] mt-4 rounded-xl overflow-hidden border border-line"><RiskMap zones={[selectedZone]} onSelect={setSelected}/></div>
<div className="grid grid-cols-2 gap-3 mt-4">{[["Population",selectedZone.population.toLocaleString()],["Households",selectedZone.households.toLocaleString()],["Progress",selectedZone.progress+"%"],["Priority",selectedZone.risk==="Critical"?"Immediate":selectedZone.risk==="High"?"Short-term":"Medium-term"]].map(x=><div key={x[0]} className="p-3 rounded-xl bg-surface"><div className="text-[10px] text-muted">{x[0]}</div><div className="font-bold mt-1">{x[1]}</div></div>)}</div>
<div className="mt-4 p-3 bg-forest/5 rounded-xl text-xs leading-5"><b>Primary hazard</b><br/>{selectedZone.hazard}</div>
<button className="w-full mt-4 py-2.5 bg-forest text-white rounded-xl text-sm">Open relocation plan</button>
</div>

</section>
</div></main></div></div>}
