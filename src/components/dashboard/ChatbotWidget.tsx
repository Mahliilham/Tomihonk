import { useState, useRef, useEffect, useMemo } from "react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Halo! Ada yang bisa saya bantu hari ini?", sender: "bot", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // SessionId unik per sesi browser — digunakan oleh Simple Memory di n8n
  const sessionId = useMemo(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const CHATBOT_API_URL = "/api/chatbot/send";

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const newUserMsg: Message = {
      id: Date.now(),
      text: userText,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(CHATBOT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText, sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `HTTP error! status: ${response.status}`);
      }

      const botReply = data?.reply || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

      const newBotMsg: Message = {
        id: Date.now() + 1,
        text: botReply,
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (error) {
      console.error("Chatbot API error:", error);
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: "Maaf, terjadi kesalahan koneksi. Silakan coba lagi.",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };  // Helper untuk merender teks dengan format (enter, cetak tebal **, dll)
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIndex) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={partIndex} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <span key={lineIndex} style={{ display: "block", minHeight: line === "" ? "8px" : "auto", marginBottom: "2px" }}>
          {formattedLine}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "var(--th-primary, #0d6efd)",
          color: "white",
          border: "none",
          boxShadow: "0 8px 25px rgba(13, 110, 253, 0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "26px",
          zIndex: 9999,
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: isOpen ? "scale(0) rotate(-90deg)" : "scale(1) rotate(0deg)",
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1) rotate(0deg)";
          e.currentTarget.style.backgroundColor = "var(--th-primary-dark, #0b5ed7)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) rotate(0deg)";
          e.currentTarget.style.backgroundColor = "var(--th-primary, #0d6efd)";
        }}
      >
        <i className="fas fa-comment-dots" />
      </button>

      {/* Chat Window */}
      <div
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "360px",
          height: "550px",
          backgroundColor: "white",
          borderRadius: "24px",
          boxShadow: "0 15px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 9999,
          transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transformOrigin: "bottom right",
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.8) translateY(40px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, var(--th-primary, #0d6efd), #0a58ca)",
          padding: "24px 20px",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "46px",
              height: "46px",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)"
            }}>
              <i className="fas fa-robot" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "0.3px" }}>TomiBot</h4>
              <span style={{ fontSize: "13px", opacity: 0.85, display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                <span style={{ width: "8px", height: "8px", backgroundColor: "#4ade80", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 0 2px rgba(74, 222, 128, 0.2)" }}></span>
                Online
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              e.currentTarget.style.transform = "rotate(90deg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.transform = "rotate(0deg)";
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Message Area */}
        <div style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          backgroundColor: "#f8f9fa",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}>
          {messages.map((msg, index) => (
            <div 
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                animation: `fadeInUp 0.4s ease forwards ${index * 0.05}s`,
                opacity: 0,
                transform: "translateY(10px)"
              }}
            >
              <div style={{
                maxWidth: "85%",
                padding: "14px 18px",
                borderRadius: "20px",
                borderBottomRightRadius: msg.sender === "user" ? "4px" : "20px",
                borderBottomLeftRadius: msg.sender === "bot" ? "4px" : "20px",
                backgroundColor: msg.sender === "user" ? "var(--th-primary, #0d6efd)" : "white",
                color: msg.sender === "user" ? "white" : "#334155",
                boxShadow: msg.sender === "user" ? "0 4px 15px rgba(13, 110, 253, 0.2)" : "0 4px 15px rgba(0,0,0,0.03)",
                fontSize: "14.5px",
                lineHeight: "1.5",
                position: "relative",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}>
                {renderFormattedText(msg.text)}
              </div>
              <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px", padding: "0 6px", fontWeight: 500 }}>
                {msg.time}
              </span>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              animation: "fadeInUp 0.3s ease forwards",
              opacity: 0,
              transform: "translateY(10px)"
            }}>
              <div style={{
                padding: "14px 18px",
                borderRadius: "20px",
                borderBottomLeftRadius: "4px",
                backgroundColor: "white",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span style={{ width: "8px", height: "8px", backgroundColor: "#94a3b8", borderRadius: "50%", animation: "typingDot 1.2s infinite", animationDelay: "0s", display: "inline-block" }} />
                <span style={{ width: "8px", height: "8px", backgroundColor: "#94a3b8", borderRadius: "50%", animation: "typingDot 1.2s infinite", animationDelay: "0.2s", display: "inline-block" }} />
                <span style={{ width: "8px", height: "8px", backgroundColor: "#94a3b8", borderRadius: "50%", animation: "typingDot 1.2s infinite", animationDelay: "0.4s", display: "inline-block" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px", padding: "0 6px", fontWeight: 500 }}>
                TomiBot sedang mengetik...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} style={{ float: "left", clear: "both" }} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: "18px",
          backgroundColor: "white",
          borderTop: "1px solid rgba(0,0,0,0.05)",
          display: "flex",
          gap: "12px",
          alignItems: "center"
        }}>
          <input 
            type="text"
            placeholder="Ketik pesan..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "14px 20px",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              outline: "none",
              fontSize: "15px",
              transition: "all 0.2s",
              backgroundColor: isLoading ? "#f1f5f9" : "#f8f9fa",
              color: "#334155",
              cursor: isLoading ? "not-allowed" : "text",
              opacity: isLoading ? 0.7 : 1,
            }}
            onFocus={(e) => {
              if (!isLoading) {
                e.target.style.borderColor = "var(--th-primary, #0d6efd)";
                e.target.style.backgroundColor = "white";
                e.target.style.boxShadow = "0 0 0 4px rgba(13, 110, 253, 0.1)";
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = isLoading ? "#f1f5f9" : "#f8f9fa";
              e.target.style.boxShadow = "none";
            }}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: (inputValue.trim() && !isLoading) ? "var(--th-primary, #0d6efd)" : "#f1f5f9",
              color: (inputValue.trim() && !isLoading) ? "white" : "#cbd5e1",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: (inputValue.trim() && !isLoading) ? "pointer" : "default",
              transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: (inputValue.trim() && !isLoading) ? "scale(1)" : "scale(0.95)",
              boxShadow: (inputValue.trim() && !isLoading) ? "0 4px 15px rgba(13, 110, 253, 0.3)" : "none"
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            {isLoading
              ? <i className="fas fa-circle-notch fa-spin" style={{ fontSize: "16px" }} />
              : <i className="fas fa-paper-plane" style={{ fontSize: "16px", marginLeft: inputValue.trim() ? "-2px" : "0", marginTop: inputValue.trim() ? "2px" : "0" }} />
            }
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
