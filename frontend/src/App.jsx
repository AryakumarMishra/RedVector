import { useEffect, useState } from "react";
import { listCampaigns, getCampaign, createCampaign, multiturnCampaign } from "./api";
import NewCampaignForm from "./components/NewCampaignForm";
import CampaignList from "./components/CampaignList";
import ScoreChart from "./components/ScoreChart";
import ResultsTable from "./components/ResultsTable";
import Icon from "./components/Icon";
import {
  targetLabel,
  overallVulnerability,
  severityForScore,
  categoryLabel,
} from "./theme";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  async function refreshCampaigns() {
    try {
      const data = await listCampaigns();
      setCampaigns(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }

  useEffect(() => {
    let cancelled = false;
    listCampaigns()
      .then((data) => {
        if (!cancelled) setCampaigns(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelect(campaignId) {
    setLoadingDetail(true);
    setError(null);
    try {
      const detail = await getCampaign(campaignId);
      setSelectedCampaign(detail);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCreate({ targetType, targetModel, targetConfig, categories, useJudge, multiturn }) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = { targetType, targetModel, targetConfig, categories, useJudge };
      const result = multiturn
        ? await multiturnCampaign(payload)
        : await createCampaign(payload);
      setSelectedCampaign(result);
      await refreshCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const hasDetail = selectedCampaign && !submitting;

  return (
    <div className="app">
      <div className="app-inner">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="shield" size={16} />
            </span>
            <div>
              <div className="brand-name">RedVector</div>
              <div className="brand-tagline">
                Adversarial testing for LLM applications
              </div>
            </div>
          </div>
          <div className="topbar-meta">
            <span className="meta-item">
              <span className="meta-dot" />
              Local console
            </span>
            <span className="meta-item">{API_BASE}</span>
          </div>
        </header>

        {error && (
          <div className="error-banner" role="alert">
            <Icon name="alertTriangle" size={15} />
            <div>{error}</div>
          </div>
        )}

        <div className="layout">
          <div className="left-col">
            <div className="panel">
              <div className="section-head">
                <Icon name="zap" size={13} />
                <h2>New campaign</h2>
              </div>
              <div className="panel-body">
                <NewCampaignForm onSubmit={handleCreate} submitting={submitting} />
              </div>
            </div>

            <div className="panel">
              <div className="section-head">
                <Icon name="clock" size={13} />
                <h2>Campaign history</h2>
                <span className="count">{campaigns.length}</span>
              </div>
              <CampaignList
                campaigns={campaigns}
                onSelect={handleSelect}
                selectedId={selectedCampaign?.campaign_id}
              />
            </div>
          </div>

          <div className="right-col">
            {submitting && (
              <div className="running-state">
                <div className="running-indicator">
                  <span className="pulse-dot" />
                  Campaign running
                </div>
                <div className="running-detail">
                  Executing selected attack payloads against the target and
                  scoring each response. This usually takes a minute or two.
                </div>
              </div>
            )}

            {!submitting && loadingDetail && (
              <div className="loading-state">
                <span className="spinner accent" />
                Loading campaign detail…
              </div>
            )}

            {hasDetail && !loadingDetail && (
              <>
                <CampaignOverview campaign={selectedCampaign} />
                <ScoreChart scores={selectedCampaign.scores} />
                <ResultsTable results={selectedCampaign.results} />
              </>
            )}

            {!submitting && !loadingDetail && !selectedCampaign && (
              <div className="empty-state">
                <Icon name="search" size={22} className="empty-icon" />
                <div className="empty-title">No campaign selected</div>
                <div className="empty-sub">
                  Configure a target above and run a campaign, or select one
                  from history to inspect its findings.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignOverview({ campaign }) {
  const scores = campaign.scores || [];
  const total = scores.reduce((sum, s) => sum + s.total, 0);
  const vulnerable = scores.reduce((sum, s) => sum + s.vulnerable, 0);
  const resisted = total - vulnerable;
  const overall = overallVulnerability(scores);
  const severity = severityForScore(overall);

  return (
    <>
      <div className="campaign-header">
        <div className="campaign-title-block">
          <div className="campaign-kicker">
            <span className="dot" style={{ background: severity.color }} />
            {severity.label} exposure · {scores.length} categories
          </div>
          <div className="campaign-target-display">{targetLabel(campaign)}</div>
          <div className="campaign-timestamp">
            <Icon name="clock" size={13} />
            {campaign.created_at
              ? new Date(campaign.created_at).toLocaleString()
              : "Completed just now"}
          </div>
        </div>
      </div>

      <div className="stats-strip">
        <div className="stat">
          <div className="stat-label">
            <Icon name="activity" size={12} />
            Overall exposure
          </div>
          <div className="stat-value" style={{ color: severity.color }}>
            {Math.round(overall * 100)}
            <span className="stat-pct">%</span>
            <span className="stat-sub">
              {vulnerable}/{total} payloads landed
            </span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">
            <Icon name="alertTriangle" size={12} />
            Vulnerable
          </div>
          <div className="stat-value" style={{ color: "var(--critical)" }}>
            {vulnerable}
            <span className="stat-sub">findings</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">
            <Icon name="check" size={12} />
            Resisted
          </div>
          <div className="stat-value" style={{ color: "var(--low)" }}>
            {resisted}
            <span className="stat-sub">responses</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">
            <Icon name="target" size={12} />
            Categories
          </div>
          <div className="stat-value">
            {scores.length}
            <span className="stat-sub">
              {scores.map((s) => categoryLabel(s.category)).join(" · ")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
