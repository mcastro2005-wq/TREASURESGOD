import { eventsStore, registrationsStore, defaultEvents, json, requireSession } from "./_shared.mjs";

async function readEvents() {
  const store = eventsStore();
  const data = await store.get("events", { type: "json" });
  if (Array.isArray(data)) return data;
  await store.setJSON("events", defaultEvents);
  return defaultEvents;
}

export default async (req) => {
  try {
    const method = req.method.toUpperCase();
    if (method === "GET") {
      const events = await readEvents();
      const regs = await registrationsStore().get("registrations", { type: "json" }) || [];
      return json(events.map(e => ({ ...e, registered: regs.filter(r => r.eventId === e.id).length, remaining: Math.max(0, Number(e.capacity) - regs.filter(r => r.eventId === e.id).length) })));
    }
    if (!(await requireSession(req))) return json({ error: "No autorizado" }, 401);
    if (method === "POST") {
      const body = await req.json();
      const events = await readEvents();
      const event = { id: body.id || `TG-${Date.now()}`, name:String(body.name||"").trim(), date:body.date, time:body.time, location:String(body.location||"").trim(), capacity:Number(body.capacity||0), price:Number(body.price||0), active: body.active !== false };
      if (!event.name || !event.date || !event.time || !event.timeEnd || !event.location || event.capacity < 1) return json({error:"Completa los datos del evento"},400);
      events.push(event); await eventsStore().setJSON("events", events); return json(event,201);
    }
    if (method === "PUT") {
      const body = await req.json(); const events = await readEvents(); const i=events.findIndex(e=>e.id===body.id);
      if(i<0) return json({error:"Evento no encontrado"},404);
      events[i]={...events[i],...body,timeEnd:body.timeEnd || "",capacity:Number(body.capacity),price:Number(body.price)}; await eventsStore().setJSON("events",events); return json(events[i]);
    }
    if (method === "DELETE") {
      const url=new URL(req.url); const id=url.searchParams.get("id"); const events=await readEvents(); const next=events.filter(e=>e.id!==id);
      if(next.length===events.length) return json({error:"Evento no encontrado"},404); await eventsStore().setJSON("events",next); return json({ok:true});
    }
    return json({error:"Método no permitido"},405);
  } catch (e) { console.error(e); return json({error:"Error interno", detail:e.message},500); }
};
