import { useMemo, useState } from "react";
import { ShieldCheck, UserCog, X } from "lucide-react";

import App from "./App";
import { UserManagementPage } from "./pages/UserManagementPage";

function readFacilityFallback() {
  try {
    const raw = localStorage.getItem("currentFacilityId") || localStorage.getItem("facilityId") || "facility-main";
    return String(raw || "facility-main");
  } catch {
    return "facility-main";
  }
}

function UserManagementStandalone({ onClose }: { onClose?: () => void }) {
  const facilityId = useMemo(() => readFacilityFallback(), []);

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 rounded-3xl bg-gradient-to-r from-[#0b2a6f] to-[#0f5ea8] p-5 text-white shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wider ring-1 ring-white/20">
                <ShieldCheck size={15} /> Admin Console
              </div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">User Management</h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold text-white/85">
                Manage users, staff links, facility scope, roles, password reset, deactivation, and appointment workflow access.
              </p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0b2a6f] shadow"
              >
                <X size={15} /> Back to App
              </button>
            )}
          </div>
        </div>

        <UserManagementPage
          currentUser={{
            fullName: "Administrator",
            username: "admin",
            roleIds: ["role-facility-admin"],
            assignedFacilityIds: [facilityId],
            defaultFacilityId: facilityId,
          }}
          facilities={[{ id: facilityId, name: "Current Facility" }]}
          currentFacilityId={facilityId}
          facilityCount={1}
        />
      </div>
    </div>
  );
}

export function UserManagementMount() {
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(() => window.location.pathname === "/user-management");

  const openUserManagement = () => {
    window.history.pushState(null, "", "/user-management");
    setIsUserManagementOpen(true);
  };

  const closeUserManagement = () => {
    window.history.pushState(null, "", "/");
    setIsUserManagementOpen(false);
  };

  if (isUserManagementOpen) {
    return <UserManagementStandalone onClose={closeUserManagement} />;
  }

  return (
    <>
      <App />
      <button
        type="button"
        onClick={openUserManagement}
        className="fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-[#0b2a6f] px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-2xl ring-4 ring-white/80 transition hover:bg-[#0f5ea8]"
        aria-label="Open User Management"
      >
        <UserCog size={18} /> User Management
      </button>
    </>
  );
}

export default UserManagementMount;
