import React, { useState } from "react";
import { Compass, Sparkles, ExternalLink, Globe, CheckCircle2, Loader, ArrowRight, Layers, FileText } from "lucide-react";
import { researchApi } from "../services/api.js";

const STAGES = [
  "Formulating Multi-Perspective Hypothesis",
  "Decomposing & Querying Intelligence Sources",
  "Synthesizing Empirical Findings",
  "Authoring Executive Research Dossier",
];

export default function ResearchView() {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState("standard");
  const [focusAreaInput, setFocusAreaInput] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRunResearch = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const focusAreas = focusAreaInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      setLoading(true);
      setError("");
      const res = await researchApi.run({
        topic,
        depth,
        focusAreas,
      });
      setReportData(res.data);
    } catch (err) {
      setError(err.message || "Deep research failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Autonomous Deep Research Studio
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
          Multi-agent deep investigation across academic, technological, and market intelligence domains with source grounding.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "9px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.25)",
            color: "var(--accent-rose)",
            fontSize: "0.82rem",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Query Form */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <form onSubmit={handleRunResearch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Investigation Subject / Research Thesis</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Next-Generation Solid-State Battery Commercialization and Supply Chain Bottlenecks"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12, alignItems: "end" }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Investigation Depth</label>
              <select className="select-field" value={depth} onChange={(e) => setDepth(e.target.value)}>
                <option value="quick">Quick Executive Brief</option>
                <option value="standard">Standard Deep Dive</option>
                <option value="deep">Exhaustive Multi-Perspective</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Focus Areas (Comma-separated)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Cost per kWh, Safety, Key Manufacturers"
                value={focusAreaInput}
                onChange={(e) => setFocusAreaInput(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: 38, padding: "0 16px" }}>
              {loading ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
              <span>{loading ? "Investigating..." : "Launch Research"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Loading Timeline Progress */}
      {loading && (
        <div className="card" style={{ padding: 24, textAlign: "center", marginBottom: 20 }}>
          <Loader size={28} color="var(--accent-primary)" className="spin" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>Synthesizing Domain Findings</h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
            Decomposing research query into sub-problems and aggregating verified source citations...
          </p>
        </div>
      )}

      {/* Generated Research Dossier */}
      {reportData && (
        <div className="card" style={{ padding: 28 }}>
          {/* Dossier Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1px solid var(--border-hairline)", paddingBottom: 16 }}>
            <div>
              <span className="badge badge-active" style={{ marginBottom: 6 }}>
                <CheckCircle2 size={11} /> {reportData.depth?.toUpperCase()} DOSSIER
              </span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                {reportData.topic}
              </h3>
            </div>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {new Date(reportData.generatedAt || Date.now()).toLocaleDateString()}
            </span>
          </div>

          {/* Sources Pill Cloud */}
          {reportData.sources?.length > 0 && (
            <div style={{ marginBottom: 20, padding: 14, background: "var(--bg-app)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-hairline)" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Globe size={13} color="var(--accent-primary)" /> Verified Ground Truth Citations
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {reportData.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "0.74rem",
                      color: "var(--accent-primary)",
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-sm)",
                      textDecoration: "none",
                    }}
                  >
                    {src.title || src.url} <ExternalLink size={9} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Report Body */}
          <div style={{ fontSize: "0.88rem", lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
            {reportData.report}
          </div>
        </div>
      )}
    </div>
  );
}
