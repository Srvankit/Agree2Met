import "./chatBot.css";

const ChatBot = () => {
  return (
    <div className="chatbot">

      {/* TOP CIRCLE (fake avatar) */}
      <div className="chatbot-avatar">
        🤖
        <span className="status-dot"></span>
      </div>

      {/* BODY */}
      <div className="chatbot-body">
        <h4>Hi! I’m AutoTrust AI</h4>
        <p>How can I help you today?</p>

        <button className="chat-btn">
          💬 Chat Now
        </button>
      </div>

    </div>
  );
};

export default ChatBot;