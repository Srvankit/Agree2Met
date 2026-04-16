import { useState } from "react";
import "./auth.css";
import Login from "./Login";
import Signup from "./Signup";

const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState("login");

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      
      <div
        className="auth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <div className="auth-close" onClick={onClose}>
          ✕
        </div>

        {/* SWITCHING */}
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