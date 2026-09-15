import { eventsStore, registrationsStore, json } from "./_shared.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({error:"Método no permitido"},405);
  try {
    const body=await req.json();
    const required=["eventId","name","dni","phone","email","category","paymentMethod"];
    if(required.some(k=>!String(body[k]??"").trim())) return json({error:"Completa todos los campos obligatorios"},400);
    const events=await eventsStore().get("events",{type:"json"}) || [];
    const event=events.find(e=>e.id===body.eventId);
    if(!event) return json({error:"Evento no encontrado"},404);
    const store=registrationsStore(); const list=await store.get("registrations",{type:"json"}) || [];
    const count=list.filter(r=>r.eventId===event.id).length;
    if(count>=Number(event.capacity)) return json({error:"Cupos agotados"},409);
    const registration={code:`TG-${Math.random().toString(36).slice(2,10).toUpperCase()}`,createdAt:new Date().toISOString(),eventId:event.id,eventName:event.name,name:String(body.name).trim(),dni:String(body.dni).trim(),phone:String(body.phone).trim(),email:String(body.email).trim(),category:String(body.category).trim(),paymentMethod:String(body.paymentMethod).trim(),paymentReference:String(body.paymentReference||"").trim(),paymentStatus:"Pendiente"};
    list.push(registration); await store.setJSON("registrations",list); return json(registration,201);
  } catch(e){ console.error(e); return json({error:"No se pudo registrar",detail:e.message},500); }
};
