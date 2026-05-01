import { useState } from "react";
import { Plus, Search, X, FileText, Calendar, Printer, BarChart3, Users, Link2, Database } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";
import { Facility } from "../types";

interface AdminGuideToolsProps {
  currentUserRole?: string | null;
  facilities: Facility[];
  currentFacilityId: string | null;
  setCurrentFacilityId: (id: string) => void;
  setEditingFac: (facility: Facility | null) => void;
  setIsFacModalOpen: (open: boolean) => void;
  deleteFacility: (id: string) => void;
  users: any[];
  setEditingUser: (user: any | null) => void;
  setIsUserModalOpen: (open: boolean) => void;
}

const isAdminRole = (role: unknown) => {
  const normalized = String(role || "").trim().toLowerCase();
  return normalized === "admin" || normalized === "administrator" || normalized === "super admin" || normalized === "superadmin";
};

const includesQuery = (value: unknown, query: string) => String(value || "").toLowerCase().includes(query);

const SummaryTile = ({ label, value, hint }: { label: string; value: number | string; hint: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    <p className="mt-1 text-[11px] font-semibold text-slate-500">{hint}</p>
  </div>
);

const SearchBox = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => (
  <div className="relative">
    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-xs font-semibold text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Clear search"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

export function AdminGuideTools({
  currentUserRole,
  facilities,
  currentFacilityId,
  setCurrentFacilityId,
  setEditingFac,
  setIsFacModalOpen,
  deleteFacility,
  users,
  setEditingUser,
  setIsUserModalOpen,
}: AdminGuideToolsProps) {
  const [facilitySearch, setFacilitySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const isAdmin = isAdminRole(currentUserRole);
  const adminUsers = users.filter((user: any) => isAdminRole(user?.role)).length;
  const staffUsers = Math.max(users.length - adminUsers, 0);
  const currentFacility = facilities.find((facility) => facility.id === currentFacilityId);
  const normalizedFacilitySearch = facilitySearch.trim().toLowerCase();
  const normalizedUserSearch = userSearch.trim().toLowerCase();

  const filteredFacilities = normalizedFacilitySearch
    ? facilities.filter((facility) =>
        includesQuery(facility.name, normalizedFacilitySearch) ||
        includesQuery((facility as any).address, normalizedFacilitySearch) ||
        includesQuery((facility as any).phone, normalizedFacilitySearch)
      )
    : facilities;

  const filteredUsers = normalizedUserSearch
    ? users.filter((user: any) =>
        includesQuery(user.fullName, normalizedUserSearch) ||
        includesQuery(user.name, normalizedUserSearch) ||
        includesQuery(user.email, normalizedUserSearch) ||
        includesQuery(user.role, normalizedUserSearch)
      )
    : users;

  const openNewFacility = () => {
    setEditingFac(null);
    setIsFacModalOpen(true);
  };

  const openNewUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card
        title="Guide & Help (Current Workflow)"
        subtitle="Quick guide on census reconciliation, scheduling review, reporting, and resident appointment history."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 text-xs font-semibold text-slate-600">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Users size={14}/> Smart Census</p>
            <p>Paste the current Resident Listing Report into Patient Census, preview the parsed list, then save. Residents missing from the new census are marked Discharged instead of being deleted.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Link2 size={14}/> Resident Identity</p>
            <p>When creating appointments, select the resident from the search list when available. New appointments store resident identity details so history is more reliable than name matching alone.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Printer size={14}/> Resident Summary</p>
            <p>Open Census → View to review resident details, appointment history, and Print All, Historical, or Future appointment summaries.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Calendar size={14}/> Scheduling Review</p>
            <p>If an exact appointment date is not available, save the request as Pending Scheduling Review. The coordinator can complete details later.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><BarChart3 size={14}/> Reporting</p>
            <p>Use filters for date, unit, status, specialty, or transportation company, then export CSV or PDF for review.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Database size={14}/> Database Alignment</p>
            <p>Admins should keep migrations current so facility, user, resident, transportation, and appointment fields match the app.</p>
          </div>
        </div>
      </Card>

      {isAdmin ? (
        <>
          <Card
            title="Admin Management Snapshot"
            subtitle="Quick counts for facility and user setup."
            actions={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="primary" icon={<Plus size={16} />} onClick={openNewFacility}>New Facility</Button>
                <Button variant="primary" icon={<Plus size={16} />} onClick={openNewUser}>New User</Button>
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryTile label="Facilities" value={facilities.length} hint="Facility profiles configured" />
              <SummaryTile label="Current Facility" value={currentFacility ? "Set" : "Missing"} hint={currentFacility?.name || "Choose or add a facility"} />
              <SummaryTile label="Admin Users" value={adminUsers} hint="Users with admin-level role" />
              <SummaryTile label="Staff Users" value={staffUsers} hint="Non-admin users loaded" />
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card
              title="Facility Management"
              subtitle="Configure facility profiles and active facility selection."
              actions={
                <Button variant="primary" icon={<Plus size={16} />} onClick={openNewFacility}>
                  New Facility
                </Button>
              }
            >
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-sky-900">Facility Quick Action</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">Add a facility profile or update an existing facility.</p>
                </div>
                <Button className="w-full sm:w-auto" variant="primary" icon={<Plus size={16} />} onClick={openNewFacility}>
                  New Facility
                </Button>
              </div>

              <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <SearchBox value={facilitySearch} onChange={setFacilitySearch} placeholder="Search facilities by name, address, or phone..." />
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Showing {filteredFacilities.length} of {facilities.length}
                </p>
              </div>

              <div className="space-y-3">
                {facilities.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                    No facilities found. Use New Facility to add the first facility.
                  </div>
                )}

                {facilities.length > 0 && filteredFacilities.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                    No facilities match your search.
                  </div>
                )}

                {filteredFacilities.map((facility) => {
                  const isCurrent = facility.id === currentFacilityId;
                  return (
                    <div key={facility.id} className={`rounded-2xl border p-4 ${isCurrent ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black text-slate-800">{facility.name}</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Facility Profile</p>
                          {isCurrent && (
                            <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">Current Facility</p>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:flex">
                          <Button variant="secondary" onClick={() => setCurrentFacilityId(facility.id)}>Set</Button>
                          <Button variant="secondary" onClick={() => { setEditingFac(facility); setIsFacModalOpen(true); }}>Edit</Button>
                          <Button variant="danger" onClick={() => deleteFacility(facility.id)}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card
              title="User Access Management"
              subtitle="Add users, edit user details, and manage access workflow."
              actions={
                <Button variant="primary" icon={<Plus size={16} />} onClick={openNewUser}>
                  New User
                </Button>
              }
            >
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-sky-900">User Quick Action</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">Add a new user or update an existing user profile.</p>
                </div>
                <Button className="w-full sm:w-auto" variant="primary" icon={<Plus size={16} />} onClick={openNewUser}>
                  New User
                </Button>
              </div>

              <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <SearchBox value={userSearch} onChange={setUserSearch} placeholder="Search users by name, email, or role..." />
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Showing {filteredUsers.length} of {users.length}
                </p>
              </div>

              <div className="space-y-3">
                {users.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                    No users loaded. Use New User to add a user, or refresh after confirming admin access.
                  </div>
                )}

                {users.length > 0 && filteredUsers.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                    No users match your search.
                  </div>
                )}

                {filteredUsers.map((u: any) => (
                  <div key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-black text-slate-800">{u.fullName || u.name || u.email}</p>
                        <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600">{u.role || "Staff"}</p>
                      </div>
                      <Button className="w-full sm:w-auto" onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}>Edit User</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card
          title="Admin Management"
          subtitle="Facility and user management actions are available for admin accounts only."
        >
          <p className="text-xs font-semibold text-slate-500">
            Current role detected: <span className="font-black text-slate-700">{String(currentUserRole || "Not provided")}</span>
          </p>
        </Card>
      )}
    </div>
  );
}
