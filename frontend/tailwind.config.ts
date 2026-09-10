import type {Config} from "tailwindcss";
const config:Config={content:["./app/**/*.{js,ts,jsx,tsx,mdx}"],theme:{extend:{
colors:{ink:"#13251E",muted:"#64736D",surface:"#F6F8F5",line:"#E1E8E3",forest:"#1E5B45",danger:"#B42318",amber:"#B7791F",safe:"#237A57"},
boxShadow:{soft:"0 10px 35px rgba(19,37,30,.07)"}}},plugins:[]}; export default config;