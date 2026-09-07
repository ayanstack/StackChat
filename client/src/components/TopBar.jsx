import React, { useState } from "react";
import { Sparkles, ShieldCheck, LogIn, Activity, ChevronDown, Check, Zap, Cpu, Bot, Flame, Menu } from "lucide-react";
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

export const AI_MODELS = [
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    tag: "Ultra Fast (Instant)",
    icon: Zap,
    color: "var(--accent-amber)",
    desc: "Lightweight, ultra-fast responses for instant coding, chat & utilities",
  },
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    tag: "High Intelligence",
    icon: Cpu,
    color: "var(--accent-primary)",
    desc: "Advanced multimodal reasoning & fast reliable performance",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tag: "Next-Gen Flash",
    icon: Bot,
    color: "var(--accent-emerald)",
    desc: "Complex deep logic & creative synthesis",
  },
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    tag: "Expert Writer",
    icon: Flame,
    color: "var(--accent-sky)",
    desc: "State-of-the-art coding & nuanced writing",
  },
];

export default function TopBar({ activeView, onOpenAuth, selectedModel, setSelectedModel, onToggleMobileMenu }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const meta = VIEW_METAS[activeView] || { title: "StackChat", subtitle: "Next-Gen AI Workspace" };

  const currentModelObj = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];
  const CurrentIcon = currentModelObj.icon;

  return (
    <header className="top-bar" style={{ position: "relative", zIndex: 100 }}>
      <div className="top-bar-title-section" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          className="btn-icon mobile-menu-btn"
          onClick={onToggleMobileMenu}
          title="Toggle Navigation Menu"
          style={{ width: 32, height: 32 }}
        >
          <Menu size={18} />
        </button>
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

      <div className="top-bar-actions" style={{ position: "relative" }}>
        {/* Interactive Model Selector Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "var(--bg-surface-elevated)",
              padding: "5px 11px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.78rem",
              color: "var(--text-primary)",
              border: "1px solid var(--border-hairline)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <CurrentIcon size={13} color={currentModelObj.color} />
            <span style={{ fontWeight: 600 }}>{currentModelObj.name}</span>
            <span
              style={{
                fontSize: "0.68rem",
                background: "var(--bg-surface)",
                padding: "2px 6px",
                borderRadius: "var(--radius-xs)",
                color: "var(--text-muted)",
              }}
            >
              {currentModelObj.tag}
            </span>
            <ChevronDown size={12} color="var(--text-muted)" style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)" }} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: 280,
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)",
                padding: 6,
                zIndex: 999,
              }}
            >
              <div style={{ padding: "6px 10px 8px", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Active AI Model
              </div>

              {AI_MODELS.map((model) => {
                const ModelIcon = model.icon;
                const isSelected = model.id === selectedModel;
                return (
                  <div
                    key={model.id}
                    onClick={() => {
                      setSelectedModel?.(model.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      background: isSelected ? "var(--bg-surface-active)" : "transparent",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "var(--bg-surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ marginTop: 2 }}>
                      <ModelIcon size={15} color={model.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {model.name}
                        </span>
                        {isSelected && <Check size={13} color="var(--accent-emerald)" />}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                        {model.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
