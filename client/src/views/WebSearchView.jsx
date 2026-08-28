import React, { useState } from "react";
import { Search, Globe, ExternalLink, Loader, AlertCircle, Sparkles } from "lucide-react";
import { webSearchApi } from "../services/api.js";

export default function WebSearchView() {
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState(5);
  const [searchDepth, setSearchDepth] = useState("basic");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      setLoading(true);
      setError("");
      setResult(null);
      const res = await webSearchApi.search({ query, maxResults, searchDepth, includeAnswer: true });
      setResult(res.data);
    } catch (err) {
      setError(err.message || "Web search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Live Web Intelligence Search
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
          Real-time web ground truth extraction, query synthesis, and citation parsing powered by Tavily and SerpAPI.
        </p>
      </div>

      {error && (
        <div style={{ padding: "9px 12px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)", fontSize: "0.82rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Query Bar Card */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search live web sources... e.g. 'Latest AI multimodal benchmarks 2025'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
            required
          />
          <select className="select-field" style={{ width: 140 }} value={searchDepth} onChange={(e) => setSearchDepth(e.target.value)}>
            <option value="basic">Quick Search</option>
            <option value="advanced">Advanced</option>
          </select>
          <select className="select-field" style={{ width: 110 }} value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))}>
            {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} Sources</option>)}
          </select>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ whiteSpace: "nowrap", height: 38 }}>
            {loading ? <Loader size={14} className="spin" /> : <Search size={14} />}
            <span>Search</span>
          </button>
        </form>
      </div>

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {result.answer && (
            <div className="card" style={{ padding: 18, border: "1px solid var(--border-focus)", backgroundColor: "var(--bg-surface-elevated)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--accent-primary)", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <Sparkles size={12} /> AI Grounded Synthesis
              </div>
              <p style={{ fontSize: "0.88rem", lineHeight: 1.65, color: "var(--text-primary)" }}>{result.answer}</p>
            </div>
          )}

          <h3 style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: 4 }}>
            Ground Truth Citations ({result.results?.length || 0})
          </h3>

          {result.results?.map((r, idx) => (
            <div key={idx} className="card" style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--accent-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}
                  >
                    {r.title} <ExternalLink size={11} />
                  </a>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>{r.url}</div>
                </div>
                {r.score && (
                  <span className="badge badge-active" style={{ flexShrink: 0 }}>
                    {(r.score * 100).toFixed(0)}% match
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 8 }}>
                {r.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
