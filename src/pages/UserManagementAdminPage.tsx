import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, KeyRound, RefreshCw, Save, Search, ShieldCheck, Trash2, UserCog, UserPlus, Users, X } from "lucide-react";
import { apiFetch } from "../api/apiClient";
import { BUILT_IN_USER_ROLES, PERMISSION_ACTIONS, PROTECTED_USER_ROLES, USER_MANAGEMENT_ADMIN_ROLES, USER_MANAGEMENT_PERMISSION_MATRIX } from "../admin/userManagementSchema";

type Matrix = Record<string, Record<string, Partial<Record<string, boolean>>>>;
type UserRow = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  title: string;
  department: string;
  staffId: string;
  status: string;
  defaultFacilityId: string;
  assignedFacilityIds: string[];
  roleIds: string[];
  customPermissions: Matrix;
};
type Facility = { id: string; name: string };
type Props = { currentUser?: any; facilities?: Facility[]; currentFacilityId?: string | null; facilityCount?: number };
type FormRow = UserRow & { temporaryPassword: string; confirmPassword: string };

const ROLE_LABELS: Record<string, string> = {
  "role-super-admin": "Super Admin",
  "role-org-admin": "Organization Admin",
  "role-facility-admin": "Facility Admin",
  "role-don-adon": "DON / ADON",
  "role-nursing-user": "Nursing User",
  "role-infection-preventionist": "Infection Preventionist",
  "role-rehab-user": "Rehab User",
  "role-mds-user": "MDS User",
  "role-social-work": "Social Work",
  "role-dietary": "Dietary",
  "role-maintenance": "Maintenance",
  "role-read-only": "Read Only",
};
const GROUP_LABELS: Record<string, string> = {
  appNavigation: "App Navigation",
  appointmentWorkflow: "Appointment Workflow",
  censusResidentData: "Census & Resident Data",
  directoryResources: "Directory & Resources",
  reportsExports: "Reports & Exports",
  adminManagement: "Admin Management",
};
const ITEM_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  appointments: "Appointments Page",
  specialtyTrends: "Specialty Trends",
  reportBuilder: "Report Builder",
  patientCensus: "Patient Census",
  directory: "Directory Page",
  guideInfo: "Guide & Info",
  appointmentCreateSchedule: "Create / Schedule Appointment",
  appointmentEditUpdate: "Edit / Update Appointment",
  appointmentStatusTracking: "Status Tracking",
  appointmentTransportCoordination: "Transport Coordination",
  appointmentProviderCommunication: "Provider Communication",
  appointmentFamilyNotification: "Family Notification",
  appointmentDocumentsAttachments: "Documents / Attachments",
  residentBoard: "Resident Board",
  residentCreateEdit: "Create / Edit Resident",
  censusImportReplace: "Census Import / Replace",
  censusReconciliation: "Census Reconciliation",
  residentDischargeArchive: "Discharge / Archive Resident",
  providerDirectory: "Provider Directory",
  specialtyDirectory: "Specialty Directory",
  transportationDirectory: "Transportation Directory",
  facilityContacts: "Facility Contacts",
  appointmentReports: "Appointment Reports",
  trendAnalytics: "Trend Analytics",
  censusReports: "Census Reports",
  printViews: "Print Views",
  csvExports: "CSV Exports",
  adminConsole: "Admin Console",
  facilityConfiguration: "Facility Configuration",
  userManagement: "User Management",
  accessMatrix: "Access Matrix",
  roleTemplates: "Role Templates",
  auditLogs: "Audit Logs",
  settingsSystemConfig: "Settings / System Config",
};

