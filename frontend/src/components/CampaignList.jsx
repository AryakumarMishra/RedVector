import Icon from "./Icon";
import { targetLabel, overallVulnerability, severityForScore } from "../theme";

export default function CampaignList({ campaigns, onSelect, selectedId }) {
  if (campaigns.length === 0) {
    return (
      <div className="empty-state" style={{ border: "none", borderRadius: 0 }}>
        <Icon name="clock" size={20} className="empty-icon" />
        <div className="empty-title">No campaigns yet</div>
        <div className="empty-sub">Run one above to start a scan.</div>
      </div>
    );
  }

  return (
    <div className="campaign-list" role="list">
      {campaigns.map((c) => {
        const score = overallVulnerability(c.scores);
        const severity = severityForScore(score);
        const isSelected = c.campaign_id === selectedId;
        return (
          <button
            key={c.campaign_id}
            role="listitem"
            className={`campaign-item${isSelected ? " selected" : ""}`}
            onClick={() => onSelect(c.campaign_id)}
            aria-pressed={isSelected}
          >
            <div style={{ minWidth: 0 }}>
              <div className="campaign-target">{targetLabel(c)}</div>
              <div className="campaign-meta">
                <Icon name="clock" size={11} />
                {new Date(c.created_at).toLocaleString()}
              </div>
            </div>
            <span
              className="campaign-result"
              style={{ color: severity.color }}
              title={`${severity.label} exposure`}
            >
              {Math.round(score * 100)}%
            </span>
            <Icon name="chevronRight" size={14} className="campaign-chevron" />
          </button>
        );
      })}
    </div>
  );
}