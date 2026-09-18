import { registrationsStore, eventsStore, json } from "./_shared.mjs";

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Método no permitido" }, 405);
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("evento");
    if (!eventId) return json({ error: "Falta el evento" }, 400);

    const events = await eventsStore().get("events", { type: "json" }) || [];
    const event = events.find(e => e.id === eventId);
    if (!event) return json({ error: "Evento no encontrado" }, 404);

    const registrations = await registrationsStore().get("registrations", { type: "json" }) || [];
    const list = registrations
      .filter(r => r.eventId === eventId)
      .map(r => ({ name: r.name, age: r.age, level: r.level, category: r.category, code: r.code }))
      .sort((a,b) => a.name.localeCompare(b.name, "es"));

    return json({ event: { id: event.id, name: event.name, capacity: Number(event.capacity || 0), date: event.date, time: event.time, timeEnd: event.timeEnd, location: event.location, comment: event.comment || "", status: event.status || "Programado" }, total: list.length, registrations: list });
  } catch (e) {
    console.error(e);
    return json({ error: "No se pudo cargar la lista" }, 500);
  }
};
