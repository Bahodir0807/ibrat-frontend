import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tempOwnerCredentials = {
    username: "temp_owner_test",
    password: "TempOwner123!",
  };

  async function handleLogin(payload) {
    setLoading(true);
    setError("");

    try {
      await login(payload);
      navigate("/");
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await handleLogin(credentials);
  }

  return (
    <div className="auth-page auth-page--login">
      <div className="auth-panel">
        <div className="auth-panel__intro">
          <p className="eyebrow">Ibrat Frontend</p>
          <h1>Sign in to your dashboard</h1>
          <p>
            The app is connected to the backend and hydrates the session from{" "}
            <code>/auth/me</code> right after login.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="owner, admin, student..."
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </label>
          {error ? <div className="banner banner--error">{error}</div> : null}
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button
            className="button button--ghost"
            type="button"
            disabled={loading}
            onClick={() => {
              setCredentials(tempOwnerCredentials);
              handleLogin(tempOwnerCredentials);
            }}
          >
            Quick login as temp owner
          </button>
          <p className="muted">
            Temp test account: <code>{tempOwnerCredentials.username}</code> /{" "}
            <code>{tempOwnerCredentials.password}</code>
          </p>
          <p className="muted">
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
