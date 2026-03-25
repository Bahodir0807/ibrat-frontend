import { useMemo } from "react";
import { AppShell, SectionCard, StatStrip } from "../../components/AppShell";
import RoleWorkspace from "../../components/RoleWorkspace";
import { useAuth } from "../../context/AuthContext";

export default function GuestDashboard() {
  const { user } = useAuth();

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
              { label: "Username", value: user?.username || "Guest" },
              { label: "Role", value: user?.role || "guest" },
              { label: "Status", value: user?.isActive ? "Active" : "Pending" },
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
            <div className="data-table">
              <table className="data-table">
                <tbody>
                  <tr><td>Username</td><td>{user?.username || "—"}</td></tr>
                  <tr><td>Email</td><td>{user?.email || "—"}</td></tr>
                  <tr><td>Phone</td><td>{user?.phoneNumber || "—"}</td></tr>
                  <tr><td>Role</td><td>{user?.role || "guest"}</td></tr>
                </tbody>
              </table>
            </div>
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
    [user],
  );

  return (
    <AppShell title="Guest Dashboard" subtitle="Minimal cabinet with clear next step">
      <RoleWorkspace sections={sections} initialSection="overview" />
    </AppShell>
  );
}
