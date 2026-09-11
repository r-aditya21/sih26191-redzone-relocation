"use client";
import {useMemo,useState} from "react";
import dynamic from "next/dynamic";
import RiskZones from "./RiskZones";
import Relocation from "./Relocation";
import Resources from "./Resources";
import Population from "./Population";
import Analytics from "./Analytic";
import Reports from "./Reports";
import SystemSettings from "./System";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import {AlertTriangle,Download,MapPinned,Search,Shield,SlidersHorizontal,Users} from "lucide-react";
import { useApi } from "../../lib/useApi";
import {
  fetchPriorities,
  fetchM4RiskAnalysis,
} from "../../lib/api";
const RiskMap=dynamic(()=>import("./RiskMap"),{ssr:false});

type Zone={id:string;name:string;district:string;risk:"Critical"|"High"|"Moderate";population:number;households:number;progress:number};
const zones:Zone[]=[
{id:"Z-014",name:"Bhagirathi Valley",district:"Uttarkashi",risk:"Critical",population:4821,households:1204,progress:78},
{id:"Z-022",name:"Mandakini Belt",district:"Rudraprayag",risk:"High",population:3290,households:846,progress:54},
{id:"Z-031",name:"Alaknanda Slope",district:"Chamoli",risk:"High",population:2745,households:702,progress:42},
{id:"Z-009",name:"Tehri Ridge",district:"Tehri Garhwal",risk:"Moderate",population:1930,households:511,progress:21}];
const staticPriorities=[["Z-014","Bhagirathi Valley","Critical",4821,"Immediate"],["Z-022","Mandakini Belt","High",3290,"Short-term"],["Z-031","Alaknanda Slope","High",2745,"Short-term"],["Z-009","Tehri Ridge","Moderate",1930,"Medium-term"]];

