"use client";
import {MapContainer,TileLayer,Circle,Popup} from "react-leaflet"; import "leaflet/dist/leaflet.css";
// FIX: this list previously covered only 4 of the 8 zones used across the
// rest of the app (Risk Zones, Population, Relocation). Selecting one of
// the other 4 zones — Pindar Basin, Bhilangana Fringe, Kali Ganga Bank,
// Dhauliganga Terrace — silently rendered a blank map with no marker.
const points=[
{id:"Z-014",name:"Bhagirathi Valley",district:"Uttarkashi",pos:[30.735,78.435] as [number,number],risk:"Critical",population:4821,households:1204,progress:78},
{id:"Z-022",name:"Mandakini Belt",district:"Rudraprayag",pos:[30.285,79.065] as [number,number],risk:"High",population:3290,households:846,progress:54},
{id:"Z-031",name:"Alaknanda Slope",district:"Chamoli",pos:[30.38,79.33] as [number,number],risk:"High",population:2745,households:702,progress:42},
{id:"Z-009",name:"Tehri Ridge",district:"Tehri Garhwal",pos:[30.38,78.48] as [number,number],risk:"Moderate",population:1930,households:511,progress:21},
{id:"Z-017",name:"Pindar Basin",district:"Chamoli",pos:[30.187,79.593] as [number,number],risk:"Critical",population:3980,households:1012,progress:61},
{id:"Z-025",name:"Bhilangana Fringe",district:"Tehri Garhwal",pos:[30.52,78.80] as [number,number],risk:"High",population:2210,households:588,progress:33},
{id:"Z-011",name:"Kali Ganga Bank",district:"Pithoragarh",pos:[29.58,80.35] as [number,number],risk:"Moderate",population:1540,households:402,progress:47},
{id:"Z-006",name:"Dhauliganga Terrace",district:"Chamoli",pos:[30.55,79.70] as [number,number],risk:"Critical",population:2660,households:701,progress:29}];
export default function RiskMap({zones,onSelect}:{zones:any[];onSelect:(z:any)=>void}){
const visible=points.filter(p=>zones.some(z=>z.id===p.id));
return <MapContainer center={[30.5,78.7]} zoom={8} scrollWheelZoom><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{visible.map(p=>{const c=p.risk==="Critical"?"#B42318":p.risk==="High"?"#D97706":"#B7791F";return <Circle key={p.id} center={p.pos} radius={p.risk==="Critical"?11500:p.risk==="High"?9000:7000} pathOptions={{color:c,fillColor:c,fillOpacity:.24,weight:2}} eventHandlers={{click:()=>onSelect(p)}}><Popup><b>{p.name}</b><br/>{p.id} • {p.risk} risk<br/>Population: {p.population.toLocaleString()}</Popup></Circle>})}</MapContainer>}