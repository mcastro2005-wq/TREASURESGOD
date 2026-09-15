import { getStore } from "@netlify/blobs";
import { requireSession, json } from "./_shared.mjs";

export default async (req) => {
  if (!(await requireSession(req))) return json({ error: "No autorizado" }, 401);
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return json({ error: "Falta el código" }, 400);

  const store = getStore("treasuresgod-receipts", { consistency: "strong" });
  const { blobs } = await store.list({ prefix: `${code}.` });
  if (!blobs?.length) return json({ error: "Comprobante no encontrado" }, 404);

  const key = blobs[0].key;
  const data = await store.get(key, { type: "arrayBuffer" });
  if (!data) return json({ error: "Comprobante no encontrado" }, 404);

  const ext = key.split(".").pop().toLowerCase();
  const contentType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return new Response(data, {
    headers: { "content-type": contentType, "content-disposition": `inline; filename="${key}"` }
  });
};
