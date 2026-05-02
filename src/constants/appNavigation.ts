export type AppTab =
  | "dashboard"
  | "appointments"
  | "trends"
  | "reports"
  | "census"
  | "directory"
  | "help";

export type AppTabMeta = {
  title: string;
  subtitle: string;
  badge: string;
};

export const APP_TAB_META: Record<AppTab, AppTabMeta> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "High-level overview of upcoming visits, volume trends, and provider activity.",
    badge: "Overview",
  },
  appointments: {
    title: "Appointments",
    subtitle: "Manage and monitor all scheduled medical visits and logistics in one place.",
    badge: "Entry Log",
  },
  trends: {
    title: "Specialty Trends",
    subtitle: "Visualize visit volume by specialty to identify service demand and distribution.",
    badge: "Analytics",
  },
  reports: {
    title: "Report Builder",
    subtitle: "Generate and export clinical data reports for specific date ranges or providers.",
    badge: "Operations",
  },
  census: {
    title: "Patient Census",
    subtitle: "Manage resident data, unit assignments, and room allocations for auto-fill.",
    badge: "Registry",
  },
  directory: {
    title: "Transportation Directory",
    subtitle: "Manage transportation company names and contact details for appointment auto-fill.",
    badge: "Directory",
  },
  help: {
    title: "System Guide",
    subtitle: "Version history, user instructions, and technical documentation.",
    badge: "Support",
  },
};

export const APP_TABS: AppTab[] = [
  "dashboard",
  "appointments",
  "trends",
  "reports",
  "census",
  "directory",
  "help",
];
