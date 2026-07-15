import { useState } from "react";

const CATEGORIES = [
  { key: "prompt_injection", label: "Prompt Injection" },
  { key: "jailbreak", label: "Jailbreak" },
  { key: "rag_poisoning", label: "RAG Poisoning" },
];

export default function NewCampaignForm({ onSubmit, submitting }) {
  const [targetModel, setTargetModel] = useState("groq/llama-3.1-8b-instant");
  const [selectedCategories, setSelectedCategories] = useState(
    CATEGORIES.map((c) => c.key)
  );
  const [useJudge, setUseJudge] = useState(true);

  function toggleCategory(key) {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ targetModel, categories: selectedCategories, useJudge });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: "1px solid #26262a",
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
        background: "#18181b",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <label style={label}>Target model (LiteLLM format)</label>
        <input
          value={targetModel}
          onChange={(e) => setTargetModel(e.target.value)}
          placeholder="groq/llama-3.1-8b-instant"
          style={input}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={label}>Attack categories</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.key}
              onClick={() => toggleCategory(c.key)}
              style={{
                ...chip,
                background: selectedCategories.includes(c.key) ? "#2563eb" : "#232327",
                color: selectedCategories.includes(c.key) ? "#fff" : "#9a9aa2",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          id="use-judge"
          checked={useJudge}
          onChange={(e) => setUseJudge(e.target.checked)}
        />
        <label htmlFor="use-judge" style={{ fontSize: 13, color: "#9a9aa2" }}>
          Use LLM-judge scoring (doubles LLM calls — turn off if rate-limited)
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || selectedCategories.length === 0}
        style={{
          ...button,
          opacity: submitting || selectedCategories.length === 0 ? 0.6 : 1,
        }}
      >
        {submitting ? "Running campaign…" : "Run campaign"}
      </button>
    </form>
  );
}

const label = {
  display: "block",
  fontSize: 12,
  color: "#9a9aa2",
  marginBottom: 6,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111113",
  color: "#e8e8ea",
  fontSize: 14,
  boxSizing: "border-box",
};

const chip = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "none",
  fontSize: 13,
  cursor: "pointer",
};

const button = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};