import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "guest",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await register(form);
      setMessage("Registration completed. You can sign in now.");
      setTimeout(() => navigate("/login"), 700);
    } catch (submitError) {
      setMessage(submitError?.response?.data?.message || submitError?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page auth-page--register">
      <div className="auth-panel">
        <div className="auth-panel__intro">
          <p className="eyebrow">Self registration</p>
          <h1>Create a guest or student account</h1>
          <p>
            Public registration is limited to <code>guest</code> and <code>student</code>.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Choose username"
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Choose password"
              autoComplete="new-password"
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="guest">Guest</option>
              <option value="student">Student</option>
            </select>
          </label>
          {message ? <div className="banner">{message}</div> : null}
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
          <p className="muted">
            Already registered? <Link to="/login">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
