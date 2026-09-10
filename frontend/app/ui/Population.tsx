"use client";
import {useMemo,useState} from "react";
import {Accessibility,BarChart3,Baby,Bell,ChevronDown,CircleHelp,Download,FileText,Home,Layers3,LogOut,MapPinned,Menu,Plus,Search,Shield,SlidersHorizontal,Users,UserRound,X} from "lucide-react";

type Group={id:string;district:string;zoneId:string;zoneName:string;total:number;children:number;elderly:number;disabled:number;pregnant:number;risk:"Critical"|"High"|"Moderate"};

const groups:Group[]=[
{id:"P-014",district:"Uttarkashi",zoneId:"Z-014",zoneName:"Bhagirathi Valley",total:4821,children:842,elderly:611,disabled:198,pregnant:74,risk:"Critical"},
{id:"P-017",district:"Chamoli",zoneId:"Z-017",zoneName:"Pindar Basin",total:3980,children:695,elderly:520,disabled:163,pregnant:61,risk:"Critical"},
{id:"P-022",district:"Rudraprayag",zoneId:"Z-022",zoneName:"Mandakini Belt",total:3290,children:574,elderly:441,disabled:132,pregnant:49,risk:"High"},
{id:"P-006",district:"Chamoli",zoneId:"Z-006",zoneName:"Dhauliganga Terrace",total:2660,children:462,elderly:358,disabled:107,pregnant:41,risk:"Critical"},
{id:"P-031",district:"Chamoli",zoneId:"Z-031",zoneName:"Alaknanda Slope",total:2745,children:479,elderly:369,disabled:110,pregnant:42,risk:"High"},
{id:"P-025",district:"Tehri Garhwal",zoneId:"Z-025",zoneName:"Bhilangana Fringe",total:2210,children:386,elderly:297,disabled:88,pregnant:34,risk:"High"},
{id:"P-011",district:"Pithoragarh",zoneId:"Z-011",zoneName:"Kali Ganga Bank",total:1540,children:269,elderly:207,disabled:61,pregnant:24,risk:"Moderate"},
{id:"P-009",district:"Tehri Garhwal",zoneId:"Z-009",zoneName:"Tehri Ridge",total:1930,children:337,elderly:259,disabled:77,pregnant:29,risk:"Moderate"},
];

const riskStyle={Critical:"bg-danger/10 text-danger",High:"bg-orange-500/10 text-orange-600",Moderate:"bg-amber-500/10 text-amber-600"};

