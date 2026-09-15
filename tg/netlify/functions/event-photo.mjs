import { eventPhotosStore, json, requireSession, eventsStore } from "./_shared.mjs";

export default async (req) => {
  try {
    const method = req.method.toUpperCase();
    const url = new URL(req.url);
    const eventId = url.searchParams.get("event") || url.searchParams.get("id");

    if (method === "GET") {
      if (!eventId) return json({ error: "Falta evento" }, 400);
      const events = await eventsStore().get("events", { type: "json" }) || [];
      const event = events.find(e => e.id === eventId);
      if (!event?.photoKey) return new Response("", { status: 404 });
      const item = await eventPhotosStore().getWithMetadata(event.photoKey, { type: "arrayBuffer" });
      if (!item?.data) return new Response("", { status: 404 });
      return new Response(item.data, {
        status: 200,
        headers: {
          "content-type": item.metadata?.contentType || "image/jpeg",
          "cache-control": "public, max-age=300"
        }
      });
    }

    if (!(await requireSession(req))) return json({ error: "No autorizado" }, 401);
    if (method !== "POST") return json({ error: "Método no permitido" }, 405);
    if (!eventId) return json({ error: "Falta evento" }, 400);

    const form = await req.formData();
    const file = form.get("photo");
    if (!file || typeof file.arrayBuffer !== "function") return json({ error: "Selecciona una imagen" }, 400);
    if (!String(file.type || "").startsWith("image/")) return json({ error: "Solo se permiten imágenes" }, 400);
    if (file.size > 5 * 1024 * 1024) return json({ error: "La imagen no debe superar 5 MB" }, 400);

    const events = await eventsStore().get("events", { type: "json" }) || [];
    const index = events.findIndex(e => e.id === eventId);
    if (index < 0) return json({ error: "Evento no encontrado" }, 404);

    const ext = (file.type.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "");
    const key = `${eventId}.${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();
    await eventPhotosStore().set(key, buffer, { metadata: { contentType: file.type } });

    events[index] = { ...events[index], photoKey: key };
    await eventsStore().setJSON("events", events);
    return json({ ok: true, photoUrl: `/api/event-photo?event=${encodeURIComponent(eventId)}` });
  } catch (e) {
    console.error(e);
    return json({ error: "Error interno", detail: e.message }, 500);
  }
};
