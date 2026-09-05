import { useState } from "react";
import { suggestRemediation } from "../api";

const CATEGORY_LABELS = {
  prompt_injection: "Prompt Injection",
  jailbreak: "Jailbreak",
  rag_poisoning: "RAG Poisoning",
  system_prompt_leakage: "System Prompt Leakage",
  sensitive_info_disclosure: "Sensitive Info Disclosure",
  improper_output_handling: "Improper Output Handling",
  unbounded_consumption: "Unbounded Consumption",
  agent_goal_hijack: "Agent Goal Hijack",
  tool_misuse: "Tool Misuse",
  escalating_jailbreak: "Escalating Jailbreak",
  context_poisoning: "Context Poisoning",
};

function Badge({ vulnerable }) {
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: vulnerable ? "#4c1d1d" : "#12331f",
        color: vulnerable ? "#f87171" : "#4ade80",
      }}
    >
      {vulnerable ? "Vulnerable" : "Resisted"}
    </span>
  );
}

function RemediationPanel({ result }) {
  const [state, setState] = useState("idle"); // idle | loading | done
  const [suggestion, setSuggestion] = useState(null);

  async function handleClick() {
    setState("loading");
    try {
      const res = await suggestRemediation({
        category: result.category,
        prompt: result.prompt,
        response: result.response,
        evidence: result.evidence,
      });
      setSuggestion(res);
    } catch (err) {
      setSuggestion({ error: err.message, disclaimer: "" });
    } finally {
      setState("done");
    }
  }

  if (state === "idle") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        style={suggestButton}
      >
        Suggest fix
      </button>
    );
  }

  if (state === "loading") {
    return <div style={{ fontSize: 13, color: "#9a9aa2" }}>Drafting a suggestion…</div>;
  }

  return (
    <div style={remediationBox}>
      {suggestion.error || !suggestion.suggestion ? (
        <div style={{ fontSize: 13, color: "#f87171" }}>
          Couldn't generate a suggestion: {suggestion.error || "no suggestion returned"}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: "#9a9aa2", marginBottom: 4 }}>
            SUGGESTED SYSTEM-PROMPT ADDITION
          </div>
          <pre style={pre}>{suggestion.suggestion}</pre>
          {suggestion.rationale && (
            <div style={{ fontSize: 13, color: "#d4d4d8", marginTop: 8 }}>
              {suggestion.rationale}
            </div>
          )}
        </>
      )}
      {/* Advisory framing is part of the UI itself, not just docs — this
          banner always renders alongside any suggestion, success or not. */}
      <div style={disclaimerBanner}>
        ⚠ {suggestion.disclaimer || "This is an automated suggestion, not a guaranteed fix."}
      </div>
    </div>
  );
}

function ResultRow({ result }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded((e) => !e)}
        style={{ cursor: "pointer", borderBottom: "1px solid #26262a" }}
      >
        <td style={{ padding: "10px 12px", color: "#9a9aa2", fontSize: 13 }}>
          {CATEGORY_LABELS[result.category] || result.category}
        </td>
        <td style={{ padding: "10px 12px", fontSize: 13 }}>{result.payload_id}</td>
        <td style={{ padding: "10px 12px" }}>
          <Badge vulnerable={result.vulnerable} />
        </td>
        <td style={{ padding: "10px 12px", fontSize: 13, color: "#9a9aa2" }}>
          {result.confidence != null ? result.confidence.toFixed(2) : "—"}
        </td>
        <td style={{ padding: "10px 12px", fontSize: 13, color: "#9a9aa2" }}>
          {result.relevance_score != null ? result.relevance_score.toFixed(2) : "—"}
        </td>
        <td style={{ padding: "10px 12px", fontSize: 18, color: "#666", textAlign: "center" }}>
          {expanded ? "−" : "+"}
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: "1px solid #26262a" }}>
          <td colSpan={6} style={{ padding: "14px 16px", background: "#18181b" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#9a9aa2", marginBottom: 4 }}>PROMPT</div>
              <pre style={pre}>{result.prompt}</pre>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#9a9aa2", marginBottom: 4 }}>RESPONSE</div>
              <pre style={pre}>{result.response}</pre>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#9a9aa2", marginBottom: 4 }}>EVIDENCE</div>
              <div style={{ fontSize: 13 }}>{result.evidence}</div>
            </div>
            {result.judge_reasoning && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#9a9aa2", marginBottom: 4 }}>
                  JUDGE VERDICT
                  {result.judge_followed_injection != null &&
                    ` (${result.judge_followed_injection ? "followed injection" : "did not follow"})`}
                </div>
                <div style={{ fontSize: 13 }}>{result.judge_reasoning}</div>
              </div>
            )}
            {result.multiturn && result.turns && result.turns.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#9a9aa2", marginBottom: 4 }}>
                  CONVERSATION TURNS
                </div>
                {result.turns.map((turn, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#9a9aa2", marginBottom: 4 }}>
                      Turn {i + 1} — attack input
                    </div>
                    <pre style={pre}>{turn}</pre>
                    {result.responses && result.responses[i] != null && (
                      <>
                        <div
                          style={{ fontSize: 12, color: "#9a9aa2", margin: "6px 0 4px" }}
                        >
                          Turn {i + 1} — model response
                        </div>
                        <pre style={pre}>{result.responses[i]}</pre>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {result.vulnerable && (
              <div onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: 12, color: "#9a9aa2", marginBottom: 6 }}>
                  REMEDIATION (v2 Phase 5)
                </div>
                <RemediationPanel result={result} />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

const pre = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: 13,
  fontFamily: "ui-monospace, monospace",
  background: "#111113",
  padding: "8px 10px",
  borderRadius: 6,
  margin: 0,
  color: "#d4d4d8",
};

const suggestButton = {
  padding: "6px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#232327",
  color: "#e8e8ea",
  fontSize: 13,
  cursor: "pointer",
};

const remediationBox = {
  border: "1px solid #26262a",
  borderRadius: 8,
  padding: 12,
  background: "#141416",
};

const disclaimerBanner = {
  marginTop: 10,
  padding: "8px 10px",
  borderRadius: 6,
  background: "#3a2a0f",
  color: "#facc85",
  fontSize: 12,
  lineHeight: 1.4,
};

export default function ResultsTable({ results }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid #26262a", borderRadius: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #26262a", textAlign: "left" }}>
            <th style={th}>Category</th>
            <th style={th}>Payload</th>
            <th style={th}>Verdict</th>
            <th style={th}>Confidence</th>
            <th style={th}>Relevance</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <ResultRow key={r.payload_id} result={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  padding: "10px 12px",
  fontSize: 12,
  color: "#9a9aa2",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};