function arr(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}
function matrix(): Matrix {
  const base: Matrix = {};
  Object.entries(USER_MANAGEMENT_PERMISSION_MATRIX).forEach(([group, rows]) => {
    base[group] = {};
    rows.forEach((row) => {
      base[group][row] = {};
      PERMISSION_ACTIONS.forEach((action) => (base[group][row][action] = false));
    });
  });
  return base;
}
function mergeMatrix(value: any): Matrix {
  const base = matrix();
  if (!value || typeof value !== "object") return base;
  Object.entries(value).forEach(([group, rows]: any) => {
    base[group] = base[group] || {};
    Object.entries(rows || {}).forEach(([row, actions]: any) => {
      base[group][row] = { ...(base[group][row] || {}), ...(actions || {}) };
    });
  });
  return base;
}
function normalizeUser(raw: any, index: number, fallbackFacilityId: string): UserRow {
  const roleIds = arr(raw?.roleIds || raw?.roles || raw?.roleId || raw?.role);
  const assignedFacilityIds = arr(raw?.assignedFacilityIds || raw?.facilityIds || raw?.facilityId);
  const defaultFacilityId = String(raw?.defaultFacilityId || assignedFacilityIds[0] || fallbackFacilityId || "facility-main");
  return {
    id: String(raw?.id || raw?.userId || raw?.username || `user-${index}`),
    username: String(raw?.username || raw?.email || `user${index + 1}`).toLowerCase(),
    fullName: String(raw?.fullName || raw?.name || raw?.username || "Unnamed User"),
    email: String(raw?.email || ""),
    title: String(raw?.title || ""),
    department: String(raw?.department || ""),
    staffId: String(raw?.staffId || ""),
    status: String(raw?.status || "active"),
    defaultFacilityId,
    assignedFacilityIds: assignedFacilityIds.length ? assignedFacilityIds : [defaultFacilityId],
    roleIds: roleIds.length ? roleIds : ["role-read-only"],
    customPermissions: mergeMatrix(raw?.customPermissions),
  };
}
function normalizeUsers(value: unknown, fallbackFacilityId: string): UserRow[] {
  const rows = Array.isArray(value) ? value : value && typeof value === "object" && Array.isArray((value as any).users) ? (value as any).users : [];
  return rows.map((row, index) => normalizeUser(row, index, fallbackFacilityId));
}
function emptyForm(facilityId: string): FormRow {
  return { id: "", username: "", fullName: "", email: "", title: "", department: "", staffId: "", status: "active", defaultFacilityId: facilityId, assignedFacilityIds: facilityId ? [facilityId] : [], roleIds: [], customPermissions: {}, temporaryPassword: "", confirmPassword: "" };
}
function canAccess(currentUser: any) {
  return arr(currentUser?.roleIds).some((role) => (USER_MANAGEMENT_ADMIN_ROLES as readonly string[]).includes(role));
}
function canAssignRole(currentUser: any, roleId: string) {
  if (!(PROTECTED_USER_ROLES as readonly string[]).includes(roleId)) return true;
  const roles = arr(currentUser?.roleIds);
  return roles.includes("role-super-admin") || roles.includes("role-org-admin");
}
function validate(input: FormRow, users: UserRow[], currentUser: any) {
  const errors: string[] = [];
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  if (!username) errors.push("Username is required.");
  if (username && !/^[a-z0-9._-]+$/.test(username)) errors.push("Username may only contain lowercase letters, numbers, dots, underscores, and dashes.");
  if (!input.fullName.trim()) errors.push("Full name is required.");
  if (!input.assignedFacilityIds.length) errors.push("At least one facility is required.");
  if (!input.defaultFacilityId) errors.push("Default facility is required.");
  if (input.defaultFacilityId && !input.assignedFacilityIds.includes(input.defaultFacilityId)) errors.push("Default facility must be included in assigned facilities.");
  if (!input.roleIds.length) errors.push("At least one role is required.");
  if (!input.id) {
    if (!input.temporaryPassword) errors.push("Temporary password is required for new users.");
    if (input.temporaryPassword && input.temporaryPassword.length < 8) errors.push("Temporary password must be at least 8 characters.");
    if (input.temporaryPassword !== input.confirmPassword) errors.push("Password and confirm password must match.");
  }
  if (users.some((u) => u.id !== input.id && u.username === username)) errors.push("Duplicate username is blocked.");
  if (email && users.some((u) => u.id !== input.id && u.email.toLowerCase() === email)) errors.push("Duplicate email is blocked.");
  if (input.staffId && users.some((u) => u.id !== input.id && u.status === "active" && u.staffId === input.staffId)) errors.push("Only one active user can be linked to one staff record.");
  input.roleIds.forEach((role) => { if (!canAssignRole(currentUser, role)) errors.push("Only super admin or org admin can assign protected roles."); });
  return [...new Set(errors)];
}

