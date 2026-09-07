import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUp,
  Sparkles,
  Paperclip,
  RotateCw,
  Trash2,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  Globe,
  Mic,
  Compass,
  FileSpreadsheet,
  Code2,
  CornerDownLeft,
  X,
  FileText,
  ExternalLink,
  Loader,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { messageApi, conversationApi, fileApi } from "../services/api.js";

const QUICK_STARTERS = [
  {
    title: "AI Image Studio",
    prompt: "Generate an image of a breathtaking futuristic neon skyline at night in 8k cinematic lighting.",
    icon: Sparkles,
    color: "var(--accent-purple, #a855f7)",
  },
  {
    title: "Data Analysis",
    prompt: "Analyze our quarterly customer dataset and summarize retention trends.",
    icon: FileSpreadsheet,
    color: "var(--accent-emerald)",
  },
  {
    title: "Deep Topic Research",
    prompt: "Conduct a deep research overview on multi-agent consensus protocols.",
    icon: Compass,
    color: "var(--accent-sky)",
  },
  {
    title: "Code Architecture",
    prompt: "Review this Node.js architecture for high-concurrency event processing.",
    icon: Code2,
    color: "var(--accent-primary)",
  },
  {
    title: "Voice & Speech",
    prompt: "Synthesize an executive briefing script for our product launch.",
    icon: Mic,
    color: "var(--accent-amber)",
  },
];

