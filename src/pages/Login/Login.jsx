import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { createZodResolver } from "../../lib/forms";
import { showErrorToast, showSuccessToast } from "../../lib/toast";

const loginSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const tempOwnerCredentials = {
  username: "temp_owner_test",
  password: "TempOwner123!",
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: createZodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values) {
    try {
      await login(values);
      showSuccessToast(t("auth.loginSuccess", "Signed in successfully"));
      navigate("/");
    } catch (submitError) {
      showErrorToast(submitError, t("auth.loginFailed", "Login failed"));
    }
  }

  return (
    <div className="auth-page auth-page--login">
      <div className="auth-panel">
        <div className="auth-panel__intro">
          <p className="eyebrow">{t("auth.frontend", "Ibrat Frontend")}</p>
          <h1>{t("auth.loginTitle", "Sign in to your dashboard")}</h1>
          <p>{t("auth.loginSubtitle", "The app is connected to the backend and hydrates the session from /auth/me right after login.")}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <label>
            {t("auth.username", "Username")}
            <input {...register("username")} placeholder={t("auth.usernamePlaceholder", "owner, admin, student...")} autoComplete="username" />
            {errors.username ? <span className="field-error">{errors.username.message}</span> : null}
          </label>
          <label>
            {t("auth.password", "Password")}
            <input type="password" {...register("password")} placeholder={t("auth.passwordPlaceholder", "Your password")} autoComplete="current-password" />
            {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
          </label>
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("auth.signingIn", "Signing in...") : t("auth.signIn", "Sign in")}
          </button>
          <button
            className="button button--ghost"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setValue("username", tempOwnerCredentials.username, { shouldValidate: true });
              setValue("password", tempOwnerCredentials.password, { shouldValidate: true });
              void onSubmit(tempOwnerCredentials);
            }}
          >
            {t("auth.quickLogin", "Quick login as owner")}
          </button>
          <p className="muted">
            {t("auth.tempAccount", "Temp test account")}: <code>{tempOwnerCredentials.username}</code> / <code>{tempOwnerCredentials.password}</code>
          </p>
          <p className="muted">
            {t("auth.noAccount", "No account yet?")} <Link to="/register">{t("auth.createOne", "Create one")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
