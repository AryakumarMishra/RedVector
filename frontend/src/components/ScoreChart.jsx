import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CATEGORY_LABELS = {
  prompt_injection: "Prompt Injection",
  jailbreak: "Jailbreak",
  rag_poisoning: "RAG Poisoning",
};

function scoreColor(score) {
  if (score >= 0.66) return "#dc2626"; // red — highly vulnerable
  if (score >= 0.33) return "#d97706"; // amber — partially vulnerable
  return "#16a34a"; // green — mostly resistant
}

export default function ScoreChart({ scores }) {
  const data = scores.map((s) => ({
    category: CATEGORY_LABELS[s.category] || s.category,
    vulnerability_score: s.vulnerability_score,
    vulnerable: s.vulnerable,
    total: s.total,
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
          <XAxis dataKey="category" stroke="#9a9aa2" fontSize={13} />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            stroke="#9a9aa2"
            fontSize={13}
          />
          <Tooltip
            contentStyle={{ background: "#1c1c1f", border: "1px solid #333", borderRadius: 8 }}
            labelStyle={{ color: "#e8e8ea" }}
            formatter={(value, _name, props) => [
              `${Math.round(value * 100)}% (${props.payload.vulnerable}/${props.payload.total})`,
              "Vulnerability score",
            ]}
          />
          <Bar dataKey="vulnerability_score" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={scoreColor(entry.vulnerability_score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}