import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  FileSpreadsheet,
  Brain,
  Eye,
  Image as ImageIcon,
  Search,
  MapPin,
  Mic,
  Compass,
  Code2,
  Plug,
  BarChart3,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { conversationApi } from "../services/api.js";

const NAV_GROUPS = [
  {
    title: "Intelligence Hub",
    items: [
      { id: "chat", label: "AI Conversation", icon: MessageSquare },
      { id: "csv", label: "CSV Data Studio", icon: FileSpreadsheet },
      { id: "memory", label: "Persistent Memory", icon: Brain },
      { id: "research", label: "Deep Research", icon: Compass },
    ],
  },
  {
    title: "Capabilities",
    items: [
      { id: "aiTools", label: "Developer & Writing", icon: Code2 },
      { id: "vision", label: "Vision Inspector", icon: Eye },
      { id: "imageGen", label: "Image Studio", icon: ImageIcon },
      { id: "webSearch", label: "Web Search", icon: Search },
      { id: "places", label: "Places & Location", icon: MapPin },
      { id: "voice", label: "Voice STT / TTS", icon: Mic },
    ],
  },
  {
    title: "System",
    items: [
      { id: "integrations", label: "Integrations & Hub", icon: Plug },
      { id: "analytics", label: "Usage Analytics", icon: BarChart3 },
    ],
  },
];

export default function Sidebar({
  activeView,
  setActiveView,
  activeConvId,
  setActiveConvId,
  refreshSignal,
}) {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const res = await conversationApi.list({ limit: 50 });
      if (res && res.data) {
        setConversations(res.data.conversations || res.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch conversations:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user, refreshSignal]);

  const handleNewChat = async () => {
    if (!user) {
      setActiveView("chat");
      return;
    }
    try {
      const res = await conversationApi.create({ title: "New Conversation" });
      const newConv = res.data;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv._id);
      setActiveView("chat");
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleDeleteConv = async (e, id) => {
    e.stopPropagation();
    try {
      await conversationApi.delete(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.title || "Untitled").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="brand-mark">
            <div className="brand-glyph">
              <Layers size={16} />
            </div>
            <div>
              <span className="brand-text">StackChat</span>
              <span className="brand-badge" style={{ marginLeft: 6 }}>PRO</span>
            </div>
          </div>
        )}

        <button
          className="btn-icon"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ marginLeft: collapsed ? "auto" : 0 }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* New Conversation Quick Action */}
      <div style={{ padding: "10px 10px 4px" }}>
        <button
          className="btn btn-primary"
          onClick={handleNewChat}
          style={{
            width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: "8px 10px",
          }}
          title="New Conversation"
        >
          <Plus size={15} />
          {!collapsed && <span>New Conversation</span>}
        </button>
      </div>

      {/* Navigation Groups */}
      <div style={{ overflowY: "auto", flex: "0 0 auto", maxHeight: "40vh" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <div className="sidebar-section-header">{group.title}</div>
            )}
            <div className="sidebar-nav-list">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item-btn ${isActive ? "active" : ""}`}
                    onClick={() => setActiveView(item.id)}
                    title={collapsed ? item.label : ""}
                    style={{ justifyContent: collapsed ? "center" : "flex-start" }}
                  >
                    <Icon size={16} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Recent History & Search */}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", borderTop: "1px solid var(--border-hairline)" }}>
          <div className="sidebar-section-header" style={{ paddingTop: 10 }}>
            <span>Recent Chats</span>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
              {conversations.length}
            </span>
          </div>

          {/* Quick Search */}
          <div style={{ padding: "0 10px 6px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={12} color="var(--text-muted)" style={{ position: "absolute", left: 8 }} />
              <input
                type="text"
                placeholder="Filter chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "5px 8px 5px 26px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.76rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div className="sidebar-conversations">
            {filteredConversations.length === 0 ? (
              <div style={{ padding: "10px 12px", fontSize: "0.76rem", color: "var(--text-muted)" }}>
                {user ? "No conversations found" : "Sign in to view history"}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConvId === conv._id && activeView === "chat";
                return (
                  <div
                    key={conv._id}
                    className={`conversation-item ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setActiveConvId(conv._id);
                      setActiveView("chat");
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", flex: 1 }}>
                      <MessageSquare size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.8rem" }}>
                        {conv.title || "Untitled Chat"}
                      </span>
                    </div>
                    <button
                      className="btn-icon"
                      style={{ width: 20, height: 20, opacity: 0.5 }}
                      onClick={(e) => handleDeleteConv(e, conv._id)}
                      title="Delete chat"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Footer Profile Pill */}
      <div className="sidebar-footer">
        {user ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              <div className="user-avatar-glyph">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              {!collapsed && (
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.email}
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button className="btn-icon" onClick={logout} title="Log out">
                <LogOut size={14} />
              </button>
            )}
          </div>
        ) : (
          !collapsed && (
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Guest Mode
            </div>
          )
        )}
      </div>
    </aside>
  );
}
