import { Home, Plus, User, FileText, Calendar, Printer, BarChart3, Users, Link2, Database } from "lucide-react";
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
  const isAdmin = isAdminRole(currentUserRole);

  return (
    <div className="space-y-6">
      <Card
        icon={<FileText size={22} />}
        title="Guide & Help (Current Workflow)"
        subtitle="Quick guide on census reconciliation, scheduling review, reporting, and resident appointment history."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 text-xs font-semibold text-slate-600">
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Users size={14}/> Smart Census</p>
            <p>Paste the current Resident Listing Report into Patient Census, preview the parsed list, then save. Residents missing from the new census are marked Discharged instead of being deleted.</p>
          </div>
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Link2 size={14}/> Resident Identity</p>
            <p>When creating appointments, select the resident from the search list when available. New appointments store resident identity details so history is more reliable than name matching alone.</p>
          </div>
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Printer size={14}/> Resident Summary</p>
            <p>Open Census → View to review resident details, appointment history, and Print All, Historical, or Future appointment summaries. The View button now opens one resident-detail modal only.</p>
          </div>
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Calendar size={14}/> Scheduling Review</p>
            <p>If an exact appointment date is not available, save the request as Pending Scheduling Review. The coordinator can later complete the date, time, pickup, and transport details.</p>
          </div>
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><BarChart3 size={14}/> Reporting</p>
            <p>Use filters for date, unit, status, specialty, or transportation company, then export CSV or PDF for QAPI, leadership review, or survey preparation.</p>
          </div>
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><FileText size={14}/> PDF Outputs</p>
            <p>Checklist, consult, medical clearance, calendar, transport, and summary PDFs use saved appointment and resident details for cleaner operational packets.</p>
          </div>
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Database size={14}/> Database Alignment</p>
            <p>Admins should keep migrations current so facilities, user access, transportation directory, resident facility links, and appointment fields match the current app.</p>
          </div>
        </div>
      </Card>

      {isAdmin ? (
        <>
          <Card
            icon={<Home size={22} />}
            title="Facility Management"
            subtitle="Configure facility profile, active facility selection, and facility records."
            action={
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingFac(null);
                  setIsFacModalOpen(true);
                }}
              >
                New Facility
              </Button>
            }
          >
            <div className="space-y-3">
              {facilities.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                  No facilities found. Use New Facility to add the first facility.
                </div>
              )}

              {facilities.map((facility) => (
                <div key={facility.id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-slate-800">{facility.name}</p>
                    {facility.id === currentFacilityId && (
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Current Facility</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setCurrentFacilityId(facility.id)}>Set</Button>
                    <Button variant="secondary" onClick={() => { setEditingFac(facility); setIsFacModalOpen(true); }}>Edit</Button>
                    <Button variant="danger" onClick={() => deleteFacility(facility.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            icon={<User size={22} />}
            title="User Access Management"
            subtitle="Add users, edit user details, and manage user access workflow."
            action={
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingUser(null);
                  setIsUserModalOpen(true);
                }}
              >
                New User
              </Button>
            }
          >
            <div className="space-y-2">
              {users.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                  No users loaded. Use New User to add a user, or refresh after confirming admin access.
                </div>
              )}

              {users.map((u: any) => (
                <div key={u.id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-slate-800">{u.fullName || u.name || u.email}</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{u.role || "Staff"}</p>
                  </div>
                  <Button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}>Edit</Button>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card
          icon={<User size={22} />}
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
