const Signup = ({ switchToLogin }) => {
  return (
    <div className="auth-card">

      <h2>Create Account</h2>
      <p className="subtitle">Sign up to get started</p>

      <input type="text" placeholder="Full Name" />
      <input type="email" placeholder="Enter your email" />
      <input type="password" placeholder="Create a password" />

      <button className="auth-btn green">Sign Up</button>

      <p className="switch-text">
        Already have an account?{" "}
        <span onClick={switchToLogin}>Log in</span>
      </p>

    </div>
  );
};

export default Signup;  