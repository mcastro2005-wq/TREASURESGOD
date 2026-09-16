import { getStore } from "@netlify/blobs";

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function getSession(req) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)tg_session=([^;]+)/);
  if (!match) return false;
  try {
    const value = decodeURIComponent(match[1]);
    const [exp, sig] = value.split(".");
    const secret = Netlify.env.get("SESSION_SECRET") || Netlify.env.get("ADMIN_PASSWORD");
    if (!secret || !exp || !sig || Number(exp) < Date.now()) return false;
    return sig === `${secret}-${exp}`.split("").reverse().join("");
  } catch { return false; }
}

export async function requireSession(req) {
  return getSession(req);
}

export function sessionCookie() {
  const exp = Date.now() + 8 * 60 * 60 * 1000;
  const secret = Netlify.env.get("SESSION_SECRET") || Netlify.env.get("ADMIN_PASSWORD");
  const sig = `${secret}-${exp}`.split("").reverse().join("");
  return `tg_session=${encodeURIComponent(`${exp}.${sig}`)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export const eventsStore = () => getStore("treasuresgod-events", { consistency: "strong" });
export const registrationsStore = () => getStore("treasuresgod-registrations", { consistency: "strong" });

export const defaultEvents = [
  { id:"TG-001", name:"CARRERA TREASURESGOD 5K", date:"2026-10-18", time:"08:00", timeEnd:"10:00", location:"LIMA", capacity:300, price:35, comment:"Participa en una jornada deportiva para toda la familia.", active:true },
  { id:"TG-002", name:"TORNEO TREASURESGOD", date:"2026-11-08", time:"09:00", timeEnd:"13:00", location:"LIMA", capacity:120, price:50, comment:"Torneo deportivo con inscripción previa.", active:true },
  { id:"TG-003", name:"CAMINATA FAMILIAR", date:"2026-12-06", time:"08:30", timeEnd:"11:30", location:"LIMA", capacity:250, price:25, comment:"Actividad familiar abierta a todos.", active:true }
];
