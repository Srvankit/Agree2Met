import { useState, useRef, useEffect } from "react";
import "./chatBot.css";

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hi! I’m AutoTrust AI 👋\nHow can I help you today?"
    }
  ]);

  const chatEndRef = useRef(null);

  // auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // fake AI logic
  const getBotReply = (userText) => {
    const text = userText.toLowerCase();

    if (text.includes("pending")) {
      return {
        type: "card",
        data: {
          title: "NDA Agreement",
          due: "Due May 30",
          status: "Pending"
        }
      };
    }

    if (text.includes("completed")) {
      return {
        type: "bot",
        text: "You have 10 completed agreements."
      };
    }

    return {
      type: "bot",
      text: "I can help with agreements, status, reminders. Try asking about pending or completed agreements."
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { type: "user", text: input };
    const botReply = getBotReply(input);

    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      setMessages(prev => [...prev, botReply]);
    }, 500);

    setInput("");
  };

  return (
    <>
      {/* FLOAT BUTTON */}
      <div className="chatbot-float" onClick={() => setOpen(!open)}>
        🤖
      </div>

      {open && (
        <div className="chatbot-popup">

          {/* HEADER */}
          <div className="chat-header">
            <div className="chat-user">
              <div className="bot-avatar">🤖</div>
              <div>
                <h4>AutoTrust AI</h4>
                <span>Online</span>
              </div>
            </div>

            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* BODY */}
          <div className="chat-body">
            {messages.map((msg, index) => {
              if (msg.type === "bot") {
                return (
                  <div key={index} className="message bot">
                    {msg.text}
                  </div>
                );
              }

              if (msg.type === "user") {
                return (
                  <div key={index} className="message user">
                    {msg.text}
                  </div>
                );
              }

              if (msg.type === "card") {
                return (
                  <div key={index} className="message card">
                    <div className="agreement">
                      <strong>{msg.data.title}</strong>
                      <span>{msg.data.due}</span>
                      <span className="tag">{msg.data.status}</span>
                    </div>
                  </div>
                );
              }
            })}

            <div ref={chatEndRef}></div>
          </div>

          {/* INPUT */}
          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend}>➤</button>
          </div>

        </div>
      )}
    </>
  );
};

export default ChatBot;