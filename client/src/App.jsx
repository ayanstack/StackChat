import React, { useState } from "react";
import { Layers } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import AuthModal from "./components/AuthModal.jsx";
import ChatView from "./views/ChatView.jsx";
import CsvStudioView from "./views/CsvStudioView.jsx";
import MemoryView from "./views/MemoryView.jsx";
import VisionView from "./views/VisionView.jsx";
import ImageGenView from "./views/ImageGenView.jsx";
import ResearchView from "./views/ResearchView.jsx";
import WebSearchView from "./views/WebSearchView.jsx";
import PlacesView from "./views/PlacesView.jsx";
import VoiceView from "./views/VoiceView.jsx";
import AIToolsView from "./views/AIToolsView.jsx";
import IntegrationsView from "./views/IntegrationsView.jsx";
import AnalyticsView from "./views/AnalyticsView.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function ProtectedView({ user, onOpenAuth, children }) {
  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 14,
          color: "var(--text-muted)",
          padding: 40,
        }}
      >
        <div
          className="brand-glyph"
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-lg)",
            marginBottom: 4,
          }}
        >
          <Layers size={22} />
        </div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Sign In to Access Workspace
        </h3>
        <p style={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 360, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Create an account or sign in with your credentials to preserve your chat history and capabilities.
        </p>
        <button className="btn btn-primary" onClick={onOpenAuth} style={{ marginTop: 6 }}>
          Sign In / Register
        </button>
      </div>
    );
  }
  return children;
}

export default function App() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("chat");
  const [activeConvId, setActiveConvId] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");

  const triggerRefresh = () => setRefreshSignal((s) => s + 1);

  const renderView = () => {
    const props = { user, onOpenAuth: () => setShowAuth(true) };

    switch (activeView) {
      case "chat":
        return (
          <ProtectedView {...props}>
            <ChatView
              activeConvId={activeConvId}
              setActiveConvId={setActiveConvId}
              onTriggerRefresh={triggerRefresh}
              selectedModel={selectedModel}
            />
          </ProtectedView>
        );
      case "csv":
        return (
          <ProtectedView {...props}>
            <CsvStudioView />
          </ProtectedView>
        );
      case "memory":
        return (
          <ProtectedView {...props}>
            <MemoryView />
          </ProtectedView>
        );
      case "vision":
        return (
          <ProtectedView {...props}>
            <VisionView />
          </ProtectedView>
        );
      case "imageGen":
        return (
          <ProtectedView {...props}>
            <ImageGenView />
          </ProtectedView>
        );
      case "research":
        return (
          <ProtectedView {...props}>
            <ResearchView />
          </ProtectedView>
        );
      case "webSearch":
        return (
          <ProtectedView {...props}>
            <WebSearchView />
          </ProtectedView>
        );
      case "places":
        return (
          <ProtectedView {...props}>
            <PlacesView />
          </ProtectedView>
        );
      case "voice":
        return (
          <ProtectedView {...props}>
            <VoiceView />
          </ProtectedView>
        );
      case "aiTools":
        return (
          <ProtectedView {...props}>
            <AIToolsView />
          </ProtectedView>
        );
      case "integrations":
        return (
          <ProtectedView {...props}>
            <IntegrationsView />
          </ProtectedView>
        );
      case "analytics":
        return (
          <ProtectedView {...props}>
            <AnalyticsView />
          </ProtectedView>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        activeConvId={activeConvId}
        setActiveConvId={setActiveConvId}
        refreshSignal={refreshSignal}
      />

      <div className="main-view">
        <TopBar
          activeView={activeView}
          onOpenAuth={() => setShowAuth(true)}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
        {renderView()}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
