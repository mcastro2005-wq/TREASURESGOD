import { registrationsStore, eventsStore, settingsStore, defaultSettings, json, requireSession } from "./_shared.mjs";
export default async (req) => {
  if (!(await requireSession(req))) return json({error:"No autorizado"},401);
  try {
    const store=registrationsStore(); const list=await store.get("registrations",{type:"json"}) || [];
    if(req.method==="GET") { const events=await eventsStore().get("events",{type:"json"}) || []; const settings=await settingsStore().get("settings",{type:"json"}) || defaultSettings; return json({registrations:list,events,settings}); }
    if(req.method==="PATCH") { const b=await req.json(); const i=list.findIndex(r=>r.code===b.code); if(i<0)return json({error:"Inscripción no encontrada"},404); if (b.paymentStatus !== undefined) list[i].paymentStatus=b.paymentStatus; if (b.roleStatus !== undefined) list[i].roleStatus=String(b.roleStatus||"Jugador inscrito"); if (b.confirmationStatus !== undefined) list[i].confirmationStatus=String(b.confirmationStatus||"Pendiente"); if (b.disciplineStatus !== undefined) list[i].disciplineStatus=String(b.disciplineStatus||"Sin amonestación"); await store.setJSON("registrations",list); return json(list[i]); }
    if(req.method==="DELETE") { const u=new URL(req.url); const code=u.searchParams.get("code"); const next=list.filter(r=>r.code!==code); if(next.length===list.length)return json({error:"Inscripción no encontrada"},404); await store.setJSON("registrations",next); return json({ok:true}); }
    return json({error:"Método no permitido"},405);
  } catch(e){console.error(e);return json({error:"Error interno",detail:e.message},500)}
};