function renderBubbleContent(content) {
  if (!content) return null;

  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        text: content.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: "image",
      alt: match[1] || "Generated AI Asset",
      url: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      text: content.slice(lastIndex),
    });
  }

  if (parts.length === 0) {
    return <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>;
  }

  return (
    <div>
      {parts.map((part, idx) => {
        if (part.type === "image") {
          return (
            <div
              key={idx}
              style={{
                margin: "10px 0",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--border-hairline)",
                background: "rgba(0, 0, 0, 0.25)",
                maxWidth: 480,
              }}
            >
              <img
                src={part.url}
                alt={part.alt}
                loading="lazy"
                style={{
                  width: "100%",
                  maxHeight: 360,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                style={{
                  padding: "6px 10px",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-surface)",
                  gap: 8,
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {part.alt}
                </span>
                <a
                  href={part.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    padding: "2px 7px",
                    fontSize: "0.68rem",
                    height: 22,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>Open</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          );
        }
        return (
          <div key={idx} style={{ whiteSpace: "pre-wrap" }}>
            {part.text}
          </div>
        );
      })}
    </div>
  );
}

export default function ChatView({ activeConvId, setActiveConvId, onTriggerRefresh, selectedModel = "gemini-3.5-flash-lite" }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await messageApi.listByConversation(activeConvId);
        if (res && res.data) {
          setMessages(res.data.messages || res.data || []);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    if (socket && activeConvId) {
      socket.emit("join_conversation", { conversationId: activeConvId });
    }
  }, [activeConvId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleUserMsgSaved = (data) => {
      // Replace the temp optimistic message with the real DB-persisted message
      if (data?.userMessage) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id?.startsWith("temp-") ? data.userMessage : m
          )
        );
      }
    };

    const handleChunk = (data) => {
      setIsStreaming(true);
      setStreamingContent((prev) => prev + (data.chunk || data.text || ""));
      scrollToBottom();
    };

    const handleComplete = (data) => {
      setIsStreaming(false);
      setStreamingContent("");
      // Server emits { assistantMessage } — add it to the list
      const aiMsg = data?.assistantMessage || data?.message;
      if (aiMsg) {
        setMessages((prev) => [...prev, aiMsg]);
      }
      scrollToBottom();
      onTriggerRefresh?.();
    };

    socket.on("user_message_saved", handleUserMsgSaved);
    socket.on("message_chunk", handleChunk);
    socket.on("message_complete", handleComplete);

    return () => {
      socket.off("user_message_saved", handleUserMsgSaved);
      socket.off("message_chunk", handleChunk);
      socket.off("message_complete", handleComplete);
    };
  }, [socket, onTriggerRefresh]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // --- Voice Recognition Setup ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setInput((prev) => (prev + ' ' + finalTranscript).trim());
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const toggleWebSearch = () => {
    setIsWebSearchEnabled((prev) => !prev);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fileApi.upload(formData);
      if (res && res.data && res.data.file) {
        setAttachments((prev) => [...prev, res.data.file]);
      }
    } catch (err) {
      console.error("File upload failed:", err);
      alert("Failed to upload file");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (fileId) => {
    setAttachments((prev) => prev.filter(f => f._id !== fileId));
  };

  const handleSendMessage = async (customPrompt) => {
    const textToSend = typeof customPrompt === "string" ? customPrompt : input.trim();
    if (!textToSend || loading || isStreaming) return;

    let convId = activeConvId;

    if (!convId) {
      try {
        const newConvRes = await conversationApi.create({
          title: textToSend.slice(0, 32) || "New Conversation",
          model: selectedModel,
        });
        convId = newConvRes.data?.conversation?._id || newConvRes.data?._id;
        if (!convId) {
          console.error("Failed to get conversation ID from response:", newConvRes);
          return;
        }
        setActiveConvId(convId);
        onTriggerRefresh?.();

        if (socket) {
          socket.emit("join_conversation", { conversationId: convId });
        }
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

    const attachmentIds = attachments.map((a) => a._id);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Show the user's message instantly (optimistic UI)
    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      role: "user",
      content: textToSend,
      attachments,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Use socket streaming if connected — AI chunks arrive in real-time
    if (socket && socket.connected) {
      socket.emit("send_message", {
        conversationId: convId,
        content: textToSend,
        attachmentIds,
        model: selectedModel,
        webSearch: isWebSearchEnabled,
      });
      // socket events (user_message_saved, message_chunk, message_complete) handle the rest
      return;
    }

    // Fallback: HTTP request if socket not available
    try {
      setLoading(true);
      const res = await messageApi.send(convId, {
        content: textToSend,
        attachmentIds,
        model: selectedModel,
        webSearch: isWebSearchEnabled,
      });
      if (res && res.data) {
        const aiReply = res.data.assistantMessage || res.data.aiMessage || res.data.reply;
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m._id !== tempUserMsg._id);
          const msgs = [...withoutTemp];
          if (res.data.userMessage) msgs.push(res.data.userMessage);
          else msgs.push(tempUserMsg);
          if (aiReply) msgs.push(aiReply);
          return msgs;
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (id, text) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleRegenerate = async (msgId) => {
    try {
      setLoading(true);
      const res = await messageApi.regenerate(msgId);
      if (res && res.data) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.data : m)));
      }
    } catch (err) {
      console.error("Failed to regenerate:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await messageApi.delete(msgId);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="chat-workspace">
      {/* Scrollable Messages Feed */}
      <div className="chat-scroll-area">
        <div className="chat-message-feed">
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: "center", margin: "auto", padding: "60px 20px 20px", maxWidth: 640 }}>
              <div
                className="brand-glyph"
                style={{
                  width: 44,
                  height: 44,
                  margin: "0 auto 16px",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <Sparkles size={22} />
              </div>

              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                How can StackChat assist you?
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
                Synthesize research, parse complex CSV tables, execute developer utilities, or tap into cross-conversation memory.
              </p>

              {/* Quick Starter Chips */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 10,
                  marginTop: 28,
                  textAlign: "left",
                }}
              >
                {QUICK_STARTERS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="card"
                      style={{
                        padding: "12px 14px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        textAlign: "left",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-hairline)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon size={14} color={item.color} />
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {item.title}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                        {item.prompt}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rendered Messages */}
          {messages.map((msg) => {
            const isAI = msg.role === "assistant" || msg.role === "system";
            return (
              <div
                key={msg._id}
                className={`message-item ${isAI ? "ai-message" : "user-message"}`}
              >
                <div className={`msg-avatar ${isAI ? "ai" : "user"}`}>
                  {isAI ? <Bot size={15} /> : <UserIcon size={15} />}
                </div>

                <div className="msg-body-wrapper">
                  <div className="msg-bubble">
                    {renderBubbleContent(msg.content)}
                  </div>

                  <div className="msg-meta">
                    <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isAI && <span>• {msg.metadata?.model || msg.model || selectedModel}</span>}

                    <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
                      <button
                        className="btn-icon"
                        style={{ width: 22, height: 22 }}
                        onClick={() => handleCopy(msg._id, msg.content)}
                        title="Copy text"
                      >
                        {copiedId === msg._id ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                      </button>

                      {isAI && (
                        <button
                          className="btn-icon"
                          style={{ width: 22, height: 22 }}
                          onClick={() => handleRegenerate(msg._id)}
                          title="Regenerate reply"
                        >
                          <RotateCw size={11} />
                        </button>
                      )}

                      <button
                        className="btn-icon"
                        style={{ width: 22, height: 22 }}
                        onClick={() => handleDeleteMessage(msg._id)}
                        title="Delete message"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Real-time Streaming & Thinking Loader State */}
          {(loading || isStreaming) && (
            <div className="message-item ai-message" style={{ animation: "messageAppear 0.2s ease-out" }}>
              <div className="msg-avatar ai" style={{ position: "relative" }}>
                <Bot size={15} />
                <span
                  style={{
                    position: "absolute",
                    inset: -2,
                    borderRadius: "var(--radius-sm)",
                    border: "1.5px solid var(--accent-primary)",
                    opacity: 0.7,
                    animation: "pulseGlow 1.5s infinite ease-in-out",
                  }}
                />
              </div>
              <div className="msg-body-wrapper">
                <div className="msg-bubble">
                  {streamingContent ? (
                    <div>
                      {renderBubbleContent(streamingContent)}
                      <span className="streaming-cursor"></span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "2px 0", color: "var(--text-secondary)" }}>
                      <Loader size={15} className="spin" color="var(--accent-primary)" />
                      <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>
                        {isWebSearchEnabled ? "Searching web & synthesizing answer..." : "Thinking & generating response..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Composer Dock */}
      <div className="composer-dock-container">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        <div className="composer-box">
          {attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px 0 12px" }}>
              {attachments.map((att) => (
                <div
                  key={att._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    background: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.75rem",
                    color: "var(--text-primary)",
                  }}
                >
                  <FileText size={12} color="var(--accent-sky)" />
                  <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {att.originalName || att.filename || "Attached file"}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeAttachment(att._id)}
                    style={{ width: 16, height: 16, padding: 0 }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder="Type your message or prompt... (Enter to send, Shift+Enter for new line)"
            rows={1}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

          <div className="composer-toolbar">
            <div className="composer-tools-group">
              <button
                type="button"
                className="btn-icon"
                title="Attach file or dataset"
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 28, height: 28 }}
              >
                <Paperclip size={13} />
              </button>
              <button
                type="button"
                className={`btn-icon ${isWebSearchEnabled ? "active" : ""}`}
                title="Live Web grounding"
                onClick={toggleWebSearch}
                style={{
                  width: 28,
                  height: 28,
                  color: isWebSearchEnabled ? "var(--accent-sky)" : undefined,
                  background: isWebSearchEnabled ? "rgba(56, 189, 248, 0.15)" : undefined,
                }}
              >
                <Globe size={13} />
              </button>
              <button
                type="button"
                className={`btn-icon ${isRecording ? "active" : ""}`}
                title={isRecording ? "Listening... click to stop" : "Voice dictation"}
                onClick={toggleVoiceRecording}
                style={{
                  width: 28,
                  height: 28,
                  color: isRecording ? "#ef4444" : undefined,
                  background: isRecording ? "rgba(239, 68, 68, 0.15)" : undefined,
                }}
              >
                <Mic size={13} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <CornerDownLeft size={10} /> Send
              </span>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && attachments.length === 0) || loading || isStreaming}
                style={{ width: 28, height: 28, padding: 0, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {loading || isStreaming ? (
                  <Loader size={14} className="spin" />
                ) : (
                  <ArrowUp size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
