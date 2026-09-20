import { json, requireSession, membersStore, memberFilesStore, settingsStore, defaultSettings } from "./_shared.mjs";

const clean = v => String(v ?? "").trim();
const categoryForAge = age => age <= 29 ? "Junior" : age <= 39 ? "Senior" : "Master";
const safeMember = m => ({
  code:m.code, createdAt:m.createdAt, name:m.name, dni:m.dni, phone:m.phone, email:m.email,
  age:m.age, level:m.level, category:m.category, address:m.address, district:m.district,
  paymentStatus:m.paymentStatus || "Pendiente", rulesAccepted:m.rulesAccepted === true,
  rulesAcceptedAt:m.rulesAcceptedAt || null, active:m.active !== false,
  hasFrontPhoto:!!m.hasFrontPhoto, hasDniPhoto:!!m.hasDniPhoto
});

export default async req => {
  try {
    const method=req.method.toUpperCase(), url=new URL(req.url);
    const store=membersStore(), list=await store.get("members",{type:"json"}) || [];

    if(method==="POST"){
      const fd=await req.formData();
      const body=Object.fromEntries([...fd.entries()].filter(([,v])=>typeof v==="string"));
      const front=fd.get("frontPhoto"), dniPhoto=fd.get("dniPhoto");
      const required=["name","dni","phone","email","age","level","address","district"];
      if(required.some(k=>!clean(body[k]))) return json({error:"Completa todos los datos obligatorios"},400);
      if(clean(body.rulesAccepted)!=="yes") return json({error:"Debes leer y aceptar las Reglas Generales"},400);
      const settings=await settingsStore().get("settings",{type:"json"}) || defaultSettings;
      if(!clean(settings.generalRules)) return json({error:"Las Reglas Generales todavía no han sido publicadas"},409);
      const age=Number(body.age);
      if(!Number.isInteger(age)||age<1||age>100) return json({error:"Edad no válida"},400);
      if(!["Básico","Intermedio","Avanzado"].includes(clean(body.level))) return json({error:"Nivel no válido"},400);
      if(list.some(m=>clean(m.dni)===clean(body.dni))) return json({error:"Este DNI ya está registrado como miembro"},409);
      const allowed=["image/jpeg","image/png","image/webp"];
      for(const [file,label] of [[front,"foto de frente"],[dniPhoto,"foto del DNI"]]){
        if(!(file instanceof File)||!file.size) return json({error:`Debes adjuntar la ${label}`},400);
        if(!allowed.includes(file.type)) return json({error:`La ${label} debe ser JPG, PNG o WEBP`},400);
        if(file.size>5*1024*1024) return json({error:`La ${label} no puede superar 5 MB`},400);
      }
      const code=`TG-M-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
      const now=new Date().toISOString();
      const member={code,createdAt:now,name:clean(body.name),dni:clean(body.dni),phone:clean(body.phone),
        email:clean(body.email),age,level:clean(body.level),category:categoryForAge(age),address:clean(body.address),
        district:clean(body.district),paymentStatus:"Pendiente",rulesAccepted:true,rulesAcceptedAt:now,active:true,
        hasFrontPhoto:true,hasDniPhoto:true};
      await memberFilesStore().set(`${code}-front`,await front.arrayBuffer(),{metadata:{contentType:front.type}});
      await memberFilesStore().set(`${code}-dni`,await dniPhoto.arrayBuffer(),{metadata:{contentType:dniPhoto.type}});
      list.push(member); await store.setJSON("members",list);

      // La inscripción del miembro no debe fallar si OneSignal está temporalmente caído.
      try {
        const apiKey = Netlify.env.get("ONESIGNAL_API_KEY");
        if (apiKey) {
          const push = await fetch("https://api.onesignal.com/notifications", {
            method: "POST",
            headers: {"content-type":"application/json","authorization":`Key ${apiKey}`},
            body: JSON.stringify({
              app_id:"c7196a39-f43f-40c1-a4a8-bafeadbafd10",
              filters:[{field:"tag",key:"role",relation:"=",value:"admin"}],
              headings:{es:"🏐 NUEVO MIEMBRO – TREASURESGOD",en:"🏐 NUEVO MIEMBRO – TREASURESGOD"},
              contents:{es:`${member.name} se inscribió al grupo · Nivel: ${member.level} · Categoría: ${member.category} · Inscripción: Pendiente`,en:`${member.name} se inscribió al grupo · Nivel: ${member.level} · Categoría: ${member.category} · Inscripción: Pendiente`},
              url:"https://treasuresgod.netlify.app/admin.html#miembrosAdmin"
            })
          });
          if (!push.ok) console.error("OneSignal miembro:",push.status,await push.text());
        }
      } catch(pushError) { console.error("No se pudo enviar la notificación de nuevo miembro",pushError); }

      return json({ok:true,member:safeMember(member)},201);
    }

    if(!(await requireSession(req))) return json({error:"No autorizado"},401);

    if(method==="GET") return json(list.map(safeMember));

    if(method==="PATCH"){
      const b=await req.json(), i=list.findIndex(m=>m.code===b.code);
      if(i<0)return json({error:"Miembro no encontrado"},404);
      const allowed={paymentStatus:["Pendiente","Pagado"],active:[true,false]};
      if(b.paymentStatus!==undefined){
        if(!allowed.paymentStatus.includes(b.paymentStatus))return json({error:"Estado de pago no válido"},400);
        list[i].paymentStatus=b.paymentStatus;
      }
      if(b.active!==undefined)list[i].active=!!b.active;
      await store.setJSON("members",list); return json(safeMember(list[i]));
    }

    if(method==="DELETE"){
      const code=url.searchParams.get("code"), i=list.findIndex(m=>m.code===code);
      if(i<0)return json({error:"Miembro no encontrado"},404);
      list.splice(i,1); await store.setJSON("members",list);
      try{await memberFilesStore().delete(`${code}-front`);await memberFilesStore().delete(`${code}-dni`)}catch{}
      return json({ok:true});
    }
    return json({error:"Método no permitido"},405);
  } catch(e){console.error(e);return json({error:"Error interno"},500)}
};