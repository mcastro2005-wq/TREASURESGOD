import { getStore } from "@netlify/blobs";
import { eventsStore, json, requireSession } from "./_shared.mjs";

const photosStore = () => getStore("treasuresgod-event-photos", { consistency: "strong" });
const MAX = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function getEvent(id) {
  const events = await eventsStore().get("events", { type: "json" }) || [];
  return events.find(e => e.id === id);
}

export default async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("event");
    if (!id) return json({ error: "Falta el evento" }, 400);

    if (req.method === "GET") {
      const event = await getEvent(id);
      if (!event?.photoKey) return new Response("", { status: 404 });
      const blob = await photosStore().get(event.photoKey, { type: "blob" });
      if (!blob) return new Response("", { status: 404 });
      const contentType = event.photoType || blob.type || "image/jpeg";
      return new Response(blob, { status: 200, headers: { "content-type": contentType, "cache-control": "no-store" } });
    }

    if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
    if (!(await requireSession(req))) return json({ error: "No autorizado" }, 401);

    const event = await getEvent(id);
    if (!event) return json({ error: "Evento no encontrado" }, 404);
    const form = await req.formData();
    const file = form.get("photo");
    if (!(file instanceof File)) return json({ error: "Selecciona una foto" }, 400);
    if (!TYPES.has(file.type)) return json({ error: "Formato no permitido. Usa JPG, PNG o WEBP." }, 400);
    if (file.size > MAX) return json({ error: "La foto no puede superar 5 MB" }, 400);

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const key = `${id}.${ext}`;
    await photosStore().set(key, file, { metadata: { contentType: file.type } });

    const events = await eventsStore().get("events", { type: "json" }) || [];
    const i = events.findIndex(e => e.id === id);
    if (i >= 0) {
      events[i] = { ...events[i], photoKey: key, photoType: file.type };
      await eventsStore().setJSON("events", events);
    }
    return json({ ok: true, photoKey: key });
  } catch (e) {
    console.error(e);
    return json({ error: "Error interno", detail: e.message }, 500);
  }
};
