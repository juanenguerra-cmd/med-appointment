import { useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, UserCog, Users } from "lucide-react";

import App from "./App";
import { UserManagementAdminPage } from "./pages/UserManagementAdminPage";

function readFacilityFallback() {
  try {
    return String(localStorage.getItem("currentFacilityId") || localStorage.getItem("facilityId") || "facility-main");
  } catch {
    return "facility-main";
  }
}

type AdminView = "home" | "user-management";

function getInitialView(): AdminView | null {
  const hash = window.location.hash.toLowerCase();
  if (hash === "#admin/user-management" || hash === "#user-management") return "user-management";
  if (hash === "#admin") return "home";
  return null;
}

function AdminShell({ initialView, onClose }: { initialView: AdminView; onClose: () => void }) {
  const facilityId = useMemo(() => readFacilityFallback(), []);
  const [view, setView] = useState<AdminView>(initialView);

  const openView = (nextView: AdminView) => {
    setView(nextView);
    window.location.hash = nextView === "user-management" ? "admin/user-management" : "admin";
  };

  const closeAdmin = () => {
    window.location.hash = "";
    onClose();
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 rounded-3xl bg-gradient-to-r from-[#0b2a6f] to-[#0f5ea8] p-5 text-white shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wider ring-1 ring-white/20">
                <ShieldCheck size={15} /> Admin Console
              </div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                {view === "user-management" ? "User Management" : "Administration"}
              </h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold text-white/85">
                {view === "user-management"
                  ? "Manage users, staff links, facility scope, roles, password reset, deactivation, and appointment workflow access."
                  : "Central admin page for Med-Appointment setup, users, roles, access matrix, and future audit controls."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {view !== "home" && (
                <button type="button" onClick={() => openView("home")} className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-white ring-1 ring-white/20">
                  <ArrowLeft size={15} /> Admin Home
                </button>
              )}
              <button type="button" onClick={closeAdmin} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0b2a6f] shadow">
                <ArrowLeft size={15} /> Back to App
              </button>
            </div>
          </div>
        </div>

        {view === "home" ? (
          <AdminHome onOpenUserManagement={() => openView("user-management")} />
        ) : (
          <UserManagementAdminPage
            currentUser={{ fullName: "Administrator", username: "admin", roleIds: ["role-facility-admin"], assignedFacilityIds: [facilityId], defaultFacilityId: facilityId }}
            facilities={[{ id: facilityId, name: "Current Facility" }]}
            currentFacilityId={facilityId}
            facilityCount={1}
          />
        )}
      </div>
    </div>
  );
}

function AdminHome({ onOpenUserManagement }: { onOpenUserManagement: () => void }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-sky-50 p-3 text-sky-700"><Users size={24} /></div>
        <div>
          <h2 className="text-xl font-black text-slate-900">User Management</h2>
          <p className="text-sm font-semibold text-slate-600">Users List, Access Matrix, Role Templates, and Audit Logs.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <AdminFeature title="Users List" text="Search, refresh, create, edit, reset password, and deactivate users." />
        <AdminFeature title="Access Matrix" text="Control view, create, edit, print, export, delete, and admin permissions." />
        <AdminFeature title="Role Templates" text="Placeholder for planned default role templates." />
        <AdminFeature title="Audit Logs" text="Placeholder for planned access-change history." />
      </div>
      <button type="button" onClick={onOpenUserManagement} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0b2a6f] px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-[#0f5ea8]">
        <UserCog size={16} /> Open User Management
      </button>
    </section>
  );
}

function AdminFeature({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-sm font-black text-slate-900">{title}</p><p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">{text}</p></div>;
}

export function UserManagementMount() {
  const [adminView, setAdminView] = useState<AdminView | null>(() => getInitialView());
  const openAdmin = () => { window.location.hash = "admin"; setAdminView("home"); };
  const closeAdmin = () => setAdminView(null);

  if (adminView) return <AdminShell initialView={adminView} onClose={closeAdmin} />;

  return (
    <>
      <App />
      <button type="button" onClick={openAdmin} className="fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-[#0b2a6f] px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-2xl ring-4 ring-white/80 transition hover:bg-[#0f5ea8]" aria-label="Open Admin Console">
        <ShieldCheck size={18} /> Admin
      </button>
    </>
  );
}

export default UserManagementMount;
