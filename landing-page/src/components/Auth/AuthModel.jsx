import { useState, useEffect } from "react";
import Login from "./Login";
import Signup from "./Signup";
import "./auth.css";

const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState("login");

<<<<<<< HEAD
  useEffect(() => {
    if (isOpen) setMode("login"); // always open login first
=======
  // 🔥 ALWAYS RESET TO LOGIN WHEN OPENING
  useEffect(() => {
    if (isOpen) setMode("login");
>>>>>>> b6511a4b3db5babeb680cf48fb7d6d0b158e4452
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>

        <span className="auth-close" onClick={onClose}>✕</span>

        {mode === "login" ? (
          <Login switchToSignup={() => setMode("signup")} />
        ) : (
          <Signup switchToLogin={() => setMode("login")} />
        )}

      </div>
    </div>
  );
};

export default AuthModal;