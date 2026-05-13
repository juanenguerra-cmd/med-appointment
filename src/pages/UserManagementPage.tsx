import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  Lock,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { apiFetch } from "../api/apiClient";
import { MIN_PASSWORD_LENGTH } from "../auth/passwordPolicy";

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
export type PermissionGroup = "modules" | "departments" | "nursingSubsections";
export type PermissionMatrix = Record<string, Record<string, Partial<Record<PermissionAction, boolean>>>>;

export interface UserManagementUser {
  id: string;
  staffId?: string;
  username: string;
  fullName: string;
  email?: string;
  title?: string;
  department?: string;
  payrollNo?: string;
  status: "active" | "inactive" | string;
  defaultFacilityId: string;
  assignedFacilityIds: string[];
  roleIds: UserManagementRoleId[] | string[];
  customPermissions?: PermissionMatrix;
  forcePasswordReset?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserManagementStaff {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  title?: string;
  department?: string;
  payrollNo?: string;
  facilityId?: string;
}

export interface UserManagementFacility {
  id: string;
  name: string;
}

export interface UserManagementPageProps {
  currentUser?: Partial<UserManagementUser> | null;
  facilities?: UserManagementFacility[];
  currentFacilityId?: string | null;
  facilityCount?: number;
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
  nursingSubsections: {
    label: "Nursing Subsections",
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

const emptyForm = (facilityId = ""): UserManagementUser & { temporaryPassword: string; confirmPassword: string } => ({
  id: "",
  staffId: "",
  username: "",
  fullName: "",
  email: "",
  title: "",
  department: "",
  payrollNo: "",
  status: "active",
  defaultFacilityId: facilityId,
  assignedFacilityIds: facilityId ? [facilityId] : [],
  roleIds: [],
  customPermissions: {},
  forcePasswordReset: true,
  createdAt: "",
  updatedAt: "",
  temporaryPassword: "",
  confirmPassword: "",
});

const normalizeUsersResponse = (value: unknown): UserManagementUser[] => {
  if (Array.isArray(value)) return value as UserManagementUser[];
  if (value && typeof value === "object" && Array.isArray((value as any).users)) return (value as any).users;
  return [];
};

const normalizeStaffResponse = (value: unknown): UserManagementStaff[] => {
  if (Array.isArray(value)) return value as UserManagementStaff[];
  if (value && typeof value === "object" && Array.isArray((value as any).staff)) return (value as any).staff;
  return [];
};

const getRoleIds = (currentUser?: Partial<UserManagementUser> | null) => currentUser?.roleIds || [];

export function canAccessUserManagement(currentUser?: Partial<UserManagementUser> | null) {
  return getRoleIds(currentUser).some((roleId) => USER_MANAGEMENT_ADMIN_ROLES.includes(roleId as any));
}

export function canAssignProtectedRole(currentUser: Partial<UserManagementUser> | null | undefined, roleId: string) {
  if (!PROTECTED_USER_ROLES.includes(roleId as any)) return true;
  return Boolean(
    currentUser?.roleIds?.includes("role-super-admin") || currentUser?.roleIds?.includes("role-org-admin"),
  );
}

function canManageFacility(currentUser: Partial<UserManagementUser> | null | undefined, facilityId: string) {
  if (!facilityId) return true;
  if (currentUser?.roleIds?.includes("role-super-admin") || currentUser?.roleIds?.includes("role-org-admin")) return true;
  if (!currentUser?.roleIds?.includes("role-facility-admin")) return false;
  return Boolean(currentUser.assignedFacilityIds?.includes(facilityId) || currentUser.defaultFacilityId === facilityId);
}

export function validateUserManagementInput(
  input: Partial<UserManagementUser> & { temporaryPassword?: string; confirmPassword?: string },
  existingUsers: UserManagementUser[] = [],
  currentUser?: Partial<UserManagementUser> | null,
) {
  const errors: string[] = [];
  const username = String(input.username || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const isNew = !input.id;

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
  if (isNew) {
    if (!input.temporaryPassword) errors.push("Temporary password is required for new users.");
    if (input.temporaryPassword && input.temporaryPassword.length < MIN_PASSWORD_LENGTH) errors.push(`Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (input.temporaryPassword !== input.confirmPassword) errors.push("Password and confirm password must match.");
  }
  if (existingUsers.some((user) => user.id !== input.id && user.username === username)) errors.push("Duplicate username is blocked.");
  if (email && existingUsers.some((user) => user.id !== input.id && String(user.email || "").toLowerCase() === email)) {
    errors.push("Duplicate email is blocked.");
  }
  if (input.staffId && existingUsers.some((user) => user.id !== input.id && user.status === "active" && user.staffId === input.staffId)) {
    errors.push("Only one active user can be linked to one staff record.");
  }
  input.assignedFacilityIds?.forEach((facilityId) => {
    if (!canManageFacility(currentUser, facilityId)) errors.push("Facility admin can only assign users to their assigned facilities.");
  });
  input.roleIds?.forEach((roleId) => {
    if (!canAssignProtectedRole(currentUser, roleId)) errors.push("Only super admin or org admin can assign protected roles.");
  });

  return Array.from(new Set(errors));
}

function buildEmptyMatrix(): PermissionMatrix {
  return Object.fromEntries(
    Object.entries(PERMISSION_MATRIX).map(([groupKey, group]) => [
      groupKey,
      Object.fromEntries(group.items.map((item) => [item.key, Object.fromEntries(PERMISSION_ACTIONS.map((action) => [action, false]))])),
    ]),
  ) as PermissionMatrix;
}

function mergeMatrix(customPermissions?: PermissionMatrix): PermissionMatrix {
  const base = buildEmptyMatrix();
  Object.entries(customPermissions || {}).forEach(([groupKey, rows]) => {
    base[groupKey] = base[groupKey] || {};
    Object.entries(rows || {}).forEach(([rowKey, actions]) => {
      base[groupKey][rowKey] = { ...(base[groupKey][rowKey] || {}), ...(actions || {}) };
    });
  });
  return base;
}

export function UserManagementPage({ currentUser, facilities = [], currentFacilityId, facilityCount }: UserManagementPageProps) {
  const [activeSection, setActiveSection] = useState<"users" | "matrix" | "templates" | "logs">("users");
  const [users, setUsers] = useState<UserManagementUser[]>([]);
  const [staff, setStaff] = useState<UserManagementStaff[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [matrixDraft, setMatrixDraft] = useState<PermissionMatrix>(buildEmptyMatrix());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editorUser, setEditorUser] = useState<ReturnType<typeof emptyForm> | null>(null);
  const [resetUser, setResetUser] = useState<UserManagementUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [deactivateUser, setDeactivateUser] = useState<UserManagementUser | null>(null);
  const [deactivateText, setDeactivateText] = useState("");

  const selectedUser = users.find((user) => user.id === selectedUserId) || users[0];
  const effectiveFacilityCount = facilityCount ?? facilities.length;
  const isSuperOrOrg = Boolean(currentUser?.roleIds?.includes("role-super-admin") || currentUser?.roleIds?.includes("role-org-admin"));

  const availableFacilities = useMemo(() => {
    if (isSuperOrOrg) return facilities;
    const allowed = new Set([...(currentUser?.assignedFacilityIds || []), currentUser?.defaultFacilityId].filter(Boolean));
    return facilities.filter((facility) => allowed.has(facility.id));
  }, [currentUser, facilities, isSuperOrOrg]);

  const loadUsers = async () => {
    setIsLoading(true);
    setNotice(null);
    try {
      const data = await apiFetch<unknown>("/api/users");
      const normalized = normalizeUsersResponse(data);
      setUsers(normalized);
      if (!selectedUserId && normalized[0]?.id) setSelectedUserId(normalized[0].id);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to load users." });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaff = async (facilityId: string) => {
    if (!facilityId) {
      setStaff([]);
      return;
    }
    try {
      const data = await apiFetch<unknown>(`/api/staff?facilityId=${encodeURIComponent(facilityId)}`);
      setStaff(normalizeStaffResponse(data));
    } catch {
      setStaff([]);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) setMatrixDraft(mergeMatrix(selectedUser.customPermissions));
  }, [selectedUser?.id]);

  useEffect(() => {
    void loadStaff(editorUser?.defaultFacilityId || currentFacilityId || availableFacilities[0]?.id || "");
  }, [editorUser?.defaultFacilityId, currentFacilityId, availableFacilities[0]?.id]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.fullName, user.username, user.email, user.title, user.department, user.staffId, user.roleIds.join(" ")]
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

  const openCreate = () => setEditorUser(emptyForm(currentFacilityId || availableFacilities[0]?.id || ""));
  const openEdit = (user: UserManagementUser) => setEditorUser({ ...emptyForm(user.defaultFacilityId), ...user, temporaryPassword: "", confirmPassword: "" });

  const saveUser = async () => {
    if (!editorUser) return;
    const cleanUser = {
      ...editorUser,
      username: editorUser.username.trim().toLowerCase(),
      fullName: editorUser.fullName.trim(),
      email: editorUser.email?.trim(),
    };
    const errors = validateUserManagementInput(cleanUser, users, currentUser);
    if (errors.length) {
      setNotice({ type: "error", text: errors.join(" ") });
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !cleanUser.id;
      const endpoint = isNew ? "/api/users" : "/api/users/update";
      const payload = isNew
        ? cleanUser
        : Object.fromEntries(Object.entries(cleanUser).filter(([key]) => !["temporaryPassword", "confirmPassword"].includes(key)));
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify(payload) });
      setEditorUser(null);
      setNotice({ type: "success", text: isNew ? "User created successfully." : "User updated successfully." });
      await loadUsers();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to save user." });
    } finally {
      setIsSaving(false);
    }
  };

  const applyOverrides = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await apiFetch("/api/users/update", {
        method: "POST",
        body: JSON.stringify({ id: selectedUser.id, customPermissions: matrixDraft }),
      });
      setNotice({ type: "success", text: "Access Matrix overrides applied." });
      await loadUsers();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to apply overrides." });
    } finally {
      setIsSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await apiFetch("/api/users/update", {
        method: "POST",
        body: JSON.stringify({ id: selectedUser.id, customPermissions: {} }),
      });
      setMatrixDraft(buildEmptyMatrix());
      setNotice({ type: "success", text: "Custom permissions cleared. Role defaults will apply." });
      await loadUsers();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to reset defaults." });
    } finally {
      setIsSaving(false);
    }
  };

  const submitResetPassword = async () => {
    if (!resetUser) return;
    if (resetPassword.length < MIN_PASSWORD_LENGTH || resetPassword !== resetConfirm) {
      setNotice({ type: "error", text: `Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters and match confirmation.` });
      return;
    }
    setIsSaving(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ userId: resetUser.id, temporaryPassword: resetPassword, forcePasswordReset: true }),
      });
      setResetUser(null);
      setResetPassword("");
      setResetConfirm("");
      setNotice({ type: "success", text: "Temporary password reset submitted. Password hashes were not exposed or stored locally." });
      await loadUsers();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to reset password." });
    } finally {
      setIsSaving(false);
    }
  };

  const submitDeactivate = async () => {
    if (!deactivateUser) return;
    if (deactivateText !== "DEACTIVATE") {
      setNotice({ type: "error", text: "Type DEACTIVATE to confirm deactivation." });
      return;
    }
    setIsSaving(true);
    try {
      await apiFetch("/api/users/deactivate", {
        method: "POST",
        body: JSON.stringify({ userId: deactivateUser.id, confirmationText: "DEACTIVATE" }),
      });
      setDeactivateUser(null);
      setDeactivateText("");
      setNotice({ type: "success", text: "User deactivated. The user record was not deleted." });
      await loadUsers();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to deactivate user." });
    } finally {
      setIsSaving(false);
    }
  };

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
            <p><span className="font-black text-slate-900">Manage scope:</span> {isSuperOrOrg ? "Organization-wide" : "Assigned facilities only"}</p>
            <p><span className="font-black text-slate-900">Facility count:</span> {effectiveFacilityCount}</p>
          </div>
        </div>
      </aside>

      <main className="space-y-5">
        {notice && (
          <div className={`flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold ${notice.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"}`}>
            {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{notice.text}</span>
          </div>
        )}

        {activeSection === "users" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Users List</h2>
                <p className="text-xs font-semibold text-slate-500">Search, create, edit, reset, and deactivate system users.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={loadUsers} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                  <RefreshCw size={14} className="mr-1 inline" /> {isLoading ? "Refreshing..." : "Refresh"}
                </button>
                <button type="button" onClick={openCreate} className="rounded-full bg-sky-700 px-4 py-2 text-xs font-black text-white hover:bg-sky-800">
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
                      <td className="px-3 py-3 font-semibold text-slate-600">{user.assignedFacilityIds?.length || 0}</td>
                      <td className="px-3 py-3 font-semibold text-slate-600">{user.staffId || "Unlinked"}</td>
                      <td className="px-3 py-3 font-semibold text-slate-600">{user.email || "—"}<div className="text-[10px] text-slate-500">{user.title || "—"}</div></td>
                      <td className="px-3 py-3 font-semibold text-slate-600">{user.roleIds.map((role) => ROLE_LABELS[role] || role).join(", ")}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${user.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.status}</span></td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          <button onClick={() => { setSelectedUserId(user.id); setActiveSection("matrix"); }} className="rounded-full bg-sky-50 px-2 py-1 font-black text-sky-700">Manage Access Matrix</button>
                          <button onClick={() => openEdit(user)} className="rounded-full bg-slate-50 px-2 py-1 font-black text-slate-700">Edit User</button>
                          <button onClick={() => setResetUser(user)} className="rounded-full bg-amber-50 px-2 py-1 font-black text-amber-700"><KeyRound size={12} className="mr-1 inline" />Reset Password</button>
                          <button onClick={() => setDeactivateUser(user)} className="rounded-full bg-rose-50 px-2 py-1 font-black text-rose-700">Deactivate User</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredUsers.length && (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-sm font-semibold text-slate-500">No users found. Use Create User or Refresh.</td></tr>
                  )}
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
                <p className="text-xs font-semibold text-slate-500">Reset Defaults clears customPermissions. Apply Overrides saves customPermissions.</p>
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
                              <input
                                type="checkbox"
                                checked={Boolean(matrixDraft[groupKey]?.[item.key]?.[action])}
                                onChange={(event) => setMatrixDraft((prev) => ({
                                  ...prev,
                                  [groupKey]: {
                                    ...(prev[groupKey] || {}),
                                    [item.key]: { ...(prev[groupKey]?.[item.key] || {}), [action]: event.target.checked },
                                  },
                                }))}
                                aria-label={`${item.label} ${action}`}
                              />
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
              <button type="button" disabled={isSaving} onClick={resetDefaults} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">Reset Defaults</button>
              <button type="button" disabled={isSaving} onClick={applyOverrides} className="rounded-full bg-sky-700 px-4 py-2 text-xs font-black text-white hover:bg-sky-800"><Save size={14} className="mr-1 inline" /> Apply Overrides</button>
            </div>
          </section>
        )}

        {activeSection === "templates" && <Placeholder title="Role Templates" text="Planned for next release. This will provide reusable default access sets for DON/ADON, nursing scheduler, appointment coordinator, transportation, medical records, and read-only users." />}
        {activeSection === "logs" && <Placeholder title="Audit Logs" text="Planned for next release. This will show user creation, access changes, password reset actions, deactivation, and protected role assignment history." />}
      </main>

      {editorUser && (
        <Modal title={editorUser.id ? "Edit User" : "Create User"} onClose={() => setEditorUser(null)}>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Username" value={editorUser.username} onChange={(value) => setEditorUser({ ...editorUser, username: value.toLowerCase() })} />
            <TextField label="Full Name" value={editorUser.fullName} onChange={(value) => setEditorUser({ ...editorUser, fullName: value })} />
            <TextField label="Email" value={editorUser.email || ""} onChange={(value) => setEditorUser({ ...editorUser, email: value })} />
            <TextField label="Title" value={editorUser.title || ""} onChange={(value) => setEditorUser({ ...editorUser, title: value })} />
            <TextField label="Department" value={editorUser.department || ""} onChange={(value) => setEditorUser({ ...editorUser, department: value })} />
            <TextField label="Payroll No." value={editorUser.payrollNo || ""} onChange={(value) => setEditorUser({ ...editorUser, payrollNo: value })} />
            {!editorUser.id && <TextField label="Temporary Password" type="password" value={editorUser.temporaryPassword} onChange={(value) => setEditorUser({ ...editorUser, temporaryPassword: value })} />}
            {!editorUser.id && <TextField label="Confirm Password" type="password" value={editorUser.confirmPassword} onChange={(value) => setEditorUser({ ...editorUser, confirmPassword: value })} />}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-black text-slate-700">Default Facility
              <select className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold" value={editorUser.defaultFacilityId} onChange={(event) => {
                const facilityId = event.target.value;
                const assigned = editorUser.assignedFacilityIds.includes(facilityId) ? editorUser.assignedFacilityIds : [...editorUser.assignedFacilityIds, facilityId];
                setEditorUser({ ...editorUser, defaultFacilityId: facilityId, assignedFacilityIds: assigned });
              }}>
                <option value="">Select default facility</option>
                {availableFacilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
              </select>
            </label>

            <label className="text-xs font-black text-slate-700">Staff Link
              <select className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold" value={editorUser.staffId || ""} onChange={(event) => {
                const selectedStaff = staff.find((item) => item.id === event.target.value);
                setEditorUser({
                  ...editorUser,
                  staffId: event.target.value,
                  fullName: selectedStaff?.fullName || selectedStaff?.name || editorUser.fullName,
                  email: selectedStaff?.email || editorUser.email,
                  title: selectedStaff?.title || editorUser.title,
                  department: selectedStaff?.department || editorUser.department,
                  payrollNo: selectedStaff?.payrollNo || editorUser.payrollNo,
                });
              }}>
                <option value="">No staff link</option>
                {staff.map((item) => <option key={item.id} value={item.id}>{item.fullName || item.name || item.id}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CheckboxGroup
              title="Assigned Facilities"
              items={availableFacilities.map((facility) => ({ key: facility.id, label: facility.name }))}
              values={editorUser.assignedFacilityIds}
              onChange={(values) => setEditorUser({
                ...editorUser,
                assignedFacilityIds: values,
                defaultFacilityId: values.includes(editorUser.defaultFacilityId) ? editorUser.defaultFacilityId : values[0] || "",
              })}
            />
            <CheckboxGroup
              title="Roles"
              items={BUILT_IN_USER_ROLES.map((role) => ({ key: role, label: ROLE_LABELS[role] || role, disabled: !canAssignProtectedRole(currentUser, role) }))}
              values={editorUser.roleIds as string[]}
              onChange={(values) => setEditorUser({ ...editorUser, roleIds: values })}
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setEditorUser(null)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Cancel</button>
            <button disabled={isSaving} onClick={saveUser} className="rounded-full bg-sky-700 px-4 py-2 text-xs font-black text-white">{isSaving ? "Saving..." : "Save User"}</button>
          </div>
        </Modal>
      )}

      {resetUser && (
        <Modal title={`Reset Password: ${resetUser.fullName}`} onClose={() => setResetUser(null)}>
          <p className="text-sm font-semibold text-slate-600">Temporary passwords are sent to the backend only. Password hashes are never exposed or stored in localStorage.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <TextField label="Temporary Password" type="password" value={resetPassword} onChange={setResetPassword} />
            <TextField label="Confirm Password" type="password" value={resetConfirm} onChange={setResetConfirm} />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setResetUser(null)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Cancel</button>
            <button disabled={isSaving} onClick={submitResetPassword} className="rounded-full bg-amber-600 px-4 py-2 text-xs font-black text-white">Reset Password</button>
          </div>
        </Modal>
      )}

      {deactivateUser && (
        <Modal title={`Deactivate User: ${deactivateUser.fullName}`} onClose={() => setDeactivateUser(null)}>
          <p className="text-sm font-semibold text-rose-700">This does not delete the user. It sets status to inactive. Type DEACTIVATE to continue.</p>
          <TextField label="Confirmation" value={deactivateText} onChange={setDeactivateText} />
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDeactivateUser(null)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Cancel</button>
            <button disabled={isSaving || deactivateText !== "DEACTIVATE"} onClick={submitDeactivate} className="rounded-full bg-rose-700 px-4 py-2 text-xs font-black text-white disabled:opacity-40"><Trash2 size={14} className="mr-1 inline" />Deactivate</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="text-xs font-black text-slate-700">{label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold outline-none focus:border-sky-500" />
    </label>
  );
}

function CheckboxGroup({ title, items, values, onChange }: { title: string; items: { key: string; label: string; disabled?: boolean }[]; values: string[]; onChange: (values: string[]) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <p className="mb-2 text-xs font-black text-slate-700">{title}</p>
      <div className="max-h-56 space-y-2 overflow-auto pr-1">
        {items.map((item) => (
          <label key={item.key} className={`flex items-center gap-2 text-xs font-semibold ${item.disabled ? "text-slate-300" : "text-slate-700"}`}>
            <input
              type="checkbox"
              checked={values.includes(item.key)}
              disabled={item.disabled}
              onChange={(event) => onChange(event.target.checked ? [...values, item.key] : values.filter((value) => value !== item.key))}
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X size={18} /></button>
        </div>
        {children}
      </div>
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
