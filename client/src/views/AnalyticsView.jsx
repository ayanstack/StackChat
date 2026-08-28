import React, { useState, useEffect } from "react";
import { BarChart3, MessageSquare, Zap, FileText, Calendar, TrendingUp, Database, Loader } from "lucide-react";
import { analyticsApi } from "../services/api.js";

export default function AnalyticsView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getStats();
        setStats(res.data || null);
      } catch (err) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const STAT_CARDS = stats
    ? [
        { label: "Total Conversations", value: stats.totalConversations ?? stats.conversations ?? "—", icon: MessageSquare, color: "var(--accent-primary)" },
        { label: "Total Messages", value: stats.totalMessages ?? stats.messages ?? "—", icon: FileText, color: "var(--accent-emerald)" },
        { label: "AI Generations", value: stats.aiMessages ?? stats.assistantMessages ?? "—", icon: Zap, color: "var(--accent-amber)" },
        { label: "Files & Datasets", value: stats.totalFiles ?? stats.files ?? "—", icon: Database, color: "var(--accent-sky)" },
        { label: "Tokens Processed", value: stats.totalTokens ? stats.totalTokens.toLocaleString() : "—", icon: TrendingUp, color: "var(--accent-violet)" },
        { label: "Days Active", value: stats.daysActive ?? "1", icon: Calendar, color: "var(--accent-rose)" },
      ]
    : [];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Usage Analytics & Consumption
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
          Real-time metrics on your conversation volume, AI assistant response frequency, and token usage.
        </p>
      </div>

      {error && (
        <div style={{ padding: "9px 12px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)", fontSize: "0.82rem", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 10, color: "var(--text-muted)" }}>
          <Loader size={16} className="spin" />
          <span>Aggregating analytics data...</span>
        </div>
      ) : stats ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* KPI Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {STAT_CARDS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Icon size={14} color={stat.color} />
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      {stat.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1 }}>
                    {stat.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Model Breakdown */}
          {stats.messagesByModel && Object.keys(stats.messagesByModel).length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 12 }}>Routing by AI Model</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Model Identifier</th>
                      <th>Message Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.messagesByModel).map(([model, count]) => (
                      <tr key={model}>
                        <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{model}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
          No analytics data available yet. Start conversations to generate usage telemetry.
        </div>
      )}
    </div>
  );
}
