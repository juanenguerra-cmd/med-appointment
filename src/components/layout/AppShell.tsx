import { type ReactNode, useState } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  FileText,
  MapPin,
  Menu,
  Phone,
  Plus,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
  X,
} from "lucide-react";

import { Button } from "../Button";
import { NavItem } from "./NavItem";
import { TopTab } from "./TopTab";
import { TAB_META, type Tab } from "../../types/navigation";
import type { Facility } from "../../types";
import { UserManagementPage } from "../../pages/UserManagementPage";

const USER_MANAGEMENT_ADMIN_ROLES = [
  "role-super-admin",
  "role-org-admin",
  "role-facility-admin",
  "admin",
];

type AppShellProps = {
  activeTab: Tab;
  isMenuOpen: boolean;
  currentUser: {
    role?: string;
    roleId?: string;
    roleIds?: string[];
    roles?: string[];
    fullName?: string;
    username?: string;
    assignedFacilityIds?: string[];
    defaultFacilityId?: string;
  } | null;
  facilities: Facility[];
  currentFacilityId: string | null | undefined;
  onNavigate: (tab: Tab) => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onFacilityChange: (facilityId: string) => void;
  onOpenAddAppointment: () => void;
  onLogout: () => void;
  children: ReactNode;
};

function getCurrentUserRoleIds(currentUser: AppShellProps["currentUser"]) {
  return [
    currentUser?.role,
    currentUser?.roleId,
    ...(currentUser?.roleIds || []),
    ...(currentUser?.roles || []),
  ].filter(Boolean) as string[];
}

