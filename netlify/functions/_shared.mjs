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
  { id:"TG-001", name:"Carrera TreasuresGod 5K", date:"2026-10-18", time:"08:00", location:"Lima", capacity:300, price:35, active:true },
  { id:"TG-002", name:"Torneo TreasuresGod", date:"2026-11-08", time:"09:00", location:"Lima", capacity:120, price:50, active:true },
  { id:"TG-003", name:"Caminata Familiar", date:"2026-12-06", time:"08:30", location:"Lima", capacity:250, price:25, active:true }
];
