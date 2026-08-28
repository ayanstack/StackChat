import React, { useState } from "react";
import { Code2, FileText, Languages, PenLine, SpellCheck, Wand2, Loader, Copy, Check, Terminal, Play } from "lucide-react";
import { aiUtilsApi } from "../services/api.js";

const TOOLS = [
  { id: "explain", label: "Explain Code", icon: Code2, color: "var(--accent-primary)", description: "Line-by-line breakdown of algorithms, complex logic, and functions." },
  { id: "summarize", label: "Summarize Text", icon: FileText, color: "var(--accent-emerald)", description: "Condense long technical documents or transcripts into key points." },
  { id: "translate", label: "Translate", icon: Languages, color: "var(--accent-sky)", description: "Accurate domain-aware translation into any target language." },
  { id: "rewrite", label: "Rewrite & Polish", icon: PenLine, color: "var(--accent-amber)", description: "Improve tone, conciseness, and clarity while preserving intent." },
  { id: "grammar", label: "Fix Grammar", icon: SpellCheck, color: "var(--accent-rose)", description: "Precision spelling, syntax, and punctuation correction." },
  { id: "custom", label: "Custom Instruction", icon: Wand2, color: "var(--accent-violet)", description: "Execute customized system rules against structured user inputs." },
];

export default function AIToolsView() {
  const [activeTool, setActiveTool] = useState("explain");
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const setInput = (key, val) => setInputs((prev) => ({ ...prev, [key]: val }));

  const handleRun = async () => {
    setError("");
    setResult("");
    try {
      setLoading(true);
      let res;

      switch (activeTool) {
        case "explain":
          res = await aiUtilsApi.explainCode({ code: inputs.code || "", language: inputs.language || "" });
          break;
        case "summarize":
          res = await aiUtilsApi.summarizeText({ text: inputs.text || "" });
          break;
        case "translate":
          res = await aiUtilsApi.translateText({ text: inputs.text || "", targetLanguage: inputs.lang || "Spanish" });
          break;
        case "rewrite":
          res = await aiUtilsApi.rewriteText({ text: inputs.text || "" });
          break;
        case "grammar":
          res = await aiUtilsApi.fixGrammar({ text: inputs.text || "" });
          break;
        case "custom":
          res = await aiUtilsApi.customPrompt({ systemPrompt: inputs.system || "", userMessage: inputs.message || "" });
          break;
        default:
          break;
      }

      if (res?.data) {
        setResult(typeof res.data === "string" ? res.data : res.data.content || JSON.stringify(res.data));
      }
    } catch (err) {
      setError(err.message || "Execution failed");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const renderInputs = () => {
    switch (activeTool) {
      case "explain":
        return (
          <>
            <div className="input-group">
              <label className="input-label">Programming Language</label>
              <input type="text" className="input-field" placeholder="e.g. TypeScript, Rust, Python" value={inputs.language || ""} onChange={(e) => setInput("language", e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Source Code Snippet</label>
              <textarea className="textarea-field" rows={9} placeholder="Paste snippet to inspect..." value={inputs.code || ""} onChange={(e) => setInput("code", e.target.value)} style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }} />
            </div>
          </>
        );
      case "translate":
        return (
          <>
            <div className="input-group">
              <label className="input-label">Target Language</label>
              <input type="text" className="input-field" placeholder="e.g. Japanese, French, German" value={inputs.lang || ""} onChange={(e) => setInput("lang", e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Original Text</label>
              <textarea className="textarea-field" rows={7} placeholder="Paste text..." value={inputs.text || ""} onChange={(e) => setInput("text", e.target.value)} />
            </div>
          </>
        );
      case "custom":
        return (
          <>
            <div className="input-group">
              <label className="input-label">System Directive</label>
              <textarea className="textarea-field" rows={3} placeholder="e.g. You are a senior principal engineer performing strict code audits." value={inputs.system || ""} onChange={(e) => setInput("system", e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">User Query</label>
              <textarea className="textarea-field" rows={5} placeholder="Your context or prompt..." value={inputs.message || ""} onChange={(e) => setInput("message", e.target.value)} />
            </div>
          </>
        );
      default:
        return (
          <div className="input-group">
            <label className="input-label">Input Text</label>
            <textarea className="textarea-field" rows={9} placeholder="Paste content to process..." value={inputs.text || ""} onChange={(e) => setInput("text", e.target.value)} />
          </div>
        );
    }
  };

  const activeMeta = TOOLS.find((t) => t.id === activeTool);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          AI Developer & Writing Utilities
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
          Dedicated single-task productivity tools for code analysis, text transformation, and grammar refinement.
        </p>
      </div>

      {/* Segmented Tool Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResult(""); setError(""); }}
              className="card"
              style={{
                textAlign: "left",
                cursor: "pointer",
                padding: "12px 14px",
                backgroundColor: isActive ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
                borderColor: isActive ? "var(--border-focus)" : "var(--border-hairline)",
                transition: "all 0.12s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Icon size={15} color={tool.color} />
                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>{tool.label}</span>
              </div>
              <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{tool.description}</p>
            </button>
          );
        })}
      </div>

      {/* Split Input / Output Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
            {activeMeta && React.createElement(activeMeta.icon, { size: 15, color: activeMeta.color })}
            <span>{activeMeta?.label} Parameters</span>
          </h3>

          {renderInputs()}

          {error && (
            <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)", fontSize: "0.8rem", marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleRun} disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? <Loader size={14} className="spin" /> : <Play size={14} />}
            <span>{loading ? "Executing Utility..." : "Run Utility"}</span>
          </button>
        </div>

        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: "0.88rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Terminal size={14} color="var(--text-muted)" />
              <span>Processed Output</span>
            </h3>

            {result && (
              <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.74rem" }} onClick={copyResult}>
                {copied ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>

          <div
            style={{
              flex: 1,
              fontFamily: ["explain", "custom"].includes(activeTool) ? "var(--font-mono)" : "inherit",
              fontSize: "0.85rem",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              overflowY: "auto",
              color: result ? "var(--text-primary)" : "var(--text-muted)",
              background: "var(--bg-app)",
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-hairline)",
              minHeight: 240,
            }}
          >
            {result || "Output will appear here upon execution..."}
          </div>
        </div>
      </div>
    </div>
  );
}
