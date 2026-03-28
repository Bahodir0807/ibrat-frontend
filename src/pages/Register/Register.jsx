import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useI18n();
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
      setMessage(t("auth.registrationSuccess", "Registration completed. You can sign in now."));
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
          <p className="eyebrow">{t("auth.selfRegistration", "Self registration")}</p>
          <h1>{t("auth.registerTitle", "Create a guest or student account")}</h1>
          <p>{t("auth.registerSubtitle", "Public registration is limited to guest and student.")}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {t("auth.username", "Username")}
            <input
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              placeholder={t("auth.username", "Username")}
              autoComplete="username"
            />
          </label>
          <label>
            {t("auth.password", "Password")}
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={t("auth.password", "Password")}
              autoComplete="new-password"
            />
          </label>
          <label>
            {t("auth.role", "Role")}
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="guest">{t("roles.guest", "Guest")}</option>
              <option value="student">{t("roles.student", "Student")}</option>
            </select>
          </label>
          {message ? <div className="banner">{message}</div> : null}
          <button className="button" type="submit" disabled={loading}>
            {loading ? t("auth.creating", "Creating...") : t("auth.createAccount", "Create account")}
          </button>
          <p className="muted">
            {t("auth.alreadyRegistered", "Already registered?")}{" "}
            <Link to="/login">{t("auth.backToLogin", "Back to login")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
