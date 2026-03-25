import { useEffect, useState } from "react";
import { AppShell, DataTable, SectionCard } from "../../components/AppShell";
import { usersApi } from "../../api/resources";
import { formatPerson, normalizeList } from "./helpers";

const roleOptions = ["guest", "student", "teacher", "admin", "owner", "panda"];

export default function UsersManagementPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ username: "", password: "", role: "guest" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await usersApi.list();
      setUsers(normalizeList(response));
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function createUser(event) {
    event.preventDefault();
    try {
      await usersApi.create(draft);
      setDraft({ username: "", password: "", role: "guest" });
      load();
    } catch (submitError) {
      alert(submitError?.response?.data?.message || submitError?.message || "Failed to create user");
    }
  }

  async function updateRole(id, role) {
    try {
      await usersApi.updateRole(id, role);
      load();
    } catch (submitError) {
      alert(submitError?.response?.data?.message || submitError?.message || "Failed to update role");
    }
  }

  return (
    <AppShell title="Users" subtitle="User management without password exposure" actions={<button className="button" onClick={load}>Refresh</button>}>
      {error ? <div className="banner banner--error">{error}</div> : null}
      {loading ? <div className="empty-state">Loading users…</div> : null}
      <div className="dashboard-grid dashboard-grid--single">
        <SectionCard title="Create user" subtitle="Admin, owner and panda only">
          <form className="form-grid" onSubmit={createUser}>
            <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} placeholder="Username" />
            <input type="password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder="Password" />
            <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
              {roleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button className="button" type="submit">Create user</button>
          </form>
        </SectionCard>

        <SectionCard title="All users" subtitle="Passwords are intentionally hidden">
          <DataTable
            rows={users}
            columns={[
              { key: "username", label: "Username" },
              { key: "person", label: "Name", render: (row) => formatPerson(row) },
              { key: "role", label: "Role" },
              {
                key: "changeRole",
                label: "Change role",
                render: (row) => (
                  <select defaultValue={row.role} onChange={(e) => updateRole(row._id, e.target.value)}>
                    {roleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
