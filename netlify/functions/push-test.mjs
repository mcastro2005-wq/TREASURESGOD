import { json, requireSession } from "./_shared.mjs";

const APP_ID = "c7196a39-f43f-40c1-a4a8-bafeadbafd10";

async function sendPush(contents) {
  const apiKey = Netlify.env.get("ONESIGNAL_API_KEY");
  if (!apiKey) return { ok:false, status:500, data:{error:"ONESIGNAL_API_KEY no configurada"} };
  const res = await fetch("https://api.onesignal.com/notifications", {
    method:"POST",
    headers:{"content-type":"application/json","authorization":`Key ${apiKey}`},
    body:JSON.stringify({
      app_id:APP_ID,
      filters:[{field:"tag",key:"role",relation:"=",value:"admin"}],
      headings:{es:"TREASURESGOD · Prueba",en:"TREASURESGOD · Prueba"},
      contents:{es:contents,en:contents},
      url:"https://treasuresgod.netlify.app/admin.html"
    })
  });
  let data; try { data = await res.json(); } catch { data = {raw:await res.text()}; }
  return {ok:res.ok,status:res.status,data};
}

export default async (req) => {
  if (!(await requireSession(req))) return json({error:"No autorizado"},401);
  if (req.method !== "POST") return json({error:"Método no permitido"},405);
  try {
    const result = await sendPush("Si ves este mensaje, las notificaciones push de TreasuresGod funcionan correctamente.");
    if (!result.ok) return json({error:"OneSignal rechazó el envío",providerStatus:result.status,provider:result.data},502);
    return json({ok:true,provider:result.data});
  } catch(e) {
    console.error("push-test",e);
    return json({error:"No se pudo contactar OneSignal",detail:e.message},500);
  }
};
