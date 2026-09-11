"use client";
import {useMemo,useState} from "react";
import {Calendar,Clock,Download,FileText,Search,SlidersHorizontal} from "lucide-react";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

type ReportType="Risk Assessment"|"Relocation Progress"|"Resource Audit"|"Population Census"|"Incident";
type Report={id:string;title:string;type:ReportType;district:string;author:string;date:string;pages:number;status:"Published"|"Draft"};

const reports:Report[]=[
{id:"RPT-118",title:"August relocation progress — all districts",type:"Relocation Progress",district:"All districts",author:"P. Semwal",date:"2 Sep 2026",pages:14,status:"Published"},
{id:"RPT-115",title:"Bhagirathi Valley hazard re-assessment",type:"Risk Assessment",district:"Uttarkashi",author:"A. Bhandari",date:"29 Aug 2026",pages:22,status:"Published"},
{id:"RPT-112",title:"Q3 resource inventory audit",type:"Resource Audit",district:"All districts",author:"R. Naithani",date:"26 Aug 2026",pages:9,status:"Published"},
{id:"RPT-109",title:"Pindar Basin GLOF risk update",type:"Risk Assessment",district:"Chamoli",author:"A. Bhandari",date:"21 Aug 2026",pages:17,status:"Draft"},
{id:"RPT-104",title:"Post-monsoon population census",type:"Population Census",district:"All districts",author:"S. Rawat",date:"14 Aug 2026",pages:31,status:"Published"},
{id:"RPT-101",title:"New Tehri safe site incident log",type:"Incident",district:"Tehri Garhwal",author:"P. Semwal",date:"9 Aug 2026",pages:5,status:"Published"},
{id:"RPT-096",title:"July relocation progress — all districts",type:"Relocation Progress",district:"All districts",author:"P. Semwal",date:"2 Aug 2026",pages:13,status:"Published"},
{id:"RPT-092",title:"Mandakini Belt road accessibility review",type:"Risk Assessment",district:"Rudraprayag",author:"A. Bhandari",date:"27 Jul 2026",pages:11,status:"Draft"},
];

const typeStyle:Record<ReportType,string>={["Risk Assessment"]:"bg-danger/10 text-danger",["Relocation Progress"]:"bg-forest/10 text-forest",["Resource Audit"]:"bg-amber-500/10 text-amber-600",["Population Census"]:"bg-blue-500/10 text-blue-600",Incident:"bg-orange-500/10 text-orange-600"};
const statusStyle={Published:"bg-safe/10 text-safe",Draft:"bg-muted/10 text-muted"};