export function UserManagementAdminPage({ currentUser, facilities = [], currentFacilityId, facilityCount }: Props) {
  const fallbackFacilityId = currentFacilityId || facilities[0]?.id || currentUser?.defaultFacilityId || "facility-main";
  const safeFacilities = facilities.length ? facilities : [{ id: fallbackFacilityId, name: "Current Facility" }];
  const [section, setSection] = useState<"users" | "matrix" | "templates" | "logs">("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [draft, setDraft] = useState<Matrix>(matrix());
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState<FormRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [deactivateUser, setDeactivateUser] = useState<UserRow | null>(null);
  const [deactivateText, setDeactivateText] = useState("");
  const selectedUser = users.find((user) => user.id === selectedUserId) || users[0];

  async function loadUsers() {
    setLoading(true);
    setNotice(null);
    try {
      const response = await apiFetch<unknown>("/api/users");
      const rows = normalizeUsers(response, fallbackFacilityId);
      setUsers(rows);
      if (!selectedUserId && rows[0]) setSelectedUserId(rows[0].id);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to load users." });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void loadUsers(); }, []);
  useEffect(() => { if (selectedUser) setDraft(mergeMatrix(selectedUser.customPermissions)); }, [selectedUser?.id]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.fullName, u.username, u.email, u.title, u.department, u.staffId, u.roleIds.join(" ")].join(" ").toLowerCase().includes(q));
  }, [search, users]);

  if (!canAccess(currentUser)) return <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 text-rose-900"><div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider"><ShieldCheck size={18} /> Admin Only</div><p className="mt-2 text-sm font-semibold">User Management is restricted to Super Admin, Org Admin, and Facility Admin roles.</p></div>;

  async function saveUser() {
    if (!editor) return;
    const clean = { ...editor, username: editor.username.trim().toLowerCase(), fullName: editor.fullName.trim(), email: editor.email.trim() };
    const errors = validate(clean, users, currentUser);
    if (errors.length) return setNotice({ type: "error", text: errors.join(" ") });
    setSaving(true);
    try {
      const isNew = !clean.id;
      const payload = isNew ? clean : Object.fromEntries(Object.entries(clean).filter(([key]) => !["temporaryPassword", "confirmPassword"].includes(key)));
      await apiFetch(isNew ? "/api/users" : "/api/users/update", { method: "POST", body: JSON.stringify(payload) });
      setNotice({ type: "success", text: isNew ? "User created successfully." : "User updated successfully." });
      setEditor(null);
      await loadUsers();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to save user." });
    } finally { setSaving(false); }
  }
  async function applyOverrides() {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await apiFetch("/api/users/update", { method: "POST", body: JSON.stringify({ id: selectedUser.id, customPermissions: draft }) });
      setNotice({ type: "success", text: "Access Matrix overrides applied." });
      await loadUsers();
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to apply overrides." }); } finally { setSaving(false); }
  }
  async function resetDefaults() {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await apiFetch("/api/users/update", { method: "POST", body: JSON.stringify({ id: selectedUser.id, customPermissions: {} }) });
      setDraft(matrix());
      setNotice({ type: "success", text: "Custom permissions cleared. Role defaults will apply." });
      await loadUsers();
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to reset defaults." }); } finally { setSaving(false); }
  }
  async function submitResetPassword() {
    if (!resetUser) return;
    if (resetPassword.length < 8 || resetPassword !== resetConfirm) return setNotice({ type: "error", text: "Temporary password must be at least 8 characters and match confirmation." });
    setSaving(true);
    try {
      await apiFetch("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ userId: resetUser.id, temporaryPassword: resetPassword, forcePasswordReset: true }) });
      setResetUser(null); setResetPassword(""); setResetConfirm("");
      setNotice({ type: "success", text: "Temporary password reset submitted. Password hashes were not exposed or stored locally." });
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to reset password." }); } finally { setSaving(false); }
  }
  async function submitDeactivate() {
    if (!deactivateUser) return;
    if (deactivateText !== "DEACTIVATE") return setNotice({ type: "error", text: "Type DEACTIVATE to confirm deactivation." });
    setSaving(true);
    try {
      await apiFetch("/api/users/deactivate", { method: "POST", body: JSON.stringify({ userId: deactivateUser.id, confirmationText: "DEACTIVATE" }) });
      setDeactivateUser(null); setDeactivateText("");
      setNotice({ type: "success", text: "User deactivated. The user record was not deleted." });
      await loadUsers();
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to deactivate user." }); } finally { setSaving(false); }
  }

  const menu = [
    { id: "users", label: "Users List", icon: Users }, { id: "matrix", label: "Access Matrix", icon: ShieldCheck }, { id: "templates", label: "Role Templates", icon: UserCog }, { id: "logs", label: "Audit Logs", icon: ClipboardList },
  ] as const;

  return <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
    <aside className="space-y-4"><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900"><UserCog size={18} className="text-sky-700" /> Management Console</div><div className="space-y-2">{menu.map((m) => { const Icon = m.icon; return <button key={m.id} onClick={() => setSection(m.id)} className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs font-black ${section === m.id ? "bg-sky-700 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}><Icon size={15} />{m.label}</button>; })}</div></div><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Scope & Session</p><div className="mt-3 space-y-2 text-xs font-semibold text-slate-600"><p><span className="font-black text-slate-900">Current user:</span> {currentUser?.fullName || currentUser?.username || "Current Admin"}</p><p><span className="font-black text-slate-900">Manage scope:</span> Facility-based access</p><p><span className="font-black text-slate-900">Facility count:</span> {facilityCount ?? safeFacilities.length}</p></div></div></aside>
    <main className="space-y-5">{notice && <div className={`flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold ${notice.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"}`}>{notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}<span>{notice.text}</span></div>}
      {section === "users" && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-lg font-black text-slate-900">Users List</h2><p className="text-xs font-semibold text-slate-500">Search, create, edit, reset, and deactivate system users.</p></div><div className="flex flex-wrap gap-2"><button onClick={loadUsers} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700"><RefreshCw size={14} className="mr-1 inline" />{loading ? "Refreshing..." : "Refresh"}</button><button onClick={() => setEditor(emptyForm(fallbackFacilityId))} className="rounded-full bg-sky-700 px-4 py-2 text-xs font-black text-white"><UserPlus size={14} className="mr-1 inline" />Create User</button></div></div><label className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff, email, title, role, or department..." className="w-full bg-transparent outline-none" /></label><div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-left text-xs"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-3">Staff/User</th><th className="px-3 py-3">Facilities</th><th className="px-3 py-3">Staff Link</th><th className="px-3 py-3">Email / Title</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{filteredUsers.map((u) => <tr key={u.id} className="align-top"><td className="px-3 py-3 font-black text-slate-900">{u.fullName}<div className="text-[10px] font-semibold text-slate-500">@{u.username}</div></td><td className="px-3 py-3 font-semibold text-slate-600">{u.assignedFacilityIds.length}</td><td className="px-3 py-3 font-semibold text-slate-600">{u.staffId || "Unlinked"}</td><td className="px-3 py-3 font-semibold text-slate-600">{u.email || "—"}<div className="text-[10px] text-slate-500">{u.title || "—"}</div></td><td className="px-3 py-3 font-semibold text-slate-600">{u.roleIds.map((r) => ROLE_LABELS[r] || r).join(", ") || "—"}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${u.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{u.status}</span></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1"><button onClick={() => { setSelectedUserId(u.id); setSection("matrix"); }} className="rounded-full bg-sky-50 px-2 py-1 font-black text-sky-700">Manage Access Matrix</button><button onClick={() => setEditor({ ...emptyForm(u.defaultFacilityId), ...u, temporaryPassword: "", confirmPassword: "" })} className="rounded-full bg-slate-50 px-2 py-1 font-black text-slate-700">Edit User</button><button onClick={() => setResetUser(u)} className="rounded-full bg-amber-50 px-2 py-1 font-black text-amber-700"><KeyRound size={12} className="mr-1 inline" />Reset Password</button><button onClick={() => setDeactivateUser(u)} className="rounded-full bg-rose-50 px-2 py-1 font-black text-rose-700">Deactivate User</button></div></td></tr>)}{!filteredUsers.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-sm font-semibold text-slate-500">No users found. Use Create User or Refresh.</td></tr>}</tbody></table></div></section>}
      {section === "matrix" && selectedUser && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h2 className="text-lg font-black text-slate-900">Access Matrix</h2><p className="text-xs font-semibold text-slate-500">Reset Defaults clears customPermissions. Apply Overrides saves customPermissions.</p></div><select value={selectedUser.id} onChange={(e) => setSelectedUserId(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">{users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}</select></div><div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs font-semibold text-sky-900"><p className="font-black">{selectedUser.fullName}</p><p>{selectedUser.email || "No email"} • {selectedUser.title || "No title"} • {selectedUser.roleIds.join(", ")}</p></div><div className="mt-4 space-y-4">{Object.entries(USER_MANAGEMENT_PERMISSION_MATRIX).map(([group, rows]) => <div key={group} className="overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-xs"><thead className="bg-slate-50"><tr><th className="px-3 py-3 text-left font-black text-slate-700">{GROUP_LABELS[group] || group}</th>{PERMISSION_ACTIONS.map((action) => <th key={action} className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">{action}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row}><td className="px-3 py-3 font-black text-slate-700">{ITEM_LABELS[row] || row}</td>{PERMISSION_ACTIONS.map((action) => <td key={`${row}-${action}`} className="px-3 py-3 text-center"><input type="checkbox" checked={Boolean(draft[group]?.[row]?.[action])} onChange={(e) => setDraft((prev) => ({ ...prev, [group]: { ...(prev[group] || {}), [row]: { ...(prev[group]?.[row] || {}), [action]: e.target.checked } } }))} /></td>)}</tr>)}</tbody></table></div>)}</div><div className="mt-4 flex justify-end gap-2"><button disabled={saving} onClick={resetDefaults} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Reset Defaults</button><button disabled={saving} onClick={applyOverrides} className="rounded-full bg-sky-700 px-4 py-2 text-xs font-black text-white"><Save size={14} className="mr-1 inline" />Apply Overrides</button></div></section>}
      {section === "templates" && <Placeholder title="Role Templates" text="Planned for next release." />}{section === "logs" && <Placeholder title="Audit Logs" text="Planned for next release." />}
    </main>
    {editor && <Modal title={editor.id ? "Edit User" : "Create User"} onClose={() => setEditor(null)}><div className="grid gap-3 md:grid-cols-2"><Field label="Username" value={editor.username} onChange={(v) => setEditor({ ...editor, username: v.toLowerCase() })} /><Field label="Full Name" value={editor.fullName} onChange={(v) => setEditor({ ...editor, fullName: v })} /><Field label="Email" value={editor.email} onChange={(v) => setEditor({ ...editor, email: v })} /><Field label="Title" value={editor.title} onChange={(v) => setEditor({ ...editor, title: v })} /><Field label="Department" value={editor.department} onChange={(v) => setEditor({ ...editor, department: v })} /><Field label="Staff Link / Staff ID" value={editor.staffId} onChange={(v) => setEditor({ ...editor, staffId: v })} />{!editor.id && <Field label="Temporary Password" type="password" value={editor.temporaryPassword} onChange={(v) => setEditor({ ...editor, temporaryPassword: v })} />}{!editor.id && <Field label="Confirm Password" type="password" value={editor.confirmPassword} onChange={(v) => setEditor({ ...editor, confirmPassword: v })} />}</div><div className="mt-4 grid gap-4 md:grid-cols-2"><CheckGroup title="Assigned Facilities" items={safeFacilities.map((f) => ({ key: f.id, label: f.name }))} values={editor.assignedFacilityIds} onChange={(values) => setEditor({ ...editor, assignedFacilityIds: values, defaultFacilityId: values.includes(editor.defaultFacilityId) ? editor.defaultFacilityId : values[0] || "" })} /><CheckGroup title="Roles" items={BUILT_IN_USER_ROLES.map((role) => ({ key: role, label: ROLE_LABELS[role] || role, disabled: !canAssignRole(currentUser, role) }))} values={editor.roleIds} onChange={(values) => setEditor({ ...editor, roleIds: values })} /></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setEditor(null)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Cancel</button><button disabled={saving} onClick={saveUser} className="rounded-full bg-sky-700 px-4 py-2 text-xs font-black text-white">Save User</button></div></Modal>}
    {resetUser && <Modal title={`Reset Password: ${resetUser.fullName}`} onClose={() => setResetUser(null)}><p className="text-sm font-semibold text-slate-600">Temporary passwords are sent only to the backend. Password hashes are not exposed or stored locally.</p><div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Temporary Password" type="password" value={resetPassword} onChange={setResetPassword} /><Field label="Confirm Password" type="password" value={resetConfirm} onChange={setResetConfirm} /></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setResetUser(null)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Cancel</button><button disabled={saving} onClick={submitResetPassword} className="rounded-full bg-amber-600 px-4 py-2 text-xs font-black text-white">Reset Password</button></div></Modal>}
    {deactivateUser && <Modal title={`Deactivate User: ${deactivateUser.fullName}`} onClose={() => setDeactivateUser(null)}><p className="text-sm font-semibold text-rose-700">This sets status to inactive and does not delete the user. Type DEACTIVATE to continue.</p><Field label="Confirmation" value={deactivateText} onChange={setDeactivateText} /><div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeactivateUser(null)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Cancel</button><button disabled={saving || deactivateText !== "DEACTIVATE"} onClick={submitDeactivate} className="rounded-full bg-rose-700 px-4 py-2 text-xs font-black text-white disabled:opacity-40"><Trash2 size={14} className="mr-1 inline" />Deactivate</button></div></Modal>}
  </div>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="text-xs font-black text-slate-700">{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold outline-none focus:border-sky-500" /></label>; }
function CheckGroup({ title, items, values, onChange }: { title: string; items: { key: string; label: string; disabled?: boolean }[]; values: string[]; onChange: (values: string[]) => void }) { return <div className="rounded-2xl border border-slate-200 p-3"><p className="mb-2 text-xs font-black text-slate-700">{title}</p><div className="max-h-56 space-y-2 overflow-auto pr-1">{items.map((item) => <label key={item.key} className={`flex items-center gap-2 text-xs font-semibold ${item.disabled ? "text-slate-300" : "text-slate-700"}`}><input type="checkbox" checked={values.includes(item.key)} disabled={item.disabled} onChange={(e) => onChange(e.target.checked ? [...values, item.key] : values.filter((value) => value !== item.key))} />{item.label}</label>)}</div></div>; }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3"><h3 className="text-lg font-black text-slate-900">{title}</h3><button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X size={18} /></button></div>{children}</div></div>; }
function Placeholder({ title, text }: { title: string; text: string }) { return <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><ShieldCheck className="mx-auto text-slate-400" size={34} /><h2 className="mt-3 text-lg font-black text-slate-900">{title}</h2><p className="mx-auto mt-2 max-w-2xl text-sm font-semibold text-slate-600">{text}</p></section>; }
export default UserManagementAdminPage;
