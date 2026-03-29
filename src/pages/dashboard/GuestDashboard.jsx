import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, DataTable, SectionCard, StatStrip } from "../../components/AppShell";
import RoleWorkspace from "../../components/RoleWorkspace";
import { usersApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";

export default function GuestDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["guest", "profile"],
    queryFn: usersApi.me,
    initialData: user || undefined,
    staleTime: 60_000,
  });

  const profile = profileQuery.data || user || null;

  const sections = useMemo(
    () => [
      {
        key: "overview",
        label: "Overview",
        note: "Access summary",
        description: "A lightweight guest-only workspace.",
        render: () => (
          <StatStrip
            items={[
              { label: "Username", value: profile?.username || "Guest" },
              { label: "Role", value: profile?.role || "guest" },
              { label: "Status", value: profile?.isActive ? "Active" : "Pending" },
            ]}
          />
        ),
      },
      {
        key: "profile",
        label: "Profile",
        note: "Read only",
        description: "Current authenticated guest profile.",
        render: () => (
          <SectionCard title="Profile" subtitle="Current account details">
            <DataTable
              rows={[
                { field: "Username", value: profile?.username || "-" },
                { field: "Email", value: profile?.email || "-" },
                { field: "Phone", value: profile?.phoneNumber || "-" },
                { field: "Role", value: profile?.role || "guest" },
              ]}
              pageSize={10}
              columns={[
                { key: "field", label: "Field", sortValue: (row) => row.field || "" },
                { key: "value", label: "Value", sortValue: (row) => row.value || "" },
              ]}
            />
          </SectionCard>
        ),
      },
      {
        key: "next-step",
        label: "Next Step",
        note: "Upgrade path",
        description: "Guests have a limited cabinet intended for onboarding.",
        render: () => (
          <SectionCard title="What to do next" subtitle="Recommended flow">
            <div className="stack">
              <div className="pill">Ask admin to upgrade your role to student or teacher.</div>
              <div className="pill">After role upgrade, re-login to open the full dashboard.</div>
            </div>
          </SectionCard>
        ),
      },
    ],
    [profile],
  );

  return (
    <AppShell
      title={t("guest.title", "Guest Dashboard")}
      subtitle={t("guest.subtitle", "Minimal cabinet with clear next step")}
      actions={(
        <button
          className="button"
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["guest"] })}
        >
          {t("common.refreshAll", "Refresh all")}
        </button>
      )}
    >
      {profileQuery.error ? (
        <div className="banner banner--error">
          {profileQuery.error?.response?.data?.message || profileQuery.error?.message || "Failed to load guest profile"}
        </div>
      ) : null}
      {profileQuery.isLoading ? <div className="empty-state">{t("common.loadingWorkspace", "Loading workspace...")}</div> : null}
      <RoleWorkspace sections={sections} initialSection="overview" />
    </AppShell>
  );
}
