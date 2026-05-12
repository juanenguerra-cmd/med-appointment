export type AppRoleKey = "admin" | "scheduler" | "nursing" | "viewer";

export type AccessAction = "view" | "create" | "edit" | "delete" | "export" | "admin";

export type AccessSubModule = {
  key: string;
  label: string;
  description: string;
  actions: AccessAction[];
};

export type AccessModule = {
  key: string;
  label: string;
  description: string;
  subModules: AccessSubModule[];
};

export const APP_ROLES: Array<{ key: AppRoleKey; label: string; description: string }> = [
  { key: "admin", label: "Administrator", description: "Full setup, user access, recovery, reporting, and operational access." },
  { key: "scheduler", label: "Scheduler / Appointments", description: "Appointment entry, transportation coordination, and appointment reports." },
  { key: "nursing", label: "Nursing", description: "Resident lookup, appointment review, forms, and clinical transport readiness details." },
  { key: "viewer", label: "Read Only / Viewer", description: "View dashboards, census, and reports without editing records." },
];

export const ACCESS_MODULES: AccessModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "High-level overview and operational cards.",
    subModules: [
      { key: "dashboard.overview", label: "Overview Cards", description: "Upcoming visits, scheduling review, counts, and summary cards.", actions: ["view"] },
      { key: "dashboard.quickActions", label: "Quick Actions", description: "Dashboard buttons that open appointment or report workflows.", actions: ["view", "create"] },
    ],
  },
  {
    key: "appointments",
    label: "Appointments",
    description: "Appointment log, entry, editing, forms, and transport details.",
    subModules: [
      { key: "appointments.log", label: "Appointment Log", description: "View appointment list and appointment details.", actions: ["view"] },
      { key: "appointments.create", label: "Create Appointment", description: "Create new appointment records.", actions: ["view", "create"] },
      { key: "appointments.edit", label: "Edit Appointment", description: "Update status, dates, transport, and clinical appointment details.", actions: ["view", "edit"] },
      { key: "appointments.delete", label: "Delete / Soft Delete", description: "Move appointments to deleted records for restore if needed.", actions: ["delete"] },
      { key: "appointments.forms", label: "Forms / PDF Outputs", description: "Generate visit forms, checklist, consult forms, clearance forms, and appointment PDFs.", actions: ["view", "export"] },
      { key: "appointments.bulkEdit", label: "Bulk Save", description: "Save multiple appointment row changes at one time.", actions: ["edit"] },
    ],
  },
  {
    key: "census",
    label: "Patient Census",
    description: "Resident list, resident profile, import, and discharge/recovery workflows.",
    subModules: [
      { key: "census.view", label: "Active Census", description: "View active residents and resident demographics.", actions: ["view"] },
      { key: "census.import", label: "Census Import", description: "Paste and save updated census list.", actions: ["view", "create", "edit"] },
      { key: "census.residentProfile", label: "Resident Profile", description: "Open resident details and appointment history.", actions: ["view"] },
      { key: "census.discharge", label: "Discharge / Inactivate", description: "Mark residents discharged/inactive when no longer on census.", actions: ["edit"] },
      { key: "census.restore", label: "Restore Resident", description: "Restore discharged residents when appropriate.", actions: ["admin"] },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    description: "Report builder, CSV/PDF exports, and appointment summaries.",
    subModules: [
      { key: "reports.builder", label: "Report Builder", description: "Use filters to generate appointment reports.", actions: ["view"] },
      { key: "reports.export", label: "Export Reports", description: "Export CSV/PDF reports.", actions: ["export"] },
      { key: "reports.transport", label: "Transport Schedule", description: "Generate transport schedule outputs.", actions: ["view", "export"] },
      { key: "reports.history", label: "Resident Appointment History", description: "Review past/future appointment summaries by resident.", actions: ["view", "export"] },
    ],
  },
  {
    key: "trends",
    label: "Specialty Trends",
    description: "Analytics and specialty/provider trend views.",
    subModules: [
      { key: "trends.specialty", label: "Specialty Trends", description: "View specialty volume and trends.", actions: ["view"] },
      { key: "trends.provider", label: "Provider Trends", description: "View provider or location trends.", actions: ["view"] },
    ],
  },
  {
    key: "directory",
    label: "Transportation Directory",
    description: "Transportation companies and contact information.",
    subModules: [
      { key: "directory.transportation", label: "Transportation Companies", description: "View transportation directory.", actions: ["view"] },
      { key: "directory.manageTransportation", label: "Manage Transportation", description: "Add, edit, or deactivate transportation companies.", actions: ["create", "edit", "delete"] },
    ],
  },
  {
    key: "help",
    label: "Help / System Guide",
    description: "Version history, user guide, screenshots, and admin tools.",
    subModules: [
      { key: "help.guide", label: "Guide & Version History", description: "View release notes and user guide.", actions: ["view"] },
      { key: "help.screenshot", label: "Screenshot Capture", description: "Use screenshot support workflow.", actions: ["view", "export"] },
      { key: "help.adminRecovery", label: "Admin Recovery & Audit", description: "View audit logs and restore deleted/discharged records.", actions: ["admin"] },
      { key: "help.userAccess", label: "User Access Management", description: "Manage users, roles, facility assignment, and access matrix.", actions: ["admin"] },
    ],
  },
];

const allSubModuleKeys = ACCESS_MODULES.flatMap((module) => module.subModules.map((subModule) => subModule.key));

export const DEFAULT_ROLE_ACCESS: Record<AppRoleKey, string[]> = {
  admin: allSubModuleKeys,
  scheduler: [
    "dashboard.overview",
    "dashboard.quickActions",
    "appointments.log",
    "appointments.create",
    "appointments.edit",
    "appointments.forms",
    "appointments.bulkEdit",
    "census.view",
    "census.residentProfile",
    "reports.builder",
    "reports.export",
    "reports.transport",
    "reports.history",
    "trends.specialty",
    "trends.provider",
    "directory.transportation",
    "help.guide",
  ],
  nursing: [
    "dashboard.overview",
    "appointments.log",
    "appointments.edit",
    "appointments.forms",
    "census.view",
    "census.residentProfile",
    "reports.history",
    "directory.transportation",
    "help.guide",
  ],
  viewer: [
    "dashboard.overview",
    "appointments.log",
    "census.view",
    "census.residentProfile",
    "reports.builder",
    "trends.specialty",
    "directory.transportation",
    "help.guide",
  ],
};

export function normalizeRoleKey(role: unknown): AppRoleKey {
  const normalized = String(role || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (["admin", "administrator", "superadmin"].includes(normalized)) return "admin";
  if (["scheduler", "appointments", "appointmentcoordinator", "transportation"].includes(normalized)) return "scheduler";
  if (["nursing", "nurse", "rn", "lpn"].includes(normalized)) return "nursing";
  return "viewer";
}

export function defaultAccessForRole(role: unknown): string[] {
  return DEFAULT_ROLE_ACCESS[normalizeRoleKey(role)];
}
