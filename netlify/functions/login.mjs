import { json, sessionCookie } from "./_shared.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({error:"Método no permitido"},405);
  const { password } = await req.json();
  const expected = Netlify.env.get("ADMIN_PASSWORD");
  if (!expected || password !== expected) return json({error:"Contraseña incorrecta"},401);
  return new Response(JSON.stringify({ok:true}), { status:200, headers:{"content-type":"application/json; charset=utf-8","set-cookie":sessionCookie()} });
};
