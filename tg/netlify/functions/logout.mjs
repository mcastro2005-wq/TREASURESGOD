import { json } from "./_shared.mjs";
export default async () => new Response(JSON.stringify({ok:true}), {status:200,headers:{"content-type":"application/json; charset=utf-8","set-cookie":"tg_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict"}});
