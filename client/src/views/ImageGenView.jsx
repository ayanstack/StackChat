import React, { useState } from "react";
import { Image as ImageIcon, Sparkles, Download, AlertCircle, Loader } from "lucide-react";
import { imageGenApi } from "../services/api.js";

export default function ImageGenView() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [style, setStyle] = useState("vivid");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setError("");
      const res = await imageGenApi.generate({
        prompt,
        size,
        style,
        n: 1,
      });

      if (res && res.data && res.data.images) {
        setImages((prev) => [...res.data.images, ...prev]);
      }
    } catch (err) {
      setError(err.message || "Image generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          AI Image Studio
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
          High-fidelity visual generation and concept art rendering via OpenAI DALL-E 3 and Stability AI.
        </p>
      </div>

      {error && (
        <div style={{ padding: "9px 12px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)", fontSize: "0.82rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Generation Config Box */}
      <div className="card" style={{ padding: 18, marginBottom: 24 }}>
        <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Prompt / Visual Concept Description</label>
            <textarea
              className="textarea-field"
              rows={3}
              placeholder="e.g. Modern architectural blueprint of an obsidian glass workspace, architectural photography, soft studio lighting..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Aspect Ratio</label>
              <select className="select-field" value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="1024x1024">Square (1:1)</option>
                <option value="1024x1792">Portrait (9:16)</option>
                <option value="1792x1024">Landscape (16:9)</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Rendering Mode</label>
              <select className="select-field" value={style} onChange={(e) => setStyle(e.target.value)}>
                <option value="vivid">Vivid & Cinematic</option>
                <option value="natural">Natural & Editorial</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: 38 }}>
              {loading ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
              <span>{loading ? "Rendering..." : "Generate Asset"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Image Gallery */}
      <div>
        <h3 style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 14 }}>
          Session Asset Gallery ({images.length})
        </h3>

        {images.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
            No visual assets generated yet in this session.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {images.map((img, i) => (
              <div key={i} className="card" style={{ padding: 10, overflow: "hidden" }}>
                <img
                  src={img.url || `data:${img.mimeType || "image/png"};base64,${img.base64}`}
                  alt={img.revisedPrompt || "AI render"}
                  style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: "var(--radius-md)" }}
                />
                {img.revisedPrompt && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 6, lineHeight: 1.4 }}>
                    {img.revisedPrompt}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