export function AppShell({
  activeTab,
  isMenuOpen,
  currentUser,
  facilities,
  currentFacilityId,
  onNavigate,
  onToggleMenu,
  onCloseMenu,
  onFacilityChange,
  onOpenAddAppointment,
  onLogout,
  children,
}: AppShellProps) {
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const currentUserRoleIds = getCurrentUserRoleIds(currentUser);
  const isAdmin = currentUserRoleIds.some((roleId) => USER_MANAGEMENT_ADMIN_ROLES.includes(roleId));
  const currentPageMeta = isUserManagementOpen
    ? {
        badge: "Admin Console",
        title: "User Management",
        subtitle:
          "Manage system users, staff links, facility scope, roles, and appointment workflow access.",
      }
    : TAB_META[activeTab];

  const handleNavigate = (tab: Tab) => {
    setIsUserManagementOpen(false);
    onNavigate(tab);
  };

  const handleOpenUserManagement = () => {
    setIsUserManagementOpen(true);
    onCloseMenu();
  };

  return (
    <div className="app-shell min-h-screen flex flex-col lg:flex-row">
      {isMenuOpen && (
        <button
          className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm z-40 lg:hidden"
          aria-label="Close navigation overlay"
          onClick={onCloseMenu}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 p-4 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen
          ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full transport-card overflow-hidden flex flex-col">
          <div className="transport-gradient text-white p-5 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 right-10 h-28 w-28 rounded-full bg-white/10" />

            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Stethoscope size={24} />
              </div>
              <div>
                <h1 className="font-black leading-tight tracking-tight">
                  HealthSync
                </h1>
                <p className="text-[10px] uppercase tracking-[0.22em] font-black opacity-80">
                  Medical Tracker
                </p>
              </div>
            </div>

            <div className="relative mt-4 rounded-2xl bg-white/12 border border-white/20 p-3">
              <p className="text-xs font-black uppercase tracking-wider opacity-90">
                Appointment workspace
              </p>
              <p className="text-xs opacity-80 mt-1 leading-relaxed">
                Navigation, provider directory, and visit history in separated
                pages.
              </p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5 space-y-2" aria-label="Main pages">
            {!isAdmin && (
              <NavItem
                active={!isUserManagementOpen && activeTab === "help"}
                onClick={() => handleNavigate("help")}
                icon={<ShieldCheck size={20} />}
                label="Guide & Info"
              />
            )}

            <NavItem active={!isUserManagementOpen && activeTab === "dashboard"} onClick={() => handleNavigate("dashboard")} icon={<Activity size={20} />} label="Dashboard" />
            <NavItem active={!isUserManagementOpen && activeTab === "appointments"} onClick={() => handleNavigate("appointments")} icon={<Calendar size={20} />} label="Appointments" />
            <NavItem active={!isUserManagementOpen && activeTab === "trends"} onClick={() => handleNavigate("trends")} icon={<BarChart3 size={20} />} label="Trends" />
            <NavItem active={!isUserManagementOpen && activeTab === "reports"} onClick={() => handleNavigate("reports")} icon={<FileText size={20} />} label="Reports" />
            <NavItem active={!isUserManagementOpen && activeTab === "census"} onClick={() => handleNavigate("census")} icon={<Users size={20} />} label="Census" />
            <NavItem active={!isUserManagementOpen && activeTab === "directory"} onClick={() => handleNavigate("directory")} icon={<Phone size={20} />} label="Directory" />

            {isAdmin && (
              <NavItem active={isUserManagementOpen} onClick={handleOpenUserManagement} icon={<UserCog size={20} />} label="User Management" />
            )}

            {isAdmin && (
              <NavItem active={!isUserManagementOpen && activeTab === "help"} onClick={() => handleNavigate("help")} icon={<ShieldCheck size={20} />} label="Help & Info" />
            )}
          </nav>

          <div className="p-4 border-t border-[#d6deeb] bg-[rgba(11,42,111,.03)]">
            <div className="rounded-2xl bg-white border border-[#d6deeb] p-4 shadow-[0_4px_12px_rgba(11,42,111,.08)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-brand font-black text-[10px] uppercase tracking-wider">
                  <ShieldCheck size={14} /> session active
                </div>
                <button onClick={onLogout} className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest">
                  Logout
                </button>
              </div>
              <p className="text-[11px] font-bold text-slate-700">{currentUser?.fullName}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight">
                {isAdmin ? "Administrator" : "Staff Member"} Mode • {facilities.length} Fac.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 py-5 md:px-6 lg:px-8 xl:px-10 page-scrollbar">
        <header className="transport-gradient rounded-2xl p-5 md:p-6 text-white shadow-[0_10px_30px_rgba(11,42,111,.12)] mb-5 relative overflow-hidden">
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute right-24 -bottom-20 h-48 w-48 rounded-full bg-white/10" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-black mb-3">
                {currentPageMeta.badge}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{currentPageMeta.title}</h2>
              <p className="text-sm opacity-90 mt-1 max-w-3xl leading-relaxed">{currentPageMeta.subtitle}</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap xl:justify-end">
              <div className="relative group min-w-[200px]">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none group-focus-within:text-white transition-colors" />
                <select
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-black focus:bg-white/20 focus:outline-none appearance-none transition-all cursor-pointer"
                  value={currentFacilityId || ""}
                  onChange={(event) => onFacilityChange(event.target.value)}
                >
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id} className="text-slate-900">
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button className="gap-2 font-black shadow-lg uppercase tracking-wider text-[10px]" onClick={onOpenAddAppointment}>
                <Plus size={16} /> New Appointment
              </Button>

              <button className="lg:hidden transport-pill h-10 w-10 flex items-center justify-center text-brand" onClick={onToggleMenu} aria-label="Toggle menu">
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </header>

        <div className="mb-6 transport-card p-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <TopTab active={!isUserManagementOpen && activeTab === "dashboard"} onClick={() => handleNavigate("dashboard")} label="Dashboard" />
            <TopTab active={!isUserManagementOpen && activeTab === "appointments"} onClick={() => handleNavigate("appointments")} label="Appointments" />
            <TopTab active={!isUserManagementOpen && activeTab === "trends"} onClick={() => handleNavigate("trends")} label="Specialty Trends" />
            <TopTab active={!isUserManagementOpen && activeTab === "reports"} onClick={() => handleNavigate("reports")} label="Report Builder" />
            <TopTab active={!isUserManagementOpen && activeTab === "census"} onClick={() => handleNavigate("census")} label="Patient Census" />
            <TopTab active={!isUserManagementOpen && activeTab === "directory"} onClick={() => handleNavigate("directory")} label="Directory" />
            {isAdmin && <TopTab active={isUserManagementOpen} onClick={handleOpenUserManagement} label="User Management" />}
            {isAdmin && <TopTab active={!isUserManagementOpen && activeTab === "help"} onClick={() => handleNavigate("help")} label="Guide & Info" />}
          </div>
        </div>

        {isUserManagementOpen ? (
          <UserManagementPage
            currentUser={{
              fullName: currentUser?.fullName,
              username: currentUser?.username || currentUser?.fullName || "admin",
              roleIds: currentUserRoleIds.includes("admin") ? ["role-facility-admin"] : currentUserRoleIds,
              assignedFacilityIds: currentUser?.assignedFacilityIds || facilities.map((facility) => facility.id),
              defaultFacilityId: currentUser?.defaultFacilityId || currentFacilityId || facilities[0]?.id,
            }}
            facilities={facilities.map((facility) => ({ id: facility.id, name: facility.name }))}
            currentFacilityId={currentFacilityId || facilities[0]?.id || ""}
            facilityCount={facilities.length}
          />
        ) : (
          children
        )}
      </main>
    </div>
  );
}
