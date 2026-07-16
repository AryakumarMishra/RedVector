import { useEffect, useState } from "react";
import { listCampaigns, getCampaign, createCampaign } from "./api";
import NewCampaignForm from "./components/NewCampaignForm";
import CampaignList from "./components/CampaignList";
import ScoreChart from "./components/ScoreChart";
import ResultsTable from "./components/ResultsTable";

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
    refreshCampaigns();
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

  async function handleCreate({ targetModel, categories, useJudge }) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createCampaign({ targetModel, categories, useJudge });
      setSelectedCampaign(result);
      await refreshCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c0e",
        color: "#e8e8ea",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>RedVector</h1>
          <p style={{ color: "#9a9aa2", fontSize: 14, marginTop: 4 }}>
            Adversarial testing dashboard for LLM applications
          </p>
        </header>

        {error && (
          <div
            style={{
              background: "#4c1d1d",
              color: "#f87171",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <NewCampaignForm onSubmit={handleCreate} submitting={submitting} />

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
          <div>
            <h2 style={sectionTitle}>Campaign history</h2>
            <CampaignList
              campaigns={campaigns}
              onSelect={handleSelect}
              selectedId={selectedCampaign?.campaign_id}
            />
          </div>

          <div>
            {loadingDetail && (
              <div style={{ color: "#9a9aa2", fontSize: 14 }}>Loading campaign…</div>
            )}
            {!loadingDetail && selectedCampaign && (
              <>
                <h2 style={sectionTitle}>
                  Vulnerability score — {selectedCampaign.target_model}
                </h2>
                <ScoreChart scores={selectedCampaign.scores} />
                <h2 style={{ ...sectionTitle, marginTop: 24 }}>
                  Results ({selectedCampaign.results.length})
                </h2>
                <ResultsTable results={selectedCampaign.results} />
              </>
            )}
            {!loadingDetail && !selectedCampaign && (
              <div style={{ color: "#9a9aa2", fontSize: 14, padding: "20px 0" }}>
                Run a campaign or select one from history to see results.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const sectionTitle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#9a9aa2",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 12,
};