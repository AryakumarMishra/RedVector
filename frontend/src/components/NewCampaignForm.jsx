import { useState } from "react";
import Icon from "./Icon";

const CATEGORIES = [
  { key: "prompt_injection", label: "Prompt Injection" },
  { key: "jailbreak", label: "Jailbreak" },
  { key: "rag_poisoning", label: "RAG Poisoning" },
];

export default function NewCampaignForm({ onSubmit, submitting }) {
  const [targetType, setTargetType] = useState("litellm");
  const [targetModel, setTargetModel] = useState("groq/openai/gpt-oss-20b");

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

  const canSubmit = !submitting && selectedCategories.length > 0;

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label">Target type</label>
        <div className="segmented" role="group" aria-label="Target type">
          <button
            type="button"
            className={`seg-btn${targetType === "litellm" ? " active" : ""}`}
            onClick={() => setTargetType("litellm")}
          >
            <Icon name="target" size={13} />
            Model (via LiteLLM)
          </button>
          <button
            type="button"
            className={`seg-btn${targetType === "http" ? " active" : ""}`}
            onClick={() => setTargetType("http")}
          >
            <Icon name="server" size={13} />
            My Own App (HTTP)
          </button>
        </div>
      </div>

      {targetType === "litellm" ? (
        <div className="field">
          <label className="field-label" htmlFor="target-model">
            <span className="field-icon">
              <Icon name="terminal" size={11} />
            </span>
            Target model (LiteLLM format)
          </label>
          <input
            id="target-model"
            className="input mono"
            value={targetModel}
            onChange={(e) => setTargetModel(e.target.value)}
            placeholder="groq/openai/gpt-oss-20b"
            spellCheck="false"
          />
          <div className="field-hint">
            e.g. groq/openai/gpt-oss-20b, openai/gpt-4o, ollama_chat/llama3
          </div>
        </div>
      ) : (
        <div className="field">
          <label className="field-label" htmlFor="http-url">
            <span className="field-icon">
              <Icon name="server" size={11} />
            </span>
            Endpoint URL
          </label>
          <input
            id="http-url"
            className="input mono"
            value={httpUrl}
            onChange={(e) => setHttpUrl(e.target.value)}
            placeholder="http://localhost:8001/chat"
            spellCheck="false"
          />
          <label className="field-label" htmlFor="request-template">
            <span className="field-icon">
              <Icon name="terminal" size={11} />
            </span>
            Request template
          </label>
          <input
            id="request-template"
            className="input mono"
            value={requestTemplate}
            onChange={(e) => setRequestTemplate(e.target.value)}
            placeholder='{"message": "{prompt}"}'
            spellCheck="false"
          />
          <div className="field-hint">
            Use {"{prompt}"} where the attack text goes.
          </div>
          <label className="field-label" htmlFor="response-path">
            <span className="field-icon">
              <Icon name="fileText" size={11} />
            </span>
            Response path
          </label>
          <input
            id="response-path"
            className="input mono"
            value={responsePath}
            onChange={(e) => setResponsePath(e.target.value)}
            placeholder="data.reply"
            spellCheck="false"
          />
          <div className="field-hint">
            Dotted path to the reply text in the response body.
          </div>
          {configError && (
            <div className="error-banner" style={{ marginTop: 10, marginBottom: 0 }}>
              <Icon name="alertTriangle" size={14} />
              <div>{configError}</div>
            </div>
          )}
        </div>
      )}

      <div className="field">
        <label className="field-label">
          <span className="field-icon">
            <Icon name="zap" size={11} />
          </span>
          Attack categories
        </label>
        <div className="module-grid">
          {CATEGORIES.map((c) => {
            const active = selectedCategories.includes(c.key);
            return (
              <button
                type="button"
                key={c.key}
                className={`module-chip${active ? " active" : ""}`}
                onClick={() => toggleCategory(c.key)}
                aria-pressed={active}
              >
                {c.label}
                <span className="module-check">
                  <Icon name="check" size={13} />
                </span>
              </button>
            );
          })}
        </div>
        <div className="field-hint">
          {selectedCategories.length === 0
            ? "Select at least one category to run."
            : `${selectedCategories.length} of ${CATEGORIES.length} selected.`}
        </div>
      </div>

      <div className="field">
        <label className="toggle-row" htmlFor="use-judge">
          <input
            type="checkbox"
            id="use-judge"
            checked={useJudge}
            onChange={(e) => setUseJudge(e.target.checked)}
          />
          <span>
            <div className="toggle-title">Use LLM-judge scoring</div>
            <div className="toggle-desc">
              Adds an independent judge verdict. Doubles LLM calls — disable if
              rate-limited.
            </div>
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-submit"
        disabled={!canSubmit}
      >
        {submitting ? (
          <>
            <span className="spinner" />
            Running campaign…
          </>
        ) : (
          <>
            <Icon name="play" size={13} />
            Run campaign
          </>
        )}
      </button>
    </form>
  );
}