import { useState } from "react";

const CATEGORY_LABELS = {
  prompt_injection: "Prompt Injection",
  jailbreak: "Jailbreak",
  rag_poisoning: "RAG Poisoning",
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
          {result.confidence.toFixed(2)}
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
              <div>
                <div style={{ fontSize: 12, color: "#9a9aa2", marginBottom: 4 }}>
                  JUDGE VERDICT
                  {result.judge_followed_injection != null &&
                    ` (${result.judge_followed_injection ? "followed injection" : "did not follow"})`}
                </div>
                <div style={{ fontSize: 13 }}>{result.judge_reasoning}</div>
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