// ── Backend URL ───────────────────────────────────────────────
// Change this if you deploy the backend
export const API_BASE = "http://localhost:5000/api";

// ── Auth ──────────────────────────────────────────────────────
export async function registerUser(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// ── ML: Fetch nearby receivers from MongoDB ───────────────────
// Sends lat/lng + food details → backend runs ML scoring on DB
export async function fetchNearbyReceivers({ lat, lng, qty, foodType, city }) {
  const params = new URLSearchParams({ lat, lng, qty, foodType });
  if (city) params.append("city", city);
  const res = await fetch(`${API_BASE}/receivers/nearby?${params}`);
  const data = await res.json();
  return data.receivers || [];
}

// ── Submit donation to DB ─────────────────────────────────────
export async function submitDonation(data) {
  const res = await fetch(`${API_BASE}/donations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Get active need posts for homepage ────────────────────────
export async function fetchNeedPosts() {
  const res = await fetch(`${API_BASE}/needposts`);
  return res.json();
}

// ── Post a need (NGO form submission) ─────────────────────────
export async function postNeed(data) {
  const res = await fetch(`${API_BASE}/needposts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}