import React from "react";
import { Sparkles, ShieldCheck, LogIn, Activity, Layers } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

const VIEW_METAS = {
  chat: { title: "AI Conversation", subtitle: "Multi-turn assistant workspace" },
  csv: { title: "CSV Data Studio", subtitle: "Analytical tables, statistics & charts" },
  memory: { title: "Persistent Memory", subtitle: "Cross-conversation knowledge base" },
  vision: { title: "Vision Inspector", subtitle: "Multimodal image & document analysis" },
  imageGen: { title: "Image Generation", subtitle: "AI prompt to image rendering" },
  research: { title: "Deep Research", subtitle: "Autonomous multi-step investigation" },
  webSearch: { title: "Web Intelligence", subtitle: "Live web ground truth & citations" },
  places: { title: "Places & Location", subtitle: "Google Maps places explorer" },
  voice: { title: "Voice Studio", subtitle: "Whisper speech-to-text & audio synthesis" },
  aiTools: { title: "Developer Utilities", subtitle: "Code explanation, translation & grammar" },
  integrations: { title: "Integrations & Hub", subtitle: "3rd party apps & provider capabilities" },
  analytics: { title: "Usage Analytics", subtitle: "Personal consumption metrics & breakdown" },
};

export default function TopBar({ activeView, onOpenAuth }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const meta = VIEW_METAS[activeView] || { title: "StackChat", subtitle: "Next-Gen AI Workspace" };

  return (
    <header className="top-bar">
      <div className="top-bar-title-section">
        <div>
          <div className="breadcrumb-label">
            <span>{meta.title}</span>
            {connected && (
              <span className="badge badge-active" title="Socket.IO real-time stream connected">
                <Activity size={10} /> Live
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>
            {meta.subtitle}
          </div>
        </div>
      </div>

      <div className="top-bar-actions">
        {/* Model Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--bg-surface-elevated)",
            padding: "4px 9px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.76rem",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          <Sparkles size={12} color="var(--accent-primary)" />
          <span style={{ fontWeight: 500 }}>Gemini 2.5 Flash</span>
        </div>

        {!user ? (
          <button className="btn btn-primary" onClick={onOpenAuth}>
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
        ) : (
          <div className="badge badge-neutral" style={{ padding: "4px 8px" }}>
            <ShieldCheck size={12} color="var(--accent-emerald)" />
            <span>{user.role === "admin" ? "Admin" : "Pro Plan"}</span>
          </div>
        )}
      </div>
    </header>
  );
}
