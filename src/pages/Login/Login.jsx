import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
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
          <p className="eyebrow">{t("auth.frontend", "Ibrat Frontend")}</p>
          <h1>{t("auth.loginTitle", "Sign in to your dashboard")}</h1>
          <p>{t("auth.loginSubtitle", "The app is connected to the backend and hydrates the session from /auth/me right after login.")}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {t("auth.username", "Username")}
            <input
              value={credentials.username}
              onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
              placeholder={t("auth.usernamePlaceholder", "owner, admin, student...")}
              autoComplete="username"
            />
          </label>
          <label>
            {t("auth.password", "Password")}
            <input
              type="password"
              value={credentials.password}
              onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
              placeholder={t("auth.passwordPlaceholder", "Your password")}
              autoComplete="current-password"
            />
          </label>
          {error ? <div className="banner banner--error">{error}</div> : null}
          <button className="button" type="submit" disabled={loading}>
            {loading ? t("auth.signingIn", "Signing in...") : t("auth.signIn", "Sign in")}
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
            {t("auth.quickLogin", "Quick login as owner")}
          </button>
          <p className="muted">
            {t("auth.tempAccount", "Temp test account")}: <code>{tempOwnerCredentials.username}</code> /{" "}
            <code>{tempOwnerCredentials.password}</code>
          </p>
          <p className="muted">
            {t("auth.noAccount", "No account yet?")} <Link to="/register">{t("auth.createOne", "Create one")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
