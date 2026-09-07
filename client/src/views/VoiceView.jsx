import React, { useState, useRef } from "react";
import { Mic, Volume2, Loader, AlertCircle, Upload, Play, Check } from "lucide-react";
import { voiceApi } from "../services/api.js";

const TTS_VOICES = [
  { id: "alloy", label: "Alloy — Neutral & Balanced" },
  { id: "echo", label: "Echo — Smooth & Warm" },
  { id: "fable", label: "Fable — Expressive British" },
  { id: "onyx", label: "Onyx — Deep & Authoritative" },
  { id: "nova", label: "Nova — Energetic & Bright" },
  { id: "shimmer", label: "Shimmer — Soft & Gentle" },
];

export default function VoiceView() {
  // STT
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [sttLoading, setSttLoading] = useState(false);
  const [sttError, setSttError] = useState("");

  // TTS
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState("alloy");
  const [ttsAudio, setTtsAudio] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const audioRef = useRef(null);

  const handleAudioFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const handleTranscribe = async (e) => {
    e.preventDefault();
    if (!audioFile) return;
    try {
      setSttLoading(true);
      setSttError("");
      setTranscript("");
      const formData = new FormData();
      formData.append("audio", audioFile);
      const res = await voiceApi.transcribe(formData);
      setTranscript(res.data?.text || "");
    } catch (err) {
      setSttError(err.message || "Transcription failed");
    } finally {
      setSttLoading(false);
    }
  };

  const handleSynthesize = async (e) => {
    e.preventDefault();
    if (!ttsText.trim()) return;
    try {
      setTtsLoading(true);
      setTtsError("");
      setTtsAudio(null);
      const res = await voiceApi.synthesize({ text: ttsText, voice: ttsVoice });
      if (res.data?.audioBase64) {
        const base64 = res.data.audioBase64;
        const mimeType = res.data.mimeType || "audio/mp3";
        const blob = new Blob(
          [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
          { type: mimeType }
        );
        const url = URL.createObjectURL(blob);
        setTtsAudio(url);
      }
    } catch (err) {
      setTtsError(err.message || "Speech synthesis failed");
    } finally {
      setTtsLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Voice & Speech Studio
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
          Whisper-powered speech-to-text audio transcription and neural text-to-speech voice generation.
        </p>
      </div>

      <div className="grid-two-col">
        {/* Speech to Text */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
            <Mic size={14} color="var(--accent-amber)" />
            <span>Speech to Text (Transcribe)</span>
          </h3>

          {sttError && (
            <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)", fontSize: "0.8rem", marginBottom: 12 }}>
              {sttError}
            </div>
          )}

          <div
            style={{
              border: "1px dashed var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              textAlign: "center",
              cursor: "pointer",
              marginBottom: 14,
              background: "var(--bg-app)",
            }}
            onClick={() => document.getElementById("stt-file-input").click()}
          >
            <Upload size={24} color="var(--accent-primary)" style={{ margin: "0 auto 6px" }} />
            <div style={{ fontSize: "0.84rem", fontWeight: 500, color: "var(--text-primary)" }}>
              {audioFile ? audioFile.name : "Select Audio File"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
              MP3, WAV, M4A, WebM (Max 25MB)
            </div>
            <input
              id="stt-file-input"
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              style={{ display: "none" }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleTranscribe}
            disabled={!audioFile || sttLoading}
            style={{ width: "100%", marginBottom: 14 }}
          >
            {sttLoading ? <Loader size={14} className="spin" /> : <Mic size={14} />}
            <span>{sttLoading ? "Transcribing..." : "Transcribe Recording"}</span>
          </button>

          {transcript && (
            <div
              style={{
                padding: "12px 14px",
                background: "var(--bg-app)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-hairline)",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
              }}
            >
              {transcript}
            </div>
          )}
        </div>

        {/* Text to Speech */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
            <Volume2 size={14} color="var(--accent-primary)" />
            <span>Text to Speech (Synthesize)</span>
          </h3>

          {ttsError && (
            <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)", fontSize: "0.8rem", marginBottom: 12 }}>
              {ttsError}
            </div>
          )}

          <form onSubmit={handleSynthesize} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Script to Synthesize</label>
              <textarea
                className="textarea-field"
                rows={4}
                placeholder="Enter text to generate human-grade spoken audio..."
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Voice Personality</label>
              <select className="select-field" value={ttsVoice} onChange={(e) => setTtsVoice(e.target.value)}>
                {TTS_VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>

            <button type="submit" className="btn btn-secondary" disabled={ttsLoading} style={{ marginTop: 2 }}>
              {ttsLoading ? <Loader size={14} className="spin" /> : <Volume2 size={14} />}
              <span>{ttsLoading ? "Synthesizing..." : "Synthesize Voice"}</span>
            </button>
          </form>

          {ttsAudio && (
            <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--bg-app)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-hairline)" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Synthesized Master Audio
              </div>
              <audio
                ref={audioRef}
                src={ttsAudio}
                controls
                style={{ width: "100%", height: 36 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
