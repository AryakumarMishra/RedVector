const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function listCampaigns() {
  const res = await fetch(`${API_BASE}/campaigns`);
  return handleResponse(res);
}

export async function getCampaign(campaignId) {
  const res = await fetch(`${API_BASE}/campaigns/${campaignId}`);
  return handleResponse(res);
}

export async function createCampaign({ targetModel, categories, useJudge }) {
  const res = await fetch(`${API_BASE}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_model: targetModel,
      categories: categories && categories.length ? categories : null,
      use_judge: useJudge,
    }),
  });
  return handleResponse(res);
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}