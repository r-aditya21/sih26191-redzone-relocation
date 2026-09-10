"use client";
import {useMemo,useState} from "react";
import {AreaChart,Area,BarChart,Bar,LineChart,Line,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from "recharts";
import {BarChart3,Bell,ChevronDown,CircleHelp,Download,FileText,Home,Layers3,LogOut,MapPinned,Menu,Shield,TrendingDown,TrendingUp,Users,X} from "lucide-react";

const relocationTrend=[
{month:"Mar",relocated:2140,target:2400},{month:"Apr",relocated:3320,target:3600},{month:"May",relocated:4610,target:4800},
{month:"Jun",relocated:5890,target:6000},{month:"Jul",relocated:7205,target:7200},{month:"Aug",relocated:8921,target:8400},
];
const riskByDistrict=[
{district:"Uttarkashi",critical:1,high:0,moderate:0},{district:"Chamoli",critical:2,high:1,moderate:0},
{district:"Rudraprayag",critical:0,high:1,moderate:0},{district:"Tehri Garhwal",critical:0,high:1,moderate:1},
{district:"Pithoragarh",critical:0,high:0,moderate:1},
];
const stageSplit=[{name:"Relocated",value:8921},{name:"In process",value:2104},{name:"Pending",value:1425}];
const stageColor=["var(--color-forest)","var(--color-orange)","var(--color-amber)"];
const capacityTrend=[
{month:"Mar",available:76},{month:"Apr",available:74},{month:"May",available:73},{month:"Jun",available:75},{month:"Jul",available:73},{month:"Aug",available:72},
];

export default function Analytics({onNavigate}:{onNavigate?:(view:string)=>void}){
const[mobileOpen,setMobileOpen]=useState(false);
const nav=[["Dashboard",Home],["Risk Zones",MapPinned],["Relocation",Layers3],["Resources",Shield],["Population",Users],["Analytics",BarChart3],["Reports",FileText]];
const totalStage=useMemo(()=>stageSplit.reduce((s,x)=>s+x.value,0),[]);

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
<nav className="space-y-1">{nav.map(([label,Icon]:any)=><button key={label} onClick={()=>{setMobileOpen(false);onNavigate?.(label)}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left ${label==="Analytics"?"bg-forest text-white":"hover:bg-surface"}`}><Icon size={17}/>{label}</button>)}</nav>
<div className="mt-8 border-t border-line pt-5"><div className="text-[10px] uppercase tracking-[.18em] text-muted px-3 mb-2">System</div><button className="w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface"><CircleHelp size={17}/>Help & methodology</button><button className="w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface"><LogOut size={17}/>Sign out</button></div>
<div className="mt-8 p-3 rounded-2xl bg-forest/5 border border-forest/10"><div className="text-xs font-semibold">Scoring model v1.0</div><div className="text-[11px] text-muted mt-1 leading-4">Hazard 45% • exposure 30% • urgency 25%</div></div>
</aside>
<main className="flex-1 min-w-0 p-4 md:p-7"><div className="max-w-[1500px] mx-auto">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"><div><div className="text-xs text-muted mb-2">State Disaster Management Authority / Analytics</div><h1 className="text-2xl md:text-3xl font-bold">Analytics</h1><p className="text-sm text-muted mt-1">Trends across relocation pace, risk concentration, and safe-site capacity.</p></div><div className="flex gap-2"><button className="px-4 py-2.5 bg-white border border-line rounded-xl text-sm flex gap-2 items-center"><Download size={16}/>Export report</button></div></div>

<section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
{[["Relocation pace","1,716/mo","vs. 1,400 planned",TrendingUp,"up"],["Critical zones","3","No change this cycle",TrendingUp,"flat"],["Avg. days to relocate","94","down from 118 last cycle",TrendingDown,"down"],["Safe capacity trend","-4pt","Since March baseline",TrendingDown,"down"]].map(([t,v,s,I,dir]:any)=><div key={t} className="bg-white border border-line rounded-2xl p-4 md:p-5 shadow-soft"><div className="flex justify-between"><span className="text-xs text-muted">{t}</span><div className={`p-2 rounded-lg ${dir==="down"?"bg-danger/10 text-danger":"bg-forest/10 text-forest"}`}><I size={17}/></div></div><div className="text-2xl font-bold mt-4">{v}</div><div className="text-[11px] text-muted mt-1">{s}</div></div>)}
</section>

<section className="grid xl:grid-cols-[1.55fr_.8fr] gap-5">

<div className="bg-white border border-line rounded-2xl shadow-soft p-5">
<div className="flex justify-between mb-1"><div><h2 className="font-semibold">Relocation pace vs. target</h2><p className="text-xs text-muted mt-1">Cumulative families relocated, Mar–Aug 2026</p></div></div>
<div className="h-[280px] mt-4">
<ResponsiveContainer width="100%" height="100%">
<AreaChart data={relocationTrend} margin={{left:-20,right:10,top:10,bottom:0}}>
<defs><linearGradient id="relocGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-forest)" stopOpacity={0.22}/><stop offset="100%" stopColor="var(--color-forest)" stopOpacity={0}/></linearGradient></defs>
<CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false}/>
<XAxis dataKey="month" tick={{fontSize:11,fill:"var(--color-muted)"}} axisLine={false} tickLine={false}/>
<YAxis tick={{fontSize:11,fill:"var(--color-muted)"}} axisLine={false} tickLine={false}/>
<Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"1px solid var(--color-line)"}}/>
<Area type="monotone" dataKey="target" stroke="var(--color-line)" strokeDasharray="4 4" fill="none" strokeWidth={2}/>
<Area type="monotone" dataKey="relocated" stroke="var(--color-forest)" strokeWidth={2.5} fill="url(#relocGrad)"/>
</AreaChart>
</ResponsiveContainer>
</div>
<div className="flex gap-4 mt-2 text-[11px] text-muted"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-forest inline-block"/>Relocated</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 border-t-2 border-dashed border-line inline-block"/>Target</span></div>
</div>

<div className="bg-white border border-line rounded-2xl shadow-soft p-5">
<div><h2 className="font-semibold">Relocation stage split</h2><p className="text-xs text-muted mt-1">Current cycle, all zones</p></div>
<div className="h-[200px] mt-2 relative">
<ResponsiveContainer width="100%" height="100%">
<PieChart>
<Pie data={stageSplit} dataKey="value" nameKey="name" innerRadius={58} outerRadius={80} paddingAngle={2}>
{stageSplit.map((_,i)=><Cell key={i} fill={stageColor[i]}/>)}
</Pie>
<Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"1px solid var(--color-line)"}}/>
</PieChart>
</ResponsiveContainer>
<div className="absolute inset-0 grid place-items-center pointer-events-none"><div className="text-center"><div className="text-xl font-bold">{totalStage.toLocaleString()}</div><div className="text-[10px] text-muted">total families</div></div></div>
</div>
<div className="mt-3 space-y-2">{stageSplit.map((s,i)=><div key={s.name} className="flex justify-between items-center text-xs"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:stageColor[i]}}/>{s.name}</span><span className="font-semibold">{s.value.toLocaleString()}</span></div>)}</div>
</div>

</section>

<section className="grid lg:grid-cols-2 gap-5 mt-5">

<div className="bg-white border border-line rounded-2xl shadow-soft p-5">
<div><h2 className="font-semibold">Risk concentration by district</h2><p className="text-xs text-muted mt-1">Zone count by severity</p></div>
<div className="h-[260px] mt-4">
<ResponsiveContainer width="100%" height="100%">
<BarChart data={riskByDistrict} margin={{left:-20,right:10,top:10,bottom:0}}>
<CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false}/>
<XAxis dataKey="district" tick={{fontSize:10,fill:"var(--color-muted)"}} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50}/>
<YAxis tick={{fontSize:11,fill:"var(--color-muted)"}} axisLine={false} tickLine={false} allowDecimals={false}/>
<Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"1px solid var(--color-line)"}}/>
<Bar dataKey="critical" stackId="r" fill="var(--color-danger)" radius={[0,0,0,0]}/>
<Bar dataKey="high" stackId="r" fill="var(--color-orange)" radius={[0,0,0,0]}/>
<Bar dataKey="moderate" stackId="r" fill="var(--color-amber)" radius={[4,4,0,0]}/>
</BarChart>
</ResponsiveContainer>
</div>
<div className="flex gap-4 mt-2 text-[11px] text-muted"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger inline-block"/>Critical</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"/>High</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"/>Moderate</span></div>
</div>

<div className="bg-white border border-line rounded-2xl shadow-soft p-5">
<div><h2 className="font-semibold">Safe site capacity available</h2><p className="text-xs text-muted mt-1">% of total capacity free, monthly</p></div>
<div className="h-[260px] mt-4">
<ResponsiveContainer width="100%" height="100%">
<LineChart data={capacityTrend} margin={{left:-20,right:10,top:10,bottom:0}}>
<CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false}/>
<XAxis dataKey="month" tick={{fontSize:11,fill:"var(--color-muted)"}} axisLine={false} tickLine={false}/>
<YAxis domain={[60,80]} tick={{fontSize:11,fill:"var(--color-muted)"}} axisLine={false} tickLine={false} unit="%"/>
<Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"1px solid var(--color-line)"}}/>
<Line type="monotone" dataKey="available" stroke="var(--color-danger)" strokeWidth={2.5} dot={{r:3}}/>
</LineChart>
</ResponsiveContainer>
</div>
<div className="mt-3 p-3 bg-danger/5 rounded-xl text-xs leading-5 text-danger"><b>Capacity is tightening.</b> Available headroom has dropped 4 points since March as intake outpaces new site commissioning.</div>
</div>

</section>
</div></main></div></div>}