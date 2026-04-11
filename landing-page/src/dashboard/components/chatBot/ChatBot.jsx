import "./chatbot.css";
import { useState } from "react";

const Chatbot = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="chatbot-container">

      {open && (
        <div className="chatbox">
          <p>Hello 👋</p>
        </div>
      )}

      <div className="chat-icon" onClick={() => setOpen(!open)}>
        💬
      </div>

    </div>
  );
};

export default Chatbot;