export default function Reports({onNavigate}:{onNavigate?:(view:string)=>void}){
const[mobileOpen,setMobileOpen]=useState(false),[selected,setSelected]=useState<Report>(reports[0]),[type,setType]=useState("All"),[search,setSearch]=useState("");
const filtered=useMemo(()=>reports.filter(r=>(type==="All"||r.type===type)&&`${r.title} ${r.district} ${r.author}`.toLowerCase().includes(search.toLowerCase())),[type,search]);
const counts={Published:reports.filter(r=>r.status==="Published").length,Draft:reports.filter(r=>r.status==="Draft").length};
// FIX: "This month" used to be a hardcoded 4 regardless of actual report
// dates. Derive it from the report list's own month/year instead.
const thisMonthCount=useMemo(()=>{
  const now=new Date();
  const parsed=reports.map(r=>new Date(r.date));
  return parsed.filter(d=>!isNaN(d.getTime())&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()).length;
},[]);

return <div className="min-h-screen bg-surface">
<AppHeader onOpenMobileNav={()=>setMobileOpen(true)}/>
<div className="flex">
<AppSidebar active="Reports" onNavigate={(v)=>onNavigate?.(v)} mobileOpen={mobileOpen} onCloseMobileNav={()=>setMobileOpen(false)} badges={{Reports:reports.length}}/>
<main className="flex-1 min-w-0 p-4 md:p-7"><div className="max-w-[1500px] mx-auto">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"><div><div className="text-xs text-muted mb-2">State Disaster Management Authority / Reports</div><h1 className="text-2xl md:text-3xl font-bold">Reports</h1><p className="text-sm text-muted mt-1">Published assessments, audits, and progress reports across all districts.</p></div><div className="flex gap-2"><button className="px-4 py-2.5 bg-white border border-line rounded-xl text-sm flex gap-2 items-center"><Download size={16}/>Export all</button><button className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm">New report</button></div></div>

<section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
{[["Total reports",reports.length,"Since program start",FileText],["Published",counts.Published,"Available to all officers",FileText],["Drafts",counts.Draft,"Pending review",Clock],["This month",thisMonthCount,"New reports filed",Calendar]].map(([t,v,s,I]:any)=><div key={t} className="bg-white border border-line rounded-2xl p-4 md:p-5 shadow-soft"><div className="flex justify-between"><span className="text-xs text-muted">{t}</span><div className="p-2 rounded-lg bg-forest/10 text-forest"><I size={17}/></div></div><div className="text-2xl font-bold mt-4">{v}</div><div className="text-[11px] text-muted mt-1">{s}</div></div>)}
</section>

<section className="grid xl:grid-cols-[1.55fr_.8fr] gap-5">

<div className="bg-white border border-line rounded-2xl overflow-hidden shadow-soft">
<div className="p-4 md:p-5 border-b border-line flex flex-col md:flex-row gap-3 justify-between">
<div><h2 className="font-semibold">Report archive</h2><p className="text-xs text-muted mt-1">{filtered.length} of {reports.length} reports shown</p></div>
<div className="flex flex-wrap gap-2">
<div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reports..." className="w-40 pl-9 pr-3 py-2 rounded-lg border border-line text-xs"/></div>
<select value={type} onChange={e=>setType(e.target.value)} className="border border-line rounded-lg px-2 text-xs bg-white"><option>All</option><option>Risk Assessment</option><option>Relocation Progress</option><option>Resource Audit</option><option>Population Census</option><option>Incident</option></select>
<button className="p-2 border border-line rounded-lg"><SlidersHorizontal size={15}/></button>
</div>
</div>

<div className="hidden md:grid grid-cols-[1.8fr_1fr_.8fr_.7fr_.6fr] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[.1em] text-muted border-b border-line">
<span>Report</span><span>Type</span><span>Author</span><span>Date</span><span>Status</span>
</div>
<div className="max-h-[480px] overflow-y-auto">
{filtered.map(r=><button key={r.id} onClick={()=>setSelected(r)} className={`w-full text-left grid md:grid-cols-[1.8fr_1fr_.8fr_.7fr_.6fr] gap-3 items-center px-5 py-3 border-b border-line last:border-0 hover:bg-surface ${selected.id===r.id?"bg-forest/5":""}`}>
<div className="flex gap-2.5 items-start"><div className="p-1.5 rounded-lg bg-forest/10 text-forest mt-0.5"><FileText size={14}/></div><div><div className="text-sm font-semibold">{r.title}</div><div className="text-[10px] text-muted">{r.id} • {r.district}</div></div></div>
<span className={`w-fit text-[10px] font-bold px-2 py-1 rounded-full ${typeStyle[r.type]}`}>{r.type}</span>
<span className="text-xs">{r.author}</span>
<span className="text-xs text-muted">{r.date}</span>
<span className={`w-fit text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[r.status]}`}>{r.status}</span>
</button>)}
{filtered.length===0&&<div className="p-8 text-center text-sm text-muted">No reports match your filters.</div>}
</div>
</div>

<div className="bg-white border border-line rounded-2xl shadow-soft p-5 h-fit">
<div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.15em] text-muted">Selected report</div><h2 className="text-lg font-bold mt-1 leading-snug">{selected.title}</h2><p className="text-xs text-muted mt-1">{selected.id}</p></div></div>
<span className={`inline-block mt-3 px-3 py-1.5 rounded-full text-xs font-bold ${typeStyle[selected.type]}`}>{selected.type}</span>

<div className="grid grid-cols-2 gap-3 mt-4">{[["Author",selected.author],["Filed",selected.date],["District",selected.district],["Pages",selected.pages]].map(x=><div key={x[0]} className="p-3 rounded-xl bg-surface"><div className="text-[10px] text-muted">{x[0]}</div><div className="font-bold mt-1">{x[1]}</div></div>)}</div>

<div className="mt-4 flex items-center gap-2 text-xs"><span className="text-muted">Status</span><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusStyle[selected.status]}`}>{selected.status}</span></div>

<button className="w-full mt-4 py-2.5 bg-forest text-white rounded-xl text-sm flex items-center justify-center gap-2"><Download size={15}/>Download PDF</button>
</div>

</section>
</div></main></div></div>}
