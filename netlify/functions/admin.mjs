import { registrationsStore, eventsStore, json, requireSession } from "./_shared.mjs";
export default async (req) => {
  if (!(await requireSession(req))) return json({error:"No autorizado"},401);
  try {
    const store=registrationsStore(); const list=await store.get("registrations",{type:"json"}) || [];
    if(req.method==="GET") { const events=await eventsStore().get("events",{type:"json"}) || []; return json({registrations:list,events}); }
    if(req.method==="PATCH") { const b=await req.json(); const i=list.findIndex(r=>r.code===b.code); if(i<0)return json({error:"Inscripción no encontrada"},404); list[i].paymentStatus=b.paymentStatus; await store.setJSON("registrations",list); return json(list[i]); }
    if(req.method==="DELETE") { const u=new URL(req.url); const code=u.searchParams.get("code"); const next=list.filter(r=>r.code!==code); if(next.length===list.length)return json({error:"Inscripción no encontrada"},404); await store.setJSON("registrations",next); return json({ok:true}); }
    return json({error:"Método no permitido"},405);
  } catch(e){console.error(e);return json({error:"Error interno",detail:e.message},500)}
};
