import { eventsStore, registrationsStore, json } from "./_shared.mjs";
import { getStore } from "@netlify/blobs";

const receiptsStore = () => getStore("treasuresgod-receipts", { consistency: "strong" });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  try {
    const type = req.headers.get("content-type") || "";
    let body = {};
    let receipt = null;

    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const [key, value] of form.entries()) {
        if (key === "receipt" && value instanceof File && value.size > 0) receipt = value;
        else if (typeof value === "string") body[key] = value;
      }
    } else {
      body = await req.json();
    }

    const required = ["eventId", "name", "dni", "phone", "email", "age", "level", "category", "paymentMethod"];
    if (required.some(k => !String(body[k] ?? "").trim())) {
      return json({ error: "Completa todos los campos obligatorios" }, 400);
    }

    const events = await eventsStore().get("events", { type: "json" }) || [];
    const event = events.find(e => e.id === body.eventId && e.active !== false);
    if (!event) return json({ error: "Evento no encontrado o no disponible" }, 404);

    const store = registrationsStore();
    const list = await store.get("registrations", { type: "json" }) || [];
    const count = list.filter(r => r.eventId === event.id).length;
    const capacity = Number(event.capacity);
    if (count >= capacity) return json({ error: "Cupos agotados" }, 409);

    if (receipt) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(receipt.type)) return json({ error: "El comprobante debe ser JPG, PNG, WEBP o PDF" }, 400);
      if (receipt.size > 5 * 1024 * 1024) return json({ error: "El comprobante no puede superar 5 MB" }, 400);
    }

    const code = `TG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const age = Number(body.age);
    if (!Number.isInteger(age) || age < 1 || age > 100) return json({ error: "La edad debe estar entre 1 y 100 años" }, 400);

    const allowedLevels = ["Básico", "Intermedio", "Avanzado"];
    if (!allowedLevels.includes(String(body.level).trim())) return json({ error: "Selecciona un nivel válido" }, 400);

    const registration = {
      code,
      createdAt: new Date().toISOString(),
      eventId: event.id,
      eventName: event.name,
      name: String(body.name).trim(),
      dni: String(body.dni).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email).trim(),
      age,
      level: String(body.level).trim(),
      category: String(body.category).trim(),
      paymentMethod: String(body.paymentMethod).trim(),
      paymentReference: String(body.paymentReference || "").trim(),
      paymentStatus: "Pendiente",
      hasReceipt: Boolean(receipt)
    };

    if (receipt) {
      await receiptsStore().set(`${code}.${receipt.name.split(".").pop().toLowerCase()}`, await receipt.arrayBuffer());
    }

    list.push(registration);
    await store.setJSON("registrations", list);

    // La inscripción no debe fallar si el proveedor push está temporalmente caído.
    try {
      const apiKey = Netlify.env.get("ONESIGNAL_API_KEY");
      if (apiKey) {
        const push = await fetch("https://api.onesignal.com/notifications", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Key ${apiKey}`
          },
          body: JSON.stringify({
            app_id: "c7196a39-f43f-40c1-a4a8-bafeadbafd10",
            filters: [{ field: "tag", key: "role", relation: "=", value: "admin" }],
            headings: { es: "TREASURESGOD · Nueva inscripción", en: "TREASURESGOD · Nueva inscripción" },
            contents: { es: `${registration.name} · ${event.name} · ${registration.level} · ${registration.category}`, en: `${registration.name} · ${event.name} · ${registration.level} · ${registration.category}` },
            url: "https://treasuresgod.netlify.app/admin.html"
          })
        });
        if (!push.ok) console.error("OneSignal:", push.status, await push.text());
      } else {
        console.error("ONESIGNAL_API_KEY no configurada");
      }
    } catch (pushError) {
      console.error("No se pudo enviar la notificación push", pushError);
    }

    return json({ ...registration, remaining: Math.max(0, capacity - count - 1) }, 201);
  } catch (e) {
    console.error(e);
    return json({ error: "No se pudo registrar", detail: e.message }, 500);
  }
};
