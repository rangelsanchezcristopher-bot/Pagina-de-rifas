const API_URL = import.meta.env.VITE_API_URL;

// BOLETOS (web)
export async function getTickets(raffleId) {
  const r = await fetch(`${API_URL}/api/tickets/${raffleId}`);
  const data = await r.json();
  if (!r.ok || data.ok === false) throw new Error(data.error || "Error");
  return data; // { ok, raffleId, tickets }
}

// RESERVAR
export async function reserveTickets(payload) {
  const r = await fetch(`${API_URL}/api/reserve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok || data.ok === false) throw new Error(data.error || "Error");
  return data; // { ok, raffleId, tickets, total, ... }
}

// ADMIN
export async function getAdminTickets(raffleId = 1) {
  const r = await fetch(`${API_URL}/api/admin/tickets?raffleId=${raffleId}`);
  const data = await r.json();
  if (!r.ok || data.ok === false) throw new Error(data.error || "Error");
  return data;
}

export async function adminPayTicket(raffleId, number) {
  const r = await fetch(`${API_URL}/api/admin/tickets/${raffleId}/${number}/pay`, {
    method: "PUT",
  });
  const data = await r.json();
  if (!r.ok || data.ok === false) throw new Error(data.error || "Error");
  return data;
}

export async function adminFreeTicket(raffleId, number) {
  const r = await fetch(`${API_URL}/api/admin/tickets/${raffleId}/${number}/free`, {
    method: "PUT",
  });
  const data = await r.json();
  if (!r.ok || data.ok === false) throw new Error(data.error || "Error");
  return data;
}
