import {getStore} from '@netlify/blobs';
const store=()=>getStore('treasuresgod',{consistency:'strong'});
export default async req=>{try{if(req.method!=='POST')return new Response('Método no permitido',{status:405});const b=await req.json();if(!b.name||!b.dni||!b.phone||!b.email||!b.eventId)return Response.json({error:'Completa los campos obligatorios'},{status:400});const rows=await store().get('registrations',{type:'json'})||[];const r={...b,code:`TG-${Math.random().toString(36).slice(2,10).toUpperCase()}`,paymentStatus:'Pendiente',createdAt:new Date().toISOString()};rows.push(r);await store().setJSON('registrations',rows);return Response.json(r,{status:201})}catch(e){return Response.json({error:e.message},{status:500})}};
export const config={path:'/api/register'};
