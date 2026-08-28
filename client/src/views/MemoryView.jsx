import React, { useState, useEffect } from "react";
import { Brain, Plus, Trash2, Tag, Search, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";
import { memoryApi } from "../services/api.js";

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "preference", label: "Preferences" },
  { id: "fact", label: "Facts" },
  { id: "instruction", label: "Instructions" },
  { id: "profile", label: "Profile" },
];

export default function MemoryView() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // New memory form state
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("fact");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const res = await memoryApi.list();
      setMemories(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load memories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleCreateMemory = async (e) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;

    try {
      setLoading(true);
      const res = await memoryApi.create({ key, value, category });
      setMemories((prev) => [res.data, ...prev]);
      setKey("");
      setValue("");
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || "Failed to create memory");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = async (id, currentStatus) => {
    try {
      const res = await memoryApi.update(id, { enabled: !currentStatus });
      setMemories((prev) => prev.map((m) => (m._id === id ? res.data : m)));
    } catch (err) {
      setError(err.message || "Failed to update memory");
    }
  };

  const handleDelete = async (id) => {
    try {
      await memoryApi.delete(id);
      setMemories((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete memory");
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Persistent Cross-Conversation Memory
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
            Custom user context, preferences, and facts automatically injected into the AI system prompt across all sessions.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          <span>Add Memory Entry</span>
        </button>
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
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ position: "relative", width: 280 }}>
          <Search size={13} color="var(--text-muted)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search memory entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 30, fontSize: "0.82rem" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "5px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.76rem",
                fontWeight: selectedCategory === cat.id ? 600 : 500,
                background: selectedCategory === cat.id ? "var(--bg-surface-elevated)" : "transparent",
                color: selectedCategory === cat.id ? "var(--text-primary)" : "var(--text-muted)",
                border: "1px solid",
                borderColor: selectedCategory === cat.id ? "var(--border-subtle)" : "transparent",
                cursor: "pointer",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Memory Inline Card */}
      {showAddModal && (
        <div className="card" style={{ marginBottom: 20, padding: 18, border: "1px solid var(--border-focus)" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 14 }}>
            Create New Context Entry
          </h3>
          <form onSubmit={handleCreateMemory} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Key / Identifier</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Primary Stack"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Value / Context Detail</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Node.js, React, PostgreSQL"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Category</label>
              <select className="select-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="preference">Preference</option>
                <option value="fact">Fact</option>
                <option value="instruction">Instruction</option>
                <option value="profile">Profile</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Memories Table List */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>Active</th>
              <th style={{ width: 220 }}>Key / Identifier</th>
              <th>Stored Context Detail</th>
              <th style={{ width: 140 }}>Category</th>
              <th style={{ width: 60, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMemories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "36px 14px", color: "var(--text-muted)" }}>
                  {memories.length === 0
                    ? "No persistent memories stored yet. Click 'Add Memory Entry' to teach the AI facts about your preferences."
                    : "No memories match your search filter."}
                </td>
              </tr>
            ) : (
              filteredMemories.map((m) => (
                <tr key={m._id} style={{ opacity: m.enabled ? 1 : 0.5 }}>
                  <td>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleToggleEnable(m._id, m.enabled)}
                      title={m.enabled ? "Disable context injection" : "Enable context injection"}
                      style={{ width: 24, height: 24 }}
                    >
                      {m.enabled ? (
                        <ToggleRight size={20} color="var(--accent-emerald)" />
                      ) : (
                        <ToggleLeft size={20} color="var(--text-muted)" />
                      )}
                    </button>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {m.key}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {m.value}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: "capitalize" }}>
                      <Tag size={9} />
                      {m.category}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-icon"
                      onClick={() => handleDelete(m._id)}
                      title="Delete memory"
                      style={{ width: 26, height: 26 }}
                    >
                      <Trash2 size={13} color="var(--accent-rose)" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
