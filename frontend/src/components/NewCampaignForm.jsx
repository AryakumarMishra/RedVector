import { useState } from "react";

const CATEGORIES = [
  { key: "prompt_injection", label: "Prompt Injection" },
  { key: "jailbreak", label: "Jailbreak" },
  { key: "rag_poisoning", label: "RAG Poisoning" },
];

export default function NewCampaignForm({ onSubmit, submitting }) {
  const [targetType, setTargetType] = useState("litellm");
  const [targetModel, setTargetModel] = useState("groq/llama-3.1-8b-instant");

  // HTTP target fields — for testing your own app instead of a bare model
  const [httpUrl, setHttpUrl] = useState("http://localhost:8001/chat");
  const [requestTemplate, setRequestTemplate] = useState('{"message": "{prompt}"}');
  const [responsePath, setResponsePath] = useState("data.reply");
  const [configError, setConfigError] = useState(null);

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
    setConfigError(null);

    if (targetType === "litellm") {
      onSubmit({ targetType, targetModel, categories: selectedCategories, useJudge });
      return;
    }

    // http target — parse the request template JSON before submitting so
    // a typo shows up right here, not as a confusing 400 from the API.
    let parsedTemplate;
    try {
      parsedTemplate = JSON.parse(requestTemplate);
    } catch {
      setConfigError("Request template must be valid JSON.");
      return;
    }

    onSubmit({
      targetType,
      targetConfig: {
        url: httpUrl,
        request_template: parsedTemplate,
        response_path: responsePath,
      },
      categories: selectedCategories,
      useJudge,
    });
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
        <label style={label}>Target type</label>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setTargetType("litellm")}
            style={{
              ...chip,
              background: targetType === "litellm" ? "#2563eb" : "#232327",
              color: targetType === "litellm" ? "#fff" : "#9a9aa2",
            }}
          >
            Model (via LiteLLM)
          </button>
          <button
            type="button"
            onClick={() => setTargetType("http")}
            style={{
              ...chip,
              background: targetType === "http" ? "#2563eb" : "#232327",
              color: targetType === "http" ? "#fff" : "#9a9aa2",
            }}
          >
            My Own App (HTTP)
          </button>
        </div>
      </div>

      {targetType === "litellm" ? (
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Target model (LiteLLM format)</label>
          <input
            value={targetModel}
            onChange={(e) => setTargetModel(e.target.value)}
            placeholder="groq/llama-3.1-8b-instant"
            style={input}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Endpoint URL</label>
          <input
            value={httpUrl}
            onChange={(e) => setHttpUrl(e.target.value)}
            placeholder="http://localhost:8001/chat"
            style={{ ...input, marginBottom: 10 }}
          />
          <label style={label}>
            Request template — use {"{prompt}"} where the attack text goes
          </label>
          <input
            value={requestTemplate}
            onChange={(e) => setRequestTemplate(e.target.value)}
            placeholder='{"message": "{prompt}"}'
            style={{ ...input, marginBottom: 10, fontFamily: "ui-monospace, monospace" }}
          />
          <label style={label}>Response path — dotted path to the reply text</label>
          <input
            value={responsePath}
            onChange={(e) => setResponsePath(e.target.value)}
            placeholder="data.reply"
            style={{ ...input, fontFamily: "ui-monospace, monospace" }}
          />
          {configError && (
            <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{configError}</div>
          )}
        </div>
      )}

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