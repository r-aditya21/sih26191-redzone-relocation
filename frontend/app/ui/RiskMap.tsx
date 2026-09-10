"use client";
import {MapContainer,TileLayer,Circle,Popup} from "react-leaflet"; import "leaflet/dist/leaflet.css";
const points=[
{id:"Z-014",name:"Bhagirathi Valley",district:"Uttarkashi",pos:[30.735,78.435] as [number,number],risk:"Critical",population:4821,households:1204,progress:78},
{id:"Z-022",name:"Mandakini Belt",district:"Rudraprayag",pos:[30.285,79.065] as [number,number],risk:"High",population:3290,households:846,progress:54},
{id:"Z-031",name:"Alaknanda Slope",district:"Chamoli",pos:[30.38,79.33] as [number,number],risk:"High",population:2745,households:702,progress:42},
{id:"Z-009",name:"Tehri Ridge",district:"Tehri Garhwal",pos:[30.38,78.48] as [number,number],risk:"Moderate",population:1930,households:511,progress:21}];
export default function RiskMap({zones,onSelect}:{zones:any[];onSelect:(z:any)=>void}){
const visible=points.filter(p=>zones.some(z=>z.id===p.id));
return <MapContainer center={[30.5,78.7]} zoom={8} scrollWheelZoom><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{visible.map(p=>{const c=p.risk==="Critical"?"#B42318":p.risk==="High"?"#D97706":"#B7791F";return <Circle key={p.id} center={p.pos} radius={p.risk==="Critical"?11500:p.risk==="High"?9000:7000} pathOptions={{color:c,fillColor:c,fillOpacity:.24,weight:2}} eventHandlers={{click:()=>onSelect(p)}}><Popup><b>{p.name}</b><br/>{p.id} • {p.risk} risk<br/>Population: {p.population.toLocaleString()}</Popup></Circle>})}</MapContainer>}