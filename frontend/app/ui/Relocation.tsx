"use client";
import {useMemo,useState} from "react";
import {AlertTriangle,ArrowRight,CheckCircle2,Download,Layers3,Plus,Search,SlidersHorizontal,Users} from "lucide-react";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

type Stage="Planning"|"In Process"|"Relocated";
type Plan={id:string;zoneId:string;zoneName:string;district:string;safeSite:string;families:number;capacity:number;stage:Stage;target:string};

const plans:Plan[]=[
{id:"RP-041",zoneId:"Z-014",zoneName:"Bhagirathi Valley",district:"Uttarkashi",safeSite:"Site S-008, Dharasu",families:1204,capacity:1350,stage:"In Process",target:"Dec 2026"},
{id:"RP-039",zoneId:"Z-017",zoneName:"Pindar Basin",district:"Chamoli",safeSite:"Site S-012, Karnaprayag",families:1012,capacity:1100,stage:"Planning",target:"Mar 2027"},
{id:"RP-033",zoneId:"Z-022",zoneName:"Mandakini Belt",district:"Rudraprayag",safeSite:"Site S-005, Guptkashi",families:846,capacity:900,stage:"In Process",target:"Jan 2027"},
{id:"RP-028",zoneId:"Z-031",zoneName:"Alaknanda Slope",district:"Chamoli",safeSite:"Site S-011, Nandprayag",families:702,capacity:820,stage:"Planning",target:"Apr 2027"},
{id:"RP-019",zoneId:"Z-006",zoneName:"Dhauliganga Terrace",district:"Chamoli",safeSite:"Site S-014, Joshimath East",families:701,capacity:750,stage:"Planning",target:"Jun 2027"},
{id:"RP-011",zoneId:"Z-025",zoneName:"Bhilangana Fringe",district:"Tehri Garhwal",safeSite:"Site S-003, New Tehri",families:588,capacity:640,stage:"Relocated",target:"Completed"},
{id:"RP-004",zoneId:"Z-009",zoneName:"Tehri Ridge",district:"Tehri Garhwal",safeSite:"Site S-003, New Tehri",families:511,capacity:640,stage:"Relocated",target:"Completed"},
];

const stageStyle:Record<Stage,string>={Planning:"bg-amber-500/10 text-amber-600",["In Process"]:"bg-forest/10 text-forest",Relocated:"bg-safe/10 text-safe"};

