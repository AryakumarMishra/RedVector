import { useState } from "react";
import Icon from "./Icon";
import { categoryLabel } from "../theme";

function VerdictBadge({ vulnerable }) {
  return (
    <span className={`badge ${vulnerable ? "badge-vulnerable" : "badge-resisted"}`}>
      <span className="badge-dot" />
      {vulnerable ? "Vulnerable" : "Resisted"}
    </span>
  );
}

function FindingDetail({ result }) {
  const signals = [
    {
      label: "Relevance",
      color: result.relevance_score != null ? "#60A5FA" : "#6B7280",
      value:
        result.relevance_score != null
          ? `${result.relevance_score.toFixed(2)}`
          : "n/a",
    },
    {
      label: "Refusal",
      color:
        result.refusal_detected == null
          ? "#6B7280"
          : result.refusal_detected
            ? "#22C55E"
            : "#F97316",
      value:
        result.refusal_detected == null
          ? "n/a"
          : result.refusal_detected
            ? "detected"
            : "none",
    },
    {
      label: "Judge",
      color:
        result.judge_followed_injection == null
          ? "#6B7280"
          : result.judge_followed_injection
            ? "#EF4444"
            : "#22C55E",
      value:
        result.judge_followed_injection == null
          ? "n/a"
          : result.judge_followed_injection
            ? "followed injection"
            : "resisted injection",
    },
  ];

  return (
    <div className="finding-detail">
      <div className="detail-block">
        <div className="detail-block-head">
          <Icon name="terminal" size={12} />
          Attack input
        </div>
        <pre className="code-block">{result.prompt}</pre>
      </div>

      <div className="detail-block">
        <div className="detail-block-head">
          <Icon name="externalLink" size={12} />
          Model response
        </div>
        <pre className="code-block">{result.response}</pre>
      </div>

      <div className="detail-block">
        <div className="detail-block-head">
          <span className="head-accent">
            <Icon name={result.vulnerable ? "alertTriangle" : "check"} size={12} />
          </span>
          {result.vulnerable
            ? "Why this was classified as vulnerable"
            : "Why this was classified as resisted"}
        </div>
        <div className="evidence-line">
          <Icon name="search" size={14} />
          <span>
            <strong>Detection:</strong> {result.evidence}
          </span>
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="signal-row">
            {signals.map((s) => (
              <span key={s.label} className="signal-chip">
                <span className="signal-dot" style={{ background: s.color }} />
                {s.label}: {s.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {result.judge_reasoning && (
        <div className="detail-block">
          <div className="detail-block-head">
            <Icon name="activity" size={12} />
            Judge reasoning
          </div>
          <div className="code-block" style={{ color: "#E9EBEF" }}>
            {result.judge_reasoning}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({ result }) {
  const [expanded, setExpanded] = useState(false);

  function toggle() {
    setExpanded((e) => !e);
  }

  return (
    <>
      <tr
        className={`row-main${result.vulnerable ? " vulnerable" : ""}`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={`detail-${result.payload_id}`}
      >
        <td className="cell-category">
          <span className="cat-dot" style={{ background: "#4B5563" }} />
          {categoryLabel(result.category)}
        </td>
        <td className="cell-payload" title={result.payload_id}>
          {result.payload_id}
        </td>
        <td>
          <VerdictBadge vulnerable={result.vulnerable} />
        </td>
        <td className="cell-num">{Math.round(result.confidence * 100)}%</td>
        <td className="cell-num">
          {result.relevance_score != null
            ? result.relevance_score.toFixed(2)
            : "—"}
        </td>
        <td className="cell-toggle">
          <span
            className={`expand-toggle${expanded ? " open" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
          >
            <Icon name="chevronDown" size={14} />
          </span>
        </td>
      </tr>
      {expanded && (
        <tr id={`detail-${result.payload_id}`}>
          <td className="expanded-cell" colSpan={6}>
            <FindingDetail result={result} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function ResultsTable({ results }) {
  return (
    <div className="results-wrap">
      <div className="results-scroll">
        <table className="results-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Payload</th>
              <th>Verdict</th>
              <th>Confidence</th>
              <th>Relevance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <ResultRow key={r.payload_id} result={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}