import React, { useMemo, useState } from "react";
import {
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

export const USER_MANAGEMENT_ADMIN_ROLES = [
  "role-super-admin",
  "role-org-admin",
  "role-facility-admin",
] as const;

export const PROTECTED_USER_ROLES = ["role-super-admin", "role-org-admin"] as const;

export const BUILT_IN_USER_ROLES = [
  "role-super-admin",
  "role-facility-admin",
  "role-org-admin",
  "role-don-adon",
  "role-nursing-user",
  "role-infection-preventionist",
  "role-rehab-user",
  "role-mds-user",
  "role-social-work",
  "role-dietary",
  "role-maintenance",
  "role-read-only",
] as const;

export type UserManagementRoleId = (typeof BUILT_IN_USER_ROLES)[number];
export type PermissionAction = "view" | "create" | "edit" | "print" | "export" | "delete" | "admin";
export type PermissionGroup = "modules" | "departments" | "appointmentWorkflows";

export interface UserManagementUser {
  id: string;
  staffId?: string;
  username: string;
  fullName: string;
  email?: string;
  title?: string;
  department?: string;
  payrollNo?: string;
  status: "active" | "inactive";
  defaultFacilityId: string;
  assignedFacilityIds: string[];
  roleIds: UserManagementRoleId[] | string[];
  customPermissions?: Record<string, Record<string, Partial<Record<PermissionAction, boolean>>>>;
  forcePasswordReset?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserManagementPageProps {
  currentUser?: Partial<UserManagementUser> | null;
  facilityCount?: number;
  users?: UserManagementUser[];
  onRefresh?: () => void;
  onCreateUser?: () => void;
  onEditUser?: (user: UserManagementUser) => void;
  onResetPassword?: (user: UserManagementUser) => void;
  onDeactivateUser?: (user: UserManagementUser) => void;
  onApplyOverrides?: (userId: string, customPermissions: UserManagementUser["customPermissions"]) => void;
  onResetDefaults?: (userId: string) => void;
}

const PERMISSION_ACTIONS: PermissionAction[] = ["view", "create", "edit", "print", "export", "delete", "admin"];

const PERMISSION_MATRIX: Record<PermissionGroup, { label: string; items: { key: string; label: string }[] }> = {
  modules: {
    label: "Modules",
    items: [
      { key: "appointments", label: "Appointments" },
      { key: "residents", label: "Residents / Census" },
      { key: "staff", label: "Staff" },
      { key: "providers", label: "Providers" },
      { key: "transportation", label: "Transportation" },
      { key: "reports", label: "Reports" },
      { key: "settings", label: "Settings" },
      { key: "userManagement", label: "User Management" },
    ],
  },
  departments: {
    label: "Departments",
    items: [
      { key: "nursing", label: "Nursing" },
      { key: "rehab", label: "Rehab" },
      { key: "socialWork", label: "Social Work" },
      { key: "dietary", label: "Dietary" },
      { key: "maintenance", label: "Maintenance" },
      { key: "administration", label: "Administration" },
      { key: "medicalRecords", label: "Medical Records" },
    ],
  },
  appointmentWorkflows: {
    label: "Appointment Workflows",
    items: [
      { key: "appointmentRequests", label: "Appointment Requests" },
      { key: "scheduledAppointments", label: "Scheduled Appointments" },
      { key: "completedAppointments", label: "Completed Appointments" },
      { key: "cancelledAppointments", label: "Cancelled Appointments" },
      { key: "missedAppointments", label: "Missed Appointments" },
      { key: "transportSetup", label: "Transport Setup" },
      { key: "providerCommunication", label: "Provider Communication" },
      { key: "familyNotification", label: "Family Notification" },
      { key: "appointmentDocuments", label: "Appointment Documents" },
    ],
  },
};

const demoUsers: UserManagementUser[] = [
  {
    id: "demo-admin",
    staffId: "staff-demo-admin",
    username: "facility.admin",
    fullName: "Facility Admin",
    email: "admin@example.com",
    title: "Facility Administrator",
    department: "Administration",
    payrollNo: "—",
    status: "active",
    defaultFacilityId: "facility-main",
    assignedFacilityIds: ["facility-main"],
    roleIds: ["role-facility-admin"],
    customPermissions: {},
  },
];

export function canAccessUserManagement(currentUser?: Partial<UserManagementUser> | null) {
  return currentUser?.roleIds?.some((roleId) => USER_MANAGEMENT_ADMIN_ROLES.includes(roleId as any)) ?? false;
}

export function canAssignProtectedRole(currentUser: Partial<UserManagementUser> | null | undefined, roleId: string) {
  if (!PROTECTED_USER_ROLES.includes(roleId as any)) return true;
  return Boolean(
    currentUser?.roleIds?.includes("role-super-admin") || currentUser?.roleIds?.includes("role-org-admin"),
  );
}

export function validateUserManagementInput(input: Partial<UserManagementUser> & { temporaryPassword?: string; confirmPassword?: string }, existingUsers: UserManagementUser[] = []) {
  const errors: string[] = [];
  const username = String(input.username || "").trim();
  const email = String(input.email || "").trim().toLowerCase();

  if (!username) errors.push("Username is required.");
  if (username && !/^[a-z0-9._-]+$/.test(username)) {
    errors.push("Username may only contain lowercase letters, numbers, dots, underscores, and dashes.");
  }
  if (!String(input.fullName || "").trim()) errors.push("Full name is required.");
  if (!input.assignedFacilityIds?.length) errors.push("At least one facility is required.");
  if (!input.defaultFacilityId) errors.push("Default facility is required.");
  if (input.defaultFacilityId && !input.assignedFacilityIds?.includes(input.defaultFacilityId)) {
    errors.push("Default facility must be included in assigned facilities.");
  }
  if (!input.roleIds?.length) errors.push("At least one role is required.");
  if (input.temporaryPassword !== undefined) {
    if (!input.temporaryPassword) errors.push("Temporary password is required for new users.");
    if (input.temporaryPassword && input.temporaryPassword.length < 8) errors.push("Temporary password must be at least 8 characters.");
    if (input.temporaryPassword !== input.confirmPassword) errors.push("Password and confirm password must match.");
  }
  if (existingUsers.some((user) => user.id !== input.id && user.username === username)) errors.push("Duplicate username is blocked.");
  if (email && existingUsers.some((user) => user.id !== input.id && String(user.email || "").toLowerCase() === email)) {
    errors.push("Duplicate email is blocked.");
  }
  if (input.staffId && existingUsers.some((user) => user.id !== input.id && user.status === "active" && user.staffId === input.staffId)) {
    errors.push("Only one active user can be linked to one staff record.");
  }

  return errors;
}

export function UserManagementPage({
  currentUser,
  facilityCount = 0,
  users = demoUsers,
  onRefresh,
  onCreateUser,
  onEditUser,
  onResetPassword,
  onDeactivateUser,
  onApplyOverrides,
  onResetDefaults,
}: UserManagementPageProps) {
  const [activeSection, setActiveSection] = useState<"users" | "matrix" | "templates" | "logs">("users");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || "");
  const selectedUser = users.find((user) => user.id === selectedUserId) || users[0];

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.fullName, user.username, user.email, user.title, user.department, user.roleIds.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, users]);

  if (!canAccessUserManagement(currentUser)) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 text-rose-900">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
          <Lock size={18} /> Admin Only
        </div>
        <p className="mt-2 text-sm font-semibold">
          User Management is restricted to Super Admin, Org Admin, and Facility Admin roles.
        </p>
      </div>
    );
  }

  const menu = [
    { id: "users", label: "Users List", icon: Users },
    { id: "matrix", label: "Access Matrix", icon: ShieldCheck },
    { id: "templates", label: "Role Templates", icon: UserCog },
    { id: "logs", label: "Audit Logs", icon: ClipboardList },
  ] as const;

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
            <LayoutDashboard size={18} className="text-sky-700" /> Management Console
          </div>
          <div className="space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs font-black transition ${
                    activeSection === item.id ? "bg-sky-700 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={15} /> {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Scope & Session</p>
          <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
            <p><span className="font-black text-slate-900">Current user:</span> {currentUser?.fullName || currentUser?.username || "Current Admin"}</p>
            <p><span className="font-black text-slate-900">Manage scope:</span> Facility-based access</p>
            <p><span className="font-black text-slate-900">Facility count:</span> {facilityCount}</p>
          </div>
        </div>
      </aside>

      <main className="space-y-5">
        {activeSection === "users" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Users List</h2>
                <p className="text-xs font-semibold text-slate-500">Search, create, edit, reset, and deactivate system users.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onRefresh} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                  <RefreshCw size={14} className="mr-1 inline" /> Refresh
                </button>
                <button type="button" onClick={onCreateUser} className="rounded-full bg-sky-700 px-4 py-2 text-xs font-black text-white hover:bg-sky-800">
                  <UserPlus size={14} className="mr-1 inline" /> Create User
                </button>
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff, email, title, role, or department..." className="w-full bg-transparent outline-none" />
            </label>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Staff/User</th>
                    <th className="px-3 py-3">Facilities</th>
                    <th className="px-3 py-3">Staff Link</th>
                    <th className="px-3 py-3">Email / Title</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td className="px-3 py-3 font-black text-slate-900">{user.fullName}<div className="text-[10px] font-semibold text-slate-500">@{user.username}</div></td>
                      <td className="px-3 py-3 font-semibold text-slate-600">{user.assignedFacilityIds.length}</td>
                      <td className="px-3 py-3 font-semibold text-slate-600">{user.staffId || "Unlinked"}</td>
                      <td className="px-3 py-3 font-semibold text-slate-600">{user.email || "—"}<div className="text-[10px] text-slate-500">{user.title || "—"}</div></td>
                      <td className="px-3 py-3 font-semibold text-slate-600">{user.roleIds.join(", ")}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${user.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.status}</span></td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          <button onClick={() => { setSelectedUserId(user.id); setActiveSection("matrix"); }} className="rounded-full bg-sky-50 px-2 py-1 font-black text-sky-700">Manage Access Matrix</button>
                          <button onClick={() => onEditUser?.(user)} className="rounded-full bg-slate-50 px-2 py-1 font-black text-slate-700">Edit User</button>
                          <button onClick={() => onResetPassword?.(user)} className="rounded-full bg-amber-50 px-2 py-1 font-black text-amber-700"><KeyRound size={12} className="mr-1 inline" />Reset Password</button>
                          <button onClick={() => onDeactivateUser?.(user)} className="rounded-full bg-rose-50 px-2 py-1 font-black text-rose-700">Deactivate User</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === "matrix" && selectedUser && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Access Matrix</h2>
                <p className="text-xs font-semibold text-slate-500">Apply appointment workflow overrides without changing role templates.</p>
              </div>
              <select value={selectedUser.id} onChange={(event) => setSelectedUserId(event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
                {users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
              </select>
            </div>

            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs font-semibold text-sky-900">
              <p className="font-black">{selectedUser.fullName}</p>
              <p>{selectedUser.email || "No email"} • {selectedUser.title || "No title"} • {selectedUser.roleIds.join(", ")}</p>
            </div>

            <div className="mt-4 space-y-4">
              {Object.entries(PERMISSION_MATRIX).map(([groupKey, group]) => (
                <div key={groupKey} className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-3 text-left font-black text-slate-700">{group.label}</th>
                        {PERMISSION_ACTIONS.map((action) => <th key={action} className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">{action}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item) => (
                        <tr key={item.key}>
                          <td className="px-3 py-3 font-black text-slate-700">{item.label}</td>
                          {PERMISSION_ACTIONS.map((action) => (
                            <td key={`${item.key}-${action}`} className="px-3 py-3 text-center">
                              <input type="checkbox" defaultChecked={Boolean(selectedUser.customPermissions?.[groupKey]?.[item.key]?.[action])} aria-label={`${item.label} ${action}`} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => onResetDefaults?.(selectedUser.id)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">Reset Defaults</button>
              <button type="button" onClick={() => onApplyOverrides?.(selectedUser.id, selectedUser.customPermissions || {})} className="rounded-full bg-sky-700 px-4 py-2 text-xs font-black text-white hover:bg-sky-800">Apply Overrides</button>
            </div>
          </section>
        )}

        {activeSection === "templates" && <Placeholder title="Role Templates" text="Planned for next release. This will provide reusable default access sets for DON/ADON, nursing scheduler, appointment coordinator, transportation, medical records, and read-only users." />}
        {activeSection === "logs" && <Placeholder title="Audit Logs" text="Planned for next release. This will show user creation, access changes, password reset actions, deactivation, and protected role assignment history." />}
      </main>
    </div>
  );
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <ShieldCheck className="mx-auto text-slate-400" size={34} />
      <h2 className="mt-3 text-lg font-black text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold text-slate-600">{text}</p>
    </section>
  );
}

export default UserManagementPage;
