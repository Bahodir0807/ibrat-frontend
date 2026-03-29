import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { createZodResolver } from "../../lib/forms";
import { showErrorToast, showSuccessToast } from "../../lib/toast";

const registerSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["guest", "student"]),
});

export default function Register() {
  const navigate = useNavigate();
  const { register: registerRequest } = useAuth();
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: createZodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "guest",
    },
  });

  async function onSubmit(values) {
    try {
      await registerRequest(values);
      showSuccessToast(t("auth.registrationSuccess", "Registration completed. You can sign in now."));
      setTimeout(() => navigate("/login"), 500);
    } catch (submitError) {
      showErrorToast(submitError, t("auth.registrationFailed", "Registration failed"));
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

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <label>
            {t("auth.username", "Username")}
            <input {...register("username")} placeholder={t("auth.username", "Username")} autoComplete="username" />
            {errors.username ? <span className="field-error">{errors.username.message}</span> : null}
          </label>
          <label>
            {t("auth.password", "Password")}
            <input type="password" {...register("password")} placeholder={t("auth.password", "Password")} autoComplete="new-password" />
            {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
          </label>
          <label>
            {t("auth.role", "Role")}
            <select {...register("role")}>
              <option value="guest">{t("roles.guest", "Guest")}</option>
              <option value="student">{t("roles.student", "Student")}</option>
            </select>
          </label>
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("auth.creating", "Creating...") : t("auth.createAccount", "Create account")}
          </button>
          <p className="muted">
            {t("auth.alreadyRegistered", "Already registered?")} <Link to="/login">{t("auth.backToLogin", "Back to login")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
