"use client";
import {useState} from "react";
import {ActivitySquare,BarChart3,Bell,CheckCircle2,ChevronDown,CircleHelp,Database,FileText,Home,KeyRound,Layers3,LogOut,MapPinned,Menu,Plus,Save,Shield,ShieldCheck,Users,UserCog,Wifi,X} from "lucide-react";

type Weight={label:string;value:number;color:string};
type Source={name:string;kind:string;status:"Connected"|"Delayed"|"Offline";lastSync:string};
type Role={name:string;role:string;district:string;access:"Full"|"Read-only"|"District"};
type LogEntry={time:string;actor:string;action:string};

const weights:Weight[]=[{label:"Hazard severity",value:45,color:"bg-danger"},{label:"Population exposure",value:30,color:"bg-forest"},{label:"Relocation urgency",value:25,color:"bg-amber-500"}];
const sources:Source[]=[
{name:"IMD rainfall feed",kind:"Weather API",status:"Connected",lastSync:"3 min ago"},
{name:"GSI landslide susceptibility",kind:"Geological dataset",status:"Connected",lastSync:"1 hr ago"},
{name:"Census 2021 baseline",kind:"Population dataset",status:"Connected",lastSync:"Static"},
{name:"District road network",kind:"Infrastructure feed",status:"Delayed",lastSync:"14 hrs ago"},
{name:"NDRF deployment tracker",kind:"Personnel feed",status:"Offline",lastSync:"2 days ago"},
];
const roles:Role[]=[
{name:"P. Semwal",role:"Program Officer",district:"All districts",access:"Full"},
{name:"A. Bhandari",role:"Hazard Analyst",district:"Chamoli",access:"District"},
{name:"R. Naithani",role:"Logistics Lead",district:"All districts",access:"Full"},
{name:"S. Rawat",role:"Census Coordinator",district:"All districts",access:"Read-only"},
];
const logs:LogEntry[]=[
{time:"09:41",actor:"A. Bhandari",action:"Updated hazard score for Z-017 Pindar Basin"},
{time:"08:55",actor:"P. Semwal",action:"Published RPT-118 August relocation progress"},
{time:"Yesterday",actor:"System",action:"GSI dataset sync completed"},
{time:"Yesterday",actor:"R. Naithani",action:"Logged resupply request for R-087"},
];

const sourceStyle={Connected:"bg-safe/10 text-safe",Delayed:"bg-amber-500/10 text-amber-600",Offline:"bg-danger/10 text-danger"};
const accessStyle={Full:"bg-forest/10 text-forest",["Read-only"]:"bg-muted/10 text-muted",District:"bg-blue-500/10 text-blue-600"};

