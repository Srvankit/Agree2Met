const Login = ({ switchToSignup }) => {
  return (
    <div className="auth-card">

      <h2>Welcome Back!</h2>
      <p className="subtitle">Login to your account</p>

      <input type="email" placeholder="Enter your email" />
      <input type="password" placeholder="Enter your password" />

      <button className="auth-btn">Log in</button>

      <p className="switch-text">
        Don’t have an account?{" "}
        <span onClick={switchToSignup}>Sign up</span>
      </p>

    </div>
  );
};

export default Login;