function overallScore(scores) {
  if (!scores.length) return 0;
  const totalVuln = scores.reduce((sum, s) => sum + s.vulnerable, 0);
  const totalTests = scores.reduce((sum, s) => sum + s.total, 0);
  return totalTests ? totalVuln / totalTests : 0;
}

export default function CampaignList({ campaigns, onSelect, selectedId }) {
  if (campaigns.length === 0) {
    return (
      <div style={{ color: "#9a9aa2", fontSize: 14, padding: "20px 0" }}>
        No campaigns yet — run one above to get started.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {campaigns.map((c) => {
        const score = overallScore(c.scores);
        const isSelected = c.campaign_id === selectedId;
        return (
          <div
            key={c.campaign_id}
            onClick={() => onSelect(c.campaign_id)}
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              border: isSelected ? "1px solid #2563eb" : "1px solid #26262a",
              background: isSelected ? "#1a2436" : "#18181b",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.target_model}</div>
              <div style={{ fontSize: 12, color: "#9a9aa2" }}>
                {new Date(c.created_at).toLocaleString()}
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: score >= 0.5 ? "#f87171" : "#4ade80",
              }}
            >
              {Math.round(score * 100)}% vulnerable
            </div>
          </div>
        );
      })}
    </div>
  );
}