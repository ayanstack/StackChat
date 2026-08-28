import React, { useState } from "react";
import { Eye, Upload, Sparkles, Image as ImageIcon, Loader, Check, Copy } from "lucide-react";
import { visionApi } from "../services/api.js";

export default function VisionView() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!imageFile && !previewUrl) return;

    try {
      setLoading(true);
      setError("");
      const formData = new FormData();
      if (imageFile) {
        formData.append("image", imageFile);
      }
      formData.append("prompt", prompt || "Describe this image in detail and identify all key objects, text, and context.");

      const res = await visionApi.analyze(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.message || "Vision analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.analysis) {
      await navigator.clipboard.writeText(result.analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Multimodal Vision Studio
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
          Perform visual inspection, optical character recognition (OCR), flowchart parsing, and architecture review.
        </p>
      </div>

      {error && (
        <div style={{ padding: "9px 12px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)", fontSize: "0.82rem", marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 18 }}>
        {/* Upload Column */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 12 }}>Visual Input</h3>
          <div
            style={{
              border: "1px dashed var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              textAlign: "center",
              marginBottom: 14,
              background: "var(--bg-app)",
              cursor: "pointer",
            }}
            onClick={() => document.getElementById("vision-file-input").click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxHeight: 200, maxWidth: "100%", borderRadius: "var(--radius-md)", objectFit: "contain" }}
              />
            ) : (
              <div>
                <Upload size={28} color="var(--accent-primary)" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--text-primary)" }}>Click to select image</div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 2 }}>
                  PNG, JPG, WebP, GIF (Max 10MB)
                </div>
              </div>
            )}
            <input
              id="vision-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Inspection Directive (Optional)</label>
            <textarea
              className="textarea-field"
              rows={3}
              placeholder="e.g. Extract code snippets, evaluate layout ergonomics, detect schema anomalies..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={!previewUrl || loading}
            style={{ width: "100%", marginTop: 4 }}
          >
            {loading ? <Loader size={14} className="spin" /> : <Eye size={14} />}
            <span>{loading ? "Analyzing..." : "Analyze Image"}</span>
          </button>
        </div>

        {/* Results Column */}
        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: "0.88rem", fontWeight: 600 }}>Inspection Report</h3>
            {result?.analysis && (
              <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.74rem" }} onClick={handleCopy}>
                {copied ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>

          {result ? (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                fontSize: "0.85rem",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                color: "var(--text-primary)",
                background: "var(--bg-app)",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              {result.analysis}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.82rem", background: "var(--bg-app)", borderRadius: "var(--radius-md)", minHeight: 240 }}>
              Analysis output will appear here after submission.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
