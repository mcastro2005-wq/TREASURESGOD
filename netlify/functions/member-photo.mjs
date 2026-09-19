import { json, requireSession, memberFilesStore } from "./_shared.mjs";
export default async req=>{
  try{
    if(!(await requireSession(req)))return json({error:"No autorizado"},401);
    const u=new URL(req.url),code=u.searchParams.get("code"),kind=u.searchParams.get("kind");
    if(!code||!["front","dni"].includes(kind))return json({error:"Solicitud inválida"},400);
    const store=memberFilesStore(), key=`${code}-${kind}`;
    const meta=await store.getMetadata(key); const data=await store.get(key,{type:"arrayBuffer"});
    if(!data)return json({error:"Archivo no encontrado"},404);
    return new Response(data,{headers:{"content-type":meta?.metadata?.contentType||"image/jpeg","cache-control":"private, no-store"}});
  }catch(e){console.error(e);return json({error:"Error interno"},500)}
};