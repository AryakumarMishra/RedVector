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

function campaignBody({ targetType, targetModel, targetConfig, categories, useJudge }) {
  return {
    target_type: targetType || "litellm",
    target_model: targetModel || null,
    target_config: targetConfig || null,
    categories: categories && categories.length ? categories : null,
    use_judge: useJudge,
  };
}

export async function createCampaign(payload) {
  const res = await fetch(`${API_BASE}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campaignBody(payload)),
  });
  return handleResponse(res);
}

export async function multiturnCampaign(payload) {
  const res = await fetch(`${API_BASE}/campaigns/multiturn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campaignBody(payload)),
  });
  return handleResponse(res);
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}