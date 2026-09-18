import { json, sessionCookie, createSessionToken } from "./_shared.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({error:"Método no permitido"},405);
  const { password } = await req.json();
  const expected = Netlify.env.get("ADMIN_PASSWORD") || Netlify.env.get("admin_password");
  const legacy = Netlify.env.get("admin_password");
  const valid = typeof password === "string" && ((expected && password === expected) || (legacy && password === legacy));
  if (!valid) return json({error:"Contraseña incorrecta"},401);
  const token = createSessionToken();
  return new Response(JSON.stringify({ok:true, token}), { status:200, headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","set-cookie":sessionCookie(token)} });
};
