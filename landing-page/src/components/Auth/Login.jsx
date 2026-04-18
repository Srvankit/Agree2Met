import { useState } from "react";

const Login = ({ switchToSignup }) => {

const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="auth-logo">✓ Agree2Met</div>

      <h2>Welcome Back!</h2>
      <p className="subtitle">Login to your account</p>

      {/* EMAIL */}
      <div className="input-field">
        <div className="input-label">Email</div>
        <div className="input-box">
          <span className="input-icon">📧</span>
          <input type="email" placeholder="Enter your email" />
        </div>
      </div>

      {/* PASSWORD */}
              <div className="input-field">
          <div className="input-label">Password</div>
          <div className="input-box">
            <span className="input-icon">🔒</span>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
            />

            <span
              className="input-action"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>
        </div>

      <button className="auth-btn">Log in</button>

      <div className="switch-text">
        Don’t have an account? <span onClick={switchToSignup}>Sign up</span>
      </div>

      <div className="divider">or</div>

      <button className="google-btn">
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 3.2l6-6C34.5 2.6 29.6 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.2 5.6C11.8 13.2 17.4 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v7.7h12.8c-.3 2-1.6 5-4.5 7l6.9 5.3c4-3.7 6.3-9.2 6.3-15.9z"/>
    <path fill="#FBBC05" d="M9.8 28.9c-.5-1.5-.8-3.1-.8-4.9s.3-3.4.8-4.9l-7.2-5.6C1 16.9 0 20.3 0 24s1 7.1 2.6 10.5l7.2-5.6z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-6.9-5.3c-1.9 1.3-4.5 2.3-9 2.3-6.6 0-12.2-3.7-14.2-9.4l-7.2 5.6C6.6 42.6 14.6 48 24 48z"/>
  </svg>

  Sign up with Google
</button>
    </>
  );
};

export default Login;