export default function Relocation({onNavigate}:{onNavigate?:(view:string)=>void}){
const[mobileOpen,setMobileOpen]=useState(false),[selected,setSelected]=useState<Plan>(plans[0]),[stage,setStage]=useState("All"),[search,setSearch]=useState("");
const filtered=useMemo(()=>plans.filter(p=>(stage==="All"||p.stage===stage)&&`${p.zoneName} ${p.district} ${p.id}`.toLowerCase().includes(search.toLowerCase())),[stage,search]);
const counts={Planning:plans.filter(p=>p.stage==="Planning").length,["In Process"]:plans.filter(p=>p.stage==="In Process").length,Relocated:plans.filter(p=>p.stage==="Relocated").length};
const totalFamilies=plans.reduce((s,p)=>s+p.families,0),totalCapacity=plans.reduce((s,p)=>s+p.capacity,0);

return <div className="min-h-screen bg-surface">
<AppHeader onOpenMobileNav={()=>setMobileOpen(true)}/>
<div className="flex">
<AppSidebar active="Relocation" onNavigate={(v)=>onNavigate?.(v)} mobileOpen={mobileOpen} onCloseMobileNav={()=>setMobileOpen(false)} badges={{Relocation:plans.length}}/>
<main className="flex-1 min-w-0 p-4 md:p-7"><div className="max-w-[1500px] mx-auto">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"><div><div className="text-xs text-muted mb-2">State Disaster Management Authority / Relocation</div><h1 className="text-2xl md:text-3xl font-bold">Relocation Plans</h1><p className="text-sm text-muted mt-1">Zone-to-safe-site assignments, capacity matching, and stage tracking.</p></div><div className="flex gap-2"><button className="px-4 py-2.5 bg-white border border-line rounded-xl text-sm flex gap-2 items-center"><Download size={16}/>Export</button><button className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm flex gap-2 items-center"><Plus size={16}/>New plan</button></div></div>

<section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
{[["Total plans",plans.length,`Across ${new Set(plans.map(p=>p.district)).size} districts`,Layers3],["Families to relocate",totalFamilies.toLocaleString(),`${totalCapacity.toLocaleString()} capacity assigned`,Users],["In process",counts["In Process"],"Actively relocating",AlertTriangle],["Completed",counts.Relocated,"Fully resettled",CheckCircle2]].map(([t,v,s,I]:any)=><div key={t} className="bg-white border border-line rounded-2xl p-4 md:p-5 shadow-soft"><div className="flex justify-between"><span className="text-xs text-muted">{t}</span><div className="p-2 rounded-lg bg-forest/10 text-forest"><I size={17}/></div></div><div className="text-2xl font-bold mt-4">{v}</div><div className="text-[11px] text-muted mt-1">{s}</div></div>)}
</section>

<section className="grid xl:grid-cols-[1.55fr_.8fr] gap-5">

<div className="bg-white border border-line rounded-2xl overflow-hidden shadow-soft">
<div className="p-4 md:p-5 border-b border-line flex flex-col md:flex-row gap-3 justify-between">
<div><h2 className="font-semibold">Plan directory</h2><p className="text-xs text-muted mt-1">{filtered.length} of {plans.length} plans shown</p></div>
<div className="flex flex-wrap gap-2">
<div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search plan..." className="w-40 pl-9 pr-3 py-2 rounded-lg border border-line text-xs"/></div>
<select value={stage} onChange={e=>setStage(e.target.value)} className="border border-line rounded-lg px-2 text-xs bg-white"><option>All</option><option>Planning</option><option>In Process</option><option>Relocated</option></select>
<button className="p-2 border border-line rounded-lg"><SlidersHorizontal size={15}/></button>
</div>
</div>

<div className="hidden md:grid grid-cols-[1.3fr_1.1fr_.7fr_.8fr_.9fr] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[.1em] text-muted border-b border-line">
<span>Zone</span><span>Safe site</span><span>Families</span><span>Stage</span><span>Target</span>
</div>
<div className="max-h-[480px] overflow-y-auto">
{filtered.map(p=><button key={p.id} onClick={()=>setSelected(p)} className={`w-full text-left grid md:grid-cols-[1.3fr_1.1fr_.7fr_.8fr_.9fr] gap-3 items-center px-5 py-3 border-b border-line last:border-0 hover:bg-surface ${selected.id===p.id?"bg-forest/5":""}`}>
<div><div className="text-sm font-semibold">{p.zoneName}</div><div className="text-[10px] text-muted">{p.zoneId} • {p.district}</div></div>
<span className="text-xs">{p.safeSite}</span>
<span className="text-xs">{p.families.toLocaleString()}</span>
<span className={`w-fit text-[10px] font-bold px-2 py-1 rounded-full ${stageStyle[p.stage]}`}>{p.stage}</span>
<span className="text-xs text-muted">{p.target}</span>
</button>)}
{filtered.length===0&&<div className="p-8 text-center text-sm text-muted">No plans match your filters.</div>}
</div>
</div>

<div className="bg-white border border-line rounded-2xl shadow-soft p-5 h-fit">
<div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.15em] text-muted">Selected plan</div><h2 className="text-lg font-bold mt-1">{selected.zoneName}</h2><p className="text-xs text-muted">{selected.id} • {selected.district}</p></div><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${stageStyle[selected.stage]}`}>{selected.stage}</span></div>

<div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-surface text-xs">
<span className="font-semibold">{selected.zoneName}</span>
<ArrowRight size={14} className="text-muted"/>
<span className="font-semibold">{selected.safeSite}</span>
</div>

<div className="mt-4"><div className="flex justify-between text-[10px] text-muted mb-1.5"><span>Capacity match</span><span>{selected.families.toLocaleString()} / {selected.capacity.toLocaleString()}</span></div><div className="h-2 bg-surface rounded-full overflow-hidden"><div className="h-full bg-forest rounded-full" style={{width:`${Math.min(100,(selected.families/selected.capacity)*100)}%`}}/></div></div>

<div className="grid grid-cols-2 gap-3 mt-4">{[["Families",selected.families.toLocaleString()],["Site capacity",selected.capacity.toLocaleString()],["Target date",selected.target],["Headroom",Math.max(0,selected.capacity-selected.families).toLocaleString()]].map(x=><div key={x[0]} className="p-3 rounded-xl bg-surface"><div className="text-[10px] text-muted">{x[0]}</div><div className="font-bold mt-1">{x[1]}</div></div>)}</div>

<button className="w-full mt-4 py-2.5 bg-forest text-white rounded-xl text-sm">Update plan status</button>
</div>

</section>
</div></main></div></div>}
