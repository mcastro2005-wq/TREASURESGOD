export default async()=>new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Set-Cookie':'tg_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'}});
export const config={path:'/api/logout'};
