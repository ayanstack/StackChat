import React, { useState, useEffect } from "react";
import { Plug, RefreshCw, Zap, Link2, Unlink2, Cpu, Globe, Mic, Image as ImageIcon, FileSpreadsheet, Brain, Compass, Layers, CheckCircle2, ShieldAlert } from "lucide-react";
import { integrationsApi, capabilitiesApi } from "../services/api.js";

const CAPABILITY_ICONS = {
  chat: Cpu,
  memory: Brain,
  csvAnalysis: FileSpreadsheet,
  vision: Globe,
  imageGeneration: ImageIcon,
  webSearch: Globe,
  places: Globe,
  voice: Mic,
  deepResearch: Compass,
  integrations: Plug,
};

export default function IntegrationsView() {
  const [integrations, setIntegrations] = useState([]);
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [intRes, capRes] = await Promise.all([
        integrationsApi.list(),
        capabilitiesApi.get(),
      ]);
      setIntegrations(intRes.data || []);
      setCapabilities(capRes.data || null);
    } catch (err) {
      setError(err.message || "Failed to load integrations and capabilities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (integration) => {
    const provider = integration.id;
    try {
      setActionLoading(provider);
      if (integration.connected) {
        await integrationsApi.disconnect(provider);
        setIntegrations((prev) =>
          prev.map((i) => (i.id === provider ? { ...i, connected: false, status: "AVAILABLE" } : i))
        );
      } else {
        await integrationsApi.connect({ provider });
        setIntegrations((prev) =>
          prev.map((i) => (i.id === provider ? { ...i, connected: true, status: "CONNECTED" } : i))
        );
      }
    } catch (err) {
      setError(err.message || "Integration action failed");
    } finally {
      setActionLoading("");
    }
  };

  const getStatusBadge = (status) => {
    if (status === "ACTIVE" || status === "CONNECTED") return "badge-active";
    if (status === "AVAILABLE") return "badge-warning";
    return "badge-disabled";
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1080, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Integrations & Capabilities Matrix
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
          Manage external platform bridges and monitor real-time AI provider model routing.
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
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* Connected Services */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>
          Third-Party Workspace Integrations
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {integrations.map((integ) => (
            <div key={integ.id} className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{integ.name}</span>
                  <span className={`badge ${getStatusBadge(integ.status)}`}>
                    {integ.status}
                  </span>
                </div>
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: 14 }}>
                  {integ.id === "google-drive" && "Sync docs & spreadsheets into context"}
                  {integ.id === "github" && "Index repos & pull request data"}
                  {integ.id === "slack" && "Forward channel summaries to StackChat"}
                  {integ.id === "notion" && "Import databases & workspace pages"}
                </p>
              </div>

              <button
                className={`btn ${integ.connected ? "btn-secondary" : "btn-primary"}`}
                style={{ width: "100%", fontSize: "0.78rem" }}
                onClick={() => handleToggle(integ)}
                disabled={actionLoading === integ.id || integ.status === "NOT_CONFIGURED"}
              >
                {actionLoading === integ.id ? (
                  <RefreshCw size={12} className="spin" />
                ) : integ.connected ? (
                  <><Unlink2 size={12} /> Disconnect</>
                ) : (
                  <><Link2 size={12} /> Connect Service</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Capability Status */}
      {capabilities && (
        <div>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>
            Provider Capabilities Engine
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {Object.entries(capabilities.capabilities || {}).map(([capKey, capVal]) => {
              const IconComp = CAPABILITY_ICONS[capKey] || Zap;
              const status = capVal.status || (capVal.enabled ? "ACTIVE" : "NOT_CONFIGURED");

              return (
                <div key={capKey} className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <IconComp size={14} color="var(--accent-primary)" />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, textTransform: "capitalize", color: "var(--text-primary)" }}>
                        {capKey.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </div>
                    <span className={`badge ${getStatusBadge(status)}`}>
                      {status}
                    </span>
                  </div>

                  {capVal.provider && (
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      Provider: <span style={{ color: "var(--text-secondary)" }}>{capVal.provider}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