export default function Dashboard(){
const { data: apiPriorities } = useApi(fetchPriorities);
const { data: m4Risk } = useApi(() =>
  fetchM4RiskAnalysis([
    {
      habitation_id: "H001",
      flood_score: 0.7,
      landslide_score: 0.6,
      rainfall_score: 0.8,
      exposed_area_ratio: 0.7,
      vulnerable_population_ratio: 0.5,
      infrastructure_vulnerability: 0.6,
      access_constraint: 0.4,
    },
  ])
);

const priorities = useMemo(() => {
  if (!apiPriorities || apiPriorities.length === 0) return staticPriorities;
  return apiPriorities.slice(0,4).map(p => [
    p.habitation_id, p.name, p.risk_level, p.population, p.urgency
  ]);
}, [apiPriorities]);

const riskResult = m4Risk?.results?.[0];
const[active,setActive]=useState("Dashboard"),[mobileOpen,setMobileOpen]=useState(false),[selected,setSelected]=useState<Zone>(zones[0]),[filter,setFilter]=useState("All"),[search,setSearch]=useState("");
const filtered=useMemo(()=>zones.filter(z=>(filter==="All"||z.risk===filter)&&`${z.name} ${z.district}`.toLowerCase().includes(search.toLowerCase())),[filter,search]);
if(active==="Risk Zones") return <RiskZones onNavigate={setActive}/>;
if(active==="Relocation") return <Relocation onNavigate={setActive}/>;
if(active==="Resources") return <Resources onNavigate={setActive}/>;
if(active==="Population") return <Population onNavigate={setActive}/>;
if(active==="Analytics") return <Analytics onNavigate={setActive}/>;
if(active==="Reports") return <Reports onNavigate={setActive}/>;
if(active==="System") return <SystemSettings onNavigate={setActive}/>;
return <div className="min-h-screen bg-surface">
<AppHeader onOpenMobileNav={()=>setMobileOpen(true)}/>
<div className="flex">
<AppSidebar active="Dashboard" onNavigate={setActive} mobileOpen={mobileOpen} onCloseMobileNav={()=>setMobileOpen(false)} badges={{"Risk Zones":17}}/>
<main className="flex-1 min-w-0 p-4 md:p-7"><div className="max-w-[1500px] mx-auto">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"><div><div className="text-xs text-muted mb-2">State Disaster Management Authority / Overview</div><h1 className="text-2xl md:text-3xl font-bold">Relocation Command Center</h1><p className="text-sm text-muted mt-1">Proactive identification of hazardous habitations and safer relocation capacity.</p></div><div className="flex gap-2"><button className="px-4 py-2.5 bg-white border border-line rounded-xl text-sm flex gap-2 items-center"><Download size={16}/>Export report</button><button className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm">Plan relocation</button></div></div>
<section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">{[["Affected population","24,821","Across 17 classified zones",AlertTriangle],["Active red zones","17","4 require immediate action",MapPinned],["Relocation required","12,450","8,921 already relocated",Users],["Safe capacity","18,730","72% currently available",Shield]].map(([t,v,s,I]:any)=><div key={t} className="bg-white border border-line rounded-2xl p-4 md:p-5 shadow-soft"><div className="flex justify-between"><span className="text-xs text-muted">{t}</span><div className="p-2 rounded-lg bg-forest/10 text-forest"><I size={17}/></div></div><div className="text-2xl font-bold mt-4">{v}</div><div className="text-[11px] text-muted mt-1">{s}</div></div>)}</section>
{riskResult && (
<section className="mb-5 bg-white border border-line rounded-2xl shadow-soft p-5">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
    <div>
      <div className="text-[10px] uppercase tracking-[.15em] text-muted">M4 Risk Engine</div>
      <h2 className="font-semibold mt-1">Habitation {riskResult.habitation_id}</h2>
      <p className="text-xs text-muted mt-1">Live result from Express → Python M4 service</p>
    </div>
    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-danger/10 text-danger">
      {riskResult.risk.risk_level}
    </span>
  </div>
  <div className="grid sm:grid-cols-4 gap-3 mt-4">
    {[
      ["Hazard", riskResult.hazard.hazard_score],
      ["Exposure", riskResult.exposure.exposure_score],
      ["Vulnerability", riskResult.vulnerability.vulnerability_score],
      ["Overall risk", riskResult.risk.risk_score],
    ].map(([label, value]: [string, number]) => (
      <div key={label} className="p-3 rounded-xl bg-surface">
        <div className="text-[10px] text-muted">{label}</div>
        <div className="font-bold mt-1">{value.toFixed(3)}</div>
      </div>
    ))}
  </div>
</section>
)}
<section className="grid xl:grid-cols-[1.55fr_.8fr] gap-5">
<div className="bg-white border border-line rounded-2xl overflow-hidden shadow-soft"><div className="p-4 md:p-5 border-b border-line flex flex-col md:flex-row gap-3 justify-between"><div><h2 className="font-semibold">Multi-hazard risk map</h2><p className="text-xs text-muted mt-1">Click a zone to inspect exposure and relocation progress.</p></div><div className="flex gap-2"><div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search zone..." className="w-40 pl-9 pr-3 py-2 rounded-lg border border-line text-xs"/></div><select value={filter} onChange={e=>setFilter(e.target.value)} className="border border-line rounded-lg px-2 text-xs bg-white"><option>All</option><option>Critical</option><option>High</option><option>Moderate</option></select><button className="p-2 border border-line rounded-lg"><SlidersHorizontal size={15}/></button></div></div><div className="h-[420px]"><RiskMap zones={filtered} onSelect={setSelected}/></div></div>
<div className="bg-white border border-line rounded-2xl shadow-soft p-5"><div className="flex justify-between"><div><h2 className="font-semibold">Priority habitation</h2><p className="text-xs text-muted mt-1">Highest urgency first</p></div><span className="text-xs text-forest font-medium">View all</span></div><div className="mt-5 space-y-3">{priorities.map((p:any,i)=><div key={p[0]} className="p-3 rounded-xl border border-line"><div className="flex justify-between gap-2"><div className="flex gap-2"><span className="w-6 h-6 rounded-full bg-surface grid place-items-center text-[10px] font-bold">{i+1}</span><div><div className="text-sm font-semibold">{p[1]}</div><div className="text-[10px] text-muted">{p[0]} • {p[3].toLocaleString()} people</div></div></div><span className="text-[9px] font-bold px-2 py-1 rounded-full bg-danger/10 text-danger">{p[4]}</span></div></div>)}</div><div className="mt-5 p-3 bg-forest/5 rounded-xl text-xs leading-5"><b>Explainable ranking</b><br/>45% hazard + 30% population vulnerability + 25% relocation urgency.</div></div>
</section>
<section className="grid lg:grid-cols-2 gap-5 mt-5"><div className="bg-white border border-line rounded-2xl shadow-soft p-5"><div className="flex justify-between mb-4"><div><h2 className="font-semibold">Critical alerts</h2><p className="text-xs text-muted mt-1">Planning conditions requiring attention</p></div><span className="text-xs text-danger font-semibold">4 critical</span></div>{[["Zone Z-014","Carrying capacity gap: 1,120 people"],["Safe Site S-008","Capacity at 87% after allocation"],["Zone Z-022","Road accessibility score decreased"]].map(a=><div key={a[0]} className="flex gap-3 p-3 rounded-xl bg-surface mb-2"><AlertTriangle size={16} className="text-danger"/><div><b className="text-xs">{a[0]}</b><div className="text-xs">{a[1]}</div></div></div>)}</div>
<div className="bg-white border border-line rounded-2xl shadow-soft p-5"><div className="flex justify-between mb-4"><div><h2 className="font-semibold">Relocation progress</h2><p className="text-xs text-muted mt-1">Current planning cycle</p></div><b className="text-xl">72%</b></div><div className="h-3 bg-surface rounded-full overflow-hidden"><div className="h-full bg-forest rounded-full w-[72%]"/></div><div className="grid grid-cols-3 gap-3 mt-5">{[["8,921","Relocated"],["2,104","In process"],["1,425","Pending"]].map(x=><div key={x[1]}><b>{x[0]}</b><div className="text-[10px] text-muted">{x[1]}</div></div>)}</div></div></section>
<section className="mt-5 bg-white border border-line rounded-2xl shadow-soft p-5"><div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.15em] text-muted">Selected zone</div><h2 className="text-xl font-bold mt-1">{selected.name}</h2><p className="text-xs text-muted">{selected.id} • {selected.district}</p></div><span className="px-3 py-1.5 rounded-full text-xs font-bold bg-danger/10 text-danger">{selected.risk}</span></div><div className="grid sm:grid-cols-4 gap-4 mt-5">{[["Population",selected.population.toLocaleString()],["Households",selected.households.toLocaleString()],["Relocation progress",selected.progress+"%"],["Priority",selected.risk==="Critical"?"Immediate":"Short-term"]].map(x=><div key={x[0]} className="p-3 rounded-xl bg-surface"><div className="text-[10px] text-muted">{x[0]}</div><div className="font-bold mt-1">{x[1]}</div></div>)}</div></section>
</div></main></div></div>}
