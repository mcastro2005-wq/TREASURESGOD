import { getStore } from '@netlify/blobs';
const store=()=>getStore('treasuresgod',{consistency:'strong'});
const defaults=[
{id:'TG-001',name:'Carrera TreasuresGod 5K',date:'2026-10-18',time:'08:00',location:'Lima',capacity:300,price:35,description:'Carrera 5K abierta a todos los niveles.'},
{id:'TG-002',name:'Torneo TreasuresGod',date:'2026-11-08',time:'09:00',location:'Lima',capacity:120,price:50,description:'Torneo deportivo TreasuresGod.'},
{id:'TG-003',name:'Caminata Familiar',date:'2026-12-06',time:'08:30',location:'Lima',capacity:250,price:25,description:'Actividad deportiva para toda la familia.'}];
async function read(){let x=await store().get('events',{type:'json'});if(!x){await store().setJSON('events',defaults);return defaults}return x}
function auth(req){return req.headers.get('cookie')?.includes('tg_session=')}
export default async req=>{try{const u=new URL(req.url),method=req.method;let events=await read();if(method==='GET')return Response.json(events);
if(!auth(req))return new Response('No autorizado',{status:401});
if(method==='POST'){const b=await req.json();const e={id:b.id||`TG-${Date.now().toString().slice(-6)}`,...b,capacity:Number(b.capacity),price:Number(b.price)};events.push(e);await store().setJSON('events',events);return Response.json(e,{status:201})}
if(method==='PUT'){const b=await req.json();events=events.map(e=>e.id===b.id?{...e,...b,capacity:Number(b.capacity),price:Number(b.price)}:e);await store().setJSON('events',events);return Response.json({ok:true})}
if(method==='DELETE'){const id=u.searchParams.get('id');events=events.filter(e=>e.id!==id);await store().setJSON('events',events);return Response.json({ok:true})}
return new Response('Método no permitido',{status:405})}catch(e){return Response.json({error:e.message},{status:500})}}
export const config={path:'/api/events'};
