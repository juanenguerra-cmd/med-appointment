export const USER_MANAGEMENT_ROUTE = "/admin/user-management";
export const ADMIN_ROUTE = "/admin";

export const USER_MANAGEMENT_ENDPOINTS = {
  listUsers: "GET /api/users",
  createUser: "POST /api/users",
  updateUser: "POST /api/users/update",
  deactivateUser: "POST /api/users/deactivate",
  resetPassword: "POST /api/auth/reset-password",
  listStaffByFacility: "GET /api/staff?facilityId=<facilityId>",
} as const;

export const USER_MANAGEMENT_ADMIN_ROLES = [
  "role-super-admin",
  "role-org-admin",
  "role-facility-admin",
] as const;

export const PROTECTED_USER_ROLES = [
  "role-super-admin",
  "role-org-admin",
] as const;

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

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "print",
  "export",
  "delete",
  "admin",
] as const;

export const USER_MANAGEMENT_PERMISSION_MATRIX = {
  modules: [
    "appointments",
    "residents",
    "staff",
    "providers",
    "transportation",
    "reports",
    "settings",
    "userManagement",
  ],
  departments: [
    "nursing",
    "rehab",
    "socialWork",
    "dietary",
    "maintenance",
    "administration",
    "medicalRecords",
  ],
  nursingSubsections: [
    "appointmentRequests",
    "scheduledAppointments",
    "completedAppointments",
    "cancelledAppointments",
    "missedAppointments",
    "transportSetup",
    "providerCommunication",
    "familyNotification",
    "appointmentDocuments",
  ],
} as const;

export type UserManagementRoleId = (typeof BUILT_IN_USER_ROLES)[number];
export type UserManagementPermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type UserManagementPermissionGroup = keyof typeof USER_MANAGEMENT_PERMISSION_MATRIX;

export type UserManagementCustomPermissions = Partial<Record<
  UserManagementPermissionGroup,
  Record<string, Partial<Record<UserManagementPermissionAction, boolean>>>
>>;

export type UserManagementUserStatus = "active" | "inactive";

export interface UserManagementUserSchema {
  id: string;
  staffId?: string;
  username: string;
  fullName: string;
  email?: string;
  title?: string;
  department?: string;
  payrollNo?: string;
  status: UserManagementUserStatus;
  defaultFacilityId: string;
  assignedFacilityIds: string[];
  roleIds: UserManagementRoleId[] | string[];
  customPermissions?: UserManagementCustomPermissions;
  forcePasswordReset?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const USER_MANAGEMENT_VALIDATION_RULES = [
  "username required",
  "username lowercase letters, numbers, dots, underscores, dashes only",
  "full name required",
  "at least one facility required",
  "default facility required",
  "default facility must be included in assigned facilities",
  "at least one role required",
  "temporary password required for new users",
  "temporary password minimum 8 characters",
  "password and confirm password must match",
  "duplicate username blocked",
  "duplicate email blocked",
  "only one active user can be linked to one staff record",
  "facility admin can only assign users to their assigned facilities",
  "only super admin or org admin can assign protected roles",
] as const;

export const USER_MANAGEMENT_SAFETY_RULES = [
  "Deactivation must not delete the user; set status to inactive.",
  "Deactivation must require typing DEACTIVATE.",
  "Password reset must not expose password hashes.",
  "Password reset must not store passwords in localStorage.",
] as const;
