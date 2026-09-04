export const theme = {
  colors: {
    bg: "#09090B",
    bg2: "#0D0F12",
    panel: "#111318",
    elevated: "#15181D",
    input: "#0B0D10",
    border: "#272B33",
    borderSubtle: "#1C2027",
    borderHover: "#343A46",
    text: "#E9EBEF",
    textSecondary: "#9AA1AE",
    textMuted: "#6B7280",
    accent: "#3B82F6",
    accentHover: "#60A5FA",
    accentSurface: "#172554",
    critical: "#EF4444",
    high: "#F97316",
    medium: "#EAB308",
    low: "#22C55E",
    info: "#60A5FA",
  },
  fonts: {
    sans:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 10,
  },
};

export const CATEGORY_LABELS = {
  prompt_injection: "Prompt Injection",
  jailbreak: "Jailbreak",
  context_poisoning: "Context Poisoning",
  escalating_jailbreak: "Escalating Jailbreak",
  rag_poisoning: "RAG Poisoning",
  system_prompt_leakage: "System Prompt Leakage",
  sensitive_info_disclosure: "Sensitive Information Disclosure",
  improper_output_handling: "Improper Output Handling",
  unbounded_consumption: "Unbounded Consumption",
};

export function categoryLabel(key) {
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function targetLabel(campaign) {
  return campaign.target_label || campaign.target_model || "Untitled campaign";
}

export function overallVulnerability(scores) {
  if (!scores || !scores.length) return 0;
  const total = scores.reduce((sum, s) => sum + s.total, 0);
  const vulnerable = scores.reduce((sum, s) => sum + s.vulnerable, 0);
  return total ? vulnerable / total : 0;
}

// Exposure level of a target based on the fraction of payloads that landed.
export function severityForScore(score) {
  if (score >= 0.66) return { color: "#EF4444", label: "Critical" };
  if (score >= 0.33) return { color: "#F97316", label: "High" };
  return { color: "#22C55E", label: "Low" };
}

export function scoreColor(score) {
  if (score >= 0.66) return "#EF4444";
  if (score >= 0.33) return "#F97316";
  return "#22C55E";
}