export default function SystemSettings({onNavigate}:{onNavigate?:(view:string)=>void}){
const[mobileOpen,setMobileOpen]=useState(false);
const nav=[["Dashboard",Home],["Risk Zones",MapPinned],["Relocation",Layers3],["Resources",Shield],["Population",Users],["Analytics",BarChart3],["Reports",FileText]];

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
<nav className="space-y-1">{nav.map(([label,Icon]:any)=><button key={label} onClick={()=>{setMobileOpen(false);onNavigate?.(label)}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-surface"><Icon size={17}/>{label}</button>)}</nav>
<div className="mt-8 border-t border-line pt-5"><div className="text-[10px] uppercase tracking-[.18em] text-muted px-3 mb-2">System</div><button className="w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm bg-forest text-white"><UserCog size={17}/>System settings</button><button className="w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface"><CircleHelp size={17}/>Help & methodology</button><button className="w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface"><LogOut size={17}/>Sign out</button></div>
<div className="mt-8 p-3 rounded-2xl bg-forest/5 border border-forest/10"><div className="text-xs font-semibold">Scoring model v1.0</div><div className="text-[11px] text-muted mt-1 leading-4">Hazard 45% • exposure 30% • urgency 25%</div></div>
</aside>
<main className="flex-1 min-w-0 p-4 md:p-7"><div className="max-w-[1500px] mx-auto">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"><div><div className="text-xs text-muted mb-2">State Disaster Management Authority / System</div><h1 className="text-2xl md:text-3xl font-bold">System Settings</h1><p className="text-sm text-muted mt-1">Scoring model, data sources, access control, and activity log.</p></div><div className="flex gap-2"><button className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm flex gap-2 items-center"><Save size={16}/>Save changes</button></div></div>

<section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
	{[["System status","Operational","All core services running",ActivitySquare],["Data sources",sources.length,"1 offline, 1 delayed",Database],["Active users",roles.length,"Across 4 districts",Users],["Last audit","3 days ago","Scoring model review",ShieldCheck]].map(([t,v,s,I]:any)=><div key={t} className="bg-white border border-line rounded-2xl p-4 md:p-5 shadow-soft"><div className="flex justify-between"><span className="text-xs text-muted">{t}</span><div className="p-2 rounded-lg bg-forest/10 text-forest"><I size={17}/></div></div><div className="text-2xl font-bold mt-4">{v}</div><div className="text-[11px] text-muted mt-1">{s}</div></div>)}
</section>

<section className="grid xl:grid-cols-[1.1fr_1fr] gap-5">

<div className="bg-white border border-line rounded-2xl shadow-soft p-5">
<div className="flex justify-between items-start"><div><h2 className="font-semibold">Scoring model weights</h2><p className="text-xs text-muted mt-1">Determines zone priority ranking across the app</p></div><span className="text-[10px] font-bold px-2 py-1 rounded-full bg-forest/10 text-forest">v1.0</span></div>
<div className="mt-5 space-y-5">
{weights.map(w=><div key={w.label}><div className="flex justify-between text-xs mb-1.5"><span className="font-medium">{w.label}</span><span className="font-semibold">{w.value}%</span></div><div className="h-2.5 bg-surface rounded-full overflow-hidden"><div className={`h-full rounded-full ${w.color}`} style={{width:`${w.value}%`}}/></div></div>)}
</div>
<div className="mt-5 p-3 bg-forest/5 rounded-xl text-xs leading-5"><b>Changing weights re-ranks every zone.</b> Publish a new model version rather than editing live weights during an active relocation cycle.</div>
<button className="w-full mt-4 py-2.5 border border-line rounded-xl text-sm">Propose new model version</button>
</div>

<div className="bg-white border border-line rounded-2xl overflow-hidden shadow-soft">
<div className="p-5 border-b border-line"><h2 className="font-semibold">Data sources</h2><p className="text-xs text-muted mt-1">Feeds powering hazard, population, and infrastructure scoring</p></div>
<div className="divide-y divide-line">
{sources.map(s=><div key={s.name} className="flex items-center justify-between px-5 py-3.5"><div className="flex items-center gap-3"><div className="p-1.5 rounded-lg bg-forest/10 text-forest"><Wifi size={14}/></div><div><div className="text-sm font-semibold">{s.name}</div><div className="text-[10px] text-muted">{s.kind} • synced {s.lastSync}</div></div></div><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${sourceStyle[s.status]}`}>{s.status}</span></div>)}
</div>
<div className="p-4 border-t border-line"><button className="w-full py-2.5 border border-line rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={15}/>Connect data source</button></div>
</div>

</section>

<section className="grid lg:grid-cols-2 gap-5 mt-5">

<div className="bg-white border border-line rounded-2xl shadow-soft overflow-hidden">
<div className="p-5 border-b border-line flex justify-between items-center"><div><h2 className="font-semibold">Access control</h2><p className="text-xs text-muted mt-1">Officers with dashboard access</p></div><button className="text-xs text-forest font-medium flex items-center gap-1"><Plus size={14}/>Invite</button></div>
<div className="divide-y divide-line">
{roles.map(r=><div key={r.name} className="flex items-center justify-between px-5 py-3.5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-forest/10 text-forest grid place-items-center text-xs font-bold">{r.name.split(" ").map(n=>n[0]).join("")}</div><div><div className="text-sm font-semibold">{r.name}</div><div className="text-[10px] text-muted">{r.role} • {r.district}</div></div></div><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${accessStyle[r.access]}`}>{r.access}</span></div>)}
</div>
</div>

<div className="bg-white border border-line rounded-2xl shadow-soft p-5">
<div className="flex justify-between mb-4"><div><h2 className="font-semibold">Activity log</h2><p className="text-xs text-muted mt-1">Recent changes across the system</p></div></div>
<div className="space-y-3">
{logs.map((l,i)=><div key={i} className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-forest mt-1.5 shrink-0"/><div className="flex-1"><div className="text-xs"><b>{l.actor}</b> {l.action}</div><div className="text-[10px] text-muted mt-0.5">{l.time}</div></div></div>)}
</div>
<button className="w-full mt-4 py-2 text-xs text-forest font-medium">View full log</button>
</div>

</section>

<section className="mt-5 bg-white border border-line rounded-2xl shadow-soft p-5">
<div className="flex items-center gap-3 mb-4"><KeyRound size={17} className="text-forest"/><h2 className="font-semibold">API & integrations</h2></div>
<div className="grid sm:grid-cols-3 gap-4">
<div className="p-3 rounded-xl bg-surface"><div className="text-[10px] text-muted">Environment</div><div className="font-bold mt-1">Production</div></div>
<div className="p-3 rounded-xl bg-surface"><div className="text-[10px] text-muted">API key</div><div className="font-bold mt-1 font-mono text-xs">••••••••4f21</div></div>
<div className="p-3 rounded-xl bg-surface"><div className="text-[10px] text-muted">Rate limit</div><div className="font-bold mt-1">10,000 req/day</div></div>
</div>
<div className="flex gap-2 mt-4"><button className="px-4 py-2 border border-line rounded-xl text-xs">Regenerate key</button><button className="px-4 py-2 border border-line rounded-xl text-xs">View API docs</button></div>
</section>

</div></main></div></div>}