export default function Population({onNavigate}:{onNavigate?:(view:string)=>void}){
const[mobileOpen,setMobileOpen]=useState(false),[selected,setSelected]=useState<Group>(groups[0]),[risk,setRisk]=useState("All"),[search,setSearch]=useState("");
const nav=[["Dashboard",Home],["Risk Zones",MapPinned],["Relocation",Layers3],["Resources",Shield],["Population",Users],["Analytics",BarChart3],["Reports",FileText]];
const filtered=useMemo(()=>groups.filter(g=>(risk==="All"||g.risk===risk)&&`${g.zoneName} ${g.district}`.toLowerCase().includes(search.toLowerCase())),[risk,search]);
const totals=groups.reduce((a,g)=>({total:a.total+g.total,children:a.children+g.children,elderly:a.elderly+g.elderly,disabled:a.disabled+g.disabled,pregnant:a.pregnant+g.pregnant}),{total:0,children:0,elderly:0,disabled:0,pregnant:0});
const vulnPct=Math.round(((totals.children+totals.elderly+totals.disabled+totals.pregnant)/totals.total)*100);

return <div className="min-h-screen bg-surface">
<header className="h-[68px] bg-white border-b border-line flex items-center px-4 md:px-7 sticky top-0 z-30">
<button className="md:hidden mr-3" onClick={()=>setMobileOpen(true)}><Menu size={22}/></button>
<div className="flex items-center gap-3 min-w-[245px]"><div className="w-10 h-10 rounded-xl bg-forest text-white grid place-items-center"><Shield size={21}/></div><div><b>RakshaGrid</b><div className="text-[10px] uppercase tracking-[.16em] text-muted">Proactive relocation command</div></div></div>
<div className="hidden lg:flex flex-1 justify-center"><div className="text-xs text-muted px-4 py-2 rounded-full bg-surface border border-line"><span className="inline-block w-2 h-2 rounded-full bg-safe mr-2"/>Case study: Uttarakhand • Demo dataset</div></div>
<div className="ml-auto flex items-center gap-3"><Bell size={19}/><div className="hidden sm:flex items-center gap-3 border-l border-line pl-4"><div className="w-9 h-9 rounded-full bg-forest/10 text-forest grid place-items-center text-sm font-bold">DM</div><div className="text-xs"><b>District Officer</b><div className="text-muted">SDMA Control Room</div></div><ChevronDown size={15}/></div></div>
</header>
<div className="flex">
<aside className={`${mobileOpen?"fixed inset-0 z-50 bg-white w-[280px]":"hidden"} md:block md:sticky md:top-[68px] md:h-[calc(100vh-68px)] w-[245px] shrink-0 bg-white border-r border-line p-4`}>
<div className="flex justify-between md:hidden mb-6"><b>Navigation</b><button onClick={()=>setMobileOpen(false)}><X/></button></div>
<div className="text-[10px] uppercase tracking-[.18em] text-muted px-3 mb-2">Workspace</div>
<nav className="space-y-1">{nav.map(([label,Icon]:any)=><button key={label} onClick={()=>{setMobileOpen(false);onNavigate?.(label)}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left ${label==="Population"?"bg-forest text-white":"hover:bg-surface"}`}><Icon size={17}/>{label}{label==="Population"&&<span className="ml-auto text-[10px] px-1.5 rounded bg-white/20">{groups.length}</span>}</button>)}</nav>
<div className="mt-8 border-t border-line pt-5"><div className="text-[10px] uppercase tracking-[.18em] text-muted px-3 mb-2">System</div><button className="w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface"><CircleHelp size={17}/>Help & methodology</button><button className="w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface"><LogOut size={17}/>Sign out</button></div>
<div className="mt-8 p-3 rounded-2xl bg-forest/5 border border-forest/10"><div className="text-xs font-semibold">Scoring model v1.0</div><div className="text-[11px] text-muted mt-1 leading-4">Hazard 45% • exposure 30% • urgency 25%</div></div>
</aside>
<main className="flex-1 min-w-0 p-4 md:p-7"><div className="max-w-[1500px] mx-auto">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"><div><div className="text-xs text-muted mb-2">State Disaster Management Authority / Population</div><h1 className="text-2xl md:text-3xl font-bold">Population & Vulnerability</h1><p className="text-sm text-muted mt-1">Demographic breakdown by zone, with vulnerable-group counts for relocation priority.</p></div><div className="flex gap-2"><button className="px-4 py-2.5 bg-white border border-line rounded-xl text-sm flex gap-2 items-center"><Download size={16}/>Export</button><button className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm flex gap-2 items-center"><Plus size={16}/>Update census</button></div></div>

<section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
{[["Total population",totals.total.toLocaleString(),"Across 8 zones",Users],["Children (0–14)",totals.children.toLocaleString(),`${Math.round(totals.children/totals.total*100)}% of total`,Baby],["Elderly (65+)",totals.elderly.toLocaleString(),`${Math.round(totals.elderly/totals.total*100)}% of total`,UserRound],["Vulnerable share",vulnPct+"%","Children, elderly, disabled, pregnant",Accessibility]].map(([t,v,s,I]:any)=><div key={t} className="bg-white border border-line rounded-2xl p-4 md:p-5 shadow-soft"><div className="flex justify-between"><span className="text-xs text-muted">{t}</span><div className="p-2 rounded-lg bg-forest/10 text-forest"><I size={17}/></div></div><div className="text-2xl font-bold mt-4">{v}</div><div className="text-[11px] text-muted mt-1">{s}</div></div>)}
</section>

<section className="grid xl:grid-cols-[1.55fr_.8fr] gap-5">

<div className="bg-white border border-line rounded-2xl overflow-hidden shadow-soft">
<div className="p-4 md:p-5 border-b border-line flex flex-col md:flex-row gap-3 justify-between">
<div><h2 className="font-semibold">Zone demographics</h2><p className="text-xs text-muted mt-1">{filtered.length} of {groups.length} zones shown</p></div>
<div className="flex flex-wrap gap-2">
<div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search zone..." className="w-40 pl-9 pr-3 py-2 rounded-lg border border-line text-xs"/></div>
<select value={risk} onChange={e=>setRisk(e.target.value)} className="border border-line rounded-lg px-2 text-xs bg-white"><option>All</option><option>Critical</option><option>High</option><option>Moderate</option></select>
<button className="p-2 border border-line rounded-lg"><SlidersHorizontal size={15}/></button>
</div>
</div>

<div className="hidden md:grid grid-cols-[1.3fr_.7fr_.6fr_.6fr_.6fr_.7fr] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[.1em] text-muted border-b border-line">
<span>Zone</span><span>Total</span><span>Children</span><span>Elderly</span><span>Disabled</span><span>Risk</span>
</div>
<div className="max-h-[480px] overflow-y-auto">
{filtered.map(g=><button key={g.id} onClick={()=>setSelected(g)} className={`w-full text-left grid md:grid-cols-[1.3fr_.7fr_.6fr_.6fr_.6fr_.7fr] gap-3 items-center px-5 py-3 border-b border-line last:border-0 hover:bg-surface ${selected.id===g.id?"bg-forest/5":""}`}>
<div><div className="text-sm font-semibold">{g.zoneName}</div><div className="text-[10px] text-muted">{g.zoneId} • {g.district}</div></div>
<span className="text-xs">{g.total.toLocaleString()}</span>
<span className="text-xs">{g.children.toLocaleString()}</span>
<span className="text-xs">{g.elderly.toLocaleString()}</span>
<span className="text-xs">{g.disabled.toLocaleString()}</span>
<span className={`w-fit text-[10px] font-bold px-2 py-1 rounded-full ${riskStyle[g.risk]}`}>{g.risk}</span>
</button>)}
{filtered.length===0&&<div className="p-8 text-center text-sm text-muted">No zones match your filters.</div>}
</div>
</div>

<div className="bg-white border border-line rounded-2xl shadow-soft p-5 h-fit">
<div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.15em] text-muted">Selected zone</div><h2 className="text-lg font-bold mt-1">{selected.zoneName}</h2><p className="text-xs text-muted">{selected.zoneId} • {selected.district}</p></div><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${riskStyle[selected.risk]}`}>{selected.risk}</span></div>

<div className="mt-4 p-3 rounded-xl bg-surface"><div className="text-[10px] text-muted">Total population</div><div className="text-xl font-bold mt-1">{selected.total.toLocaleString()}</div></div>

<div className="mt-4 space-y-2.5">
{[["Children (0–14)",selected.children,Baby],["Elderly (65+)",selected.elderly,UserRound],["Persons with disabilities",selected.disabled,Accessibility],["Pregnant / nursing",selected.pregnant,Users]].map(([label,val,I]:any)=><div key={label} className="flex items-center gap-3"><div className="p-1.5 rounded-lg bg-forest/10 text-forest"><I size={14}/></div><div className="flex-1"><div className="flex justify-between text-xs"><span>{label}</span><span className="font-semibold">{val.toLocaleString()}</span></div><div className="h-1.5 bg-surface rounded-full overflow-hidden mt-1"><div className="h-full bg-forest rounded-full" style={{width:`${Math.min(100,(val/selected.total)*100*4)}%`}}/></div></div></div>)}
</div>

<button className="w-full mt-4 py-2.5 bg-forest text-white rounded-xl text-sm">View priority relocation list</button>
</div>

</section>
</div></main></div></div>}