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
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { messageApi, conversationApi } from "../services/api.js";

const QUICK_STARTERS = [
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

export default function ChatView({ activeConvId, setActiveConvId, onTriggerRefresh }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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

    const handleChunk = (data) => {
      setIsStreaming(true);
      setStreamingContent((prev) => prev + (data.chunk || data.text || ""));
      scrollToBottom();
    };

    const handleComplete = (data) => {
      setIsStreaming(false);
      setStreamingContent("");
      if (data && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      scrollToBottom();
      onTriggerRefresh?.();
    };

    socket.on("message_chunk", handleChunk);
    socket.on("message_complete", handleComplete);

    return () => {
      socket.off("message_chunk", handleChunk);
      socket.off("message_complete", handleComplete);
    };
  }, [socket, onTriggerRefresh]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSendMessage = async (customPrompt) => {
    const textToSend = typeof customPrompt === "string" ? customPrompt : input.trim();
    if (!textToSend || loading || isStreaming) return;

    let convId = activeConvId;

    if (!convId) {
      try {
        const newConvRes = await conversationApi.create({
          title: textToSend.slice(0, 32) || "New Conversation",
        });
        convId = newConvRes.data?.conversation?._id || newConvRes.data?._id;
        if (!convId) {
          console.error("Failed to get conversation ID from response:", newConvRes);
          return;
        }
        setActiveConvId(convId);
        onTriggerRefresh?.();

        // Join socket room for the new conversation
        if (socket) {
          socket.emit("join_conversation", { conversationId: convId });
        }
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      setLoading(true);
      const res = await messageApi.send(convId, { content: textToSend });
      if (res && res.data) {
        // Backend returns { userMessage, assistantMessage }
        const aiReply = res.data.assistantMessage || res.data.aiMessage || res.data.reply;
        if (aiReply && aiReply.content) {
          // Replace temp user msg with actual user msg, then add AI reply
          setMessages((prev) => {
            const withoutTemp = prev.filter(m => m._id !== tempUserMsg._id);
            const msgs = [...withoutTemp];
            if (res.data.userMessage) {
              msgs.push(res.data.userMessage);
            } else {
              msgs.push(tempUserMsg);
            }
            msgs.push(aiReply);
            return msgs;
          });
        }
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
                  gridTemplateColumns: "repeat(2, 1fr)",
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
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  </div>

                  <div className="msg-meta">
                    <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isAI && <span>• {msg.model || "Gemini 2.5 Flash"}</span>}

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

          {/* Real-time Streaming State */}
          {isStreaming && (
            <div className="message-item ai-message">
              <div className="msg-avatar ai">
                <Bot size={15} />
              </div>
              <div className="msg-body-wrapper">
                <div className="msg-bubble">
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {streamingContent}
                    <span className="streaming-cursor"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Composer Dock */}
      <div className="composer-dock-container">
        <div className="composer-box">
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
              <button className="btn-icon" title="Attach file or dataset" style={{ width: 28, height: 28 }}>
                <Paperclip size={13} />
              </button>
              <button className="btn-icon" title="Live Web grounding" style={{ width: 28, height: 28 }}>
                <Globe size={13} />
              </button>
              <button className="btn-icon" title="Voice dictation" style={{ width: 28, height: 28 }}>
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
                disabled={!input.trim() || loading || isStreaming}
                style={{ width: 28, height: 28, padding: 0, borderRadius: "var(--radius-sm)" }}
              >
                <ArrowUp size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
