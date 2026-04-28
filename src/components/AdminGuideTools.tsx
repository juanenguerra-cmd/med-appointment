import React from "react";
import { Home, Plus, Trash2, User, FileText, Calendar, Printer, BarChart3 } from "lucide-react";
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
  const isAdmin = String(currentUserRole || "").trim().toLowerCase() === "admin";

  return (
    <div className="space-y-6">
      {/* USER GUIDE - VISIBLE TO ALL */}
      <Card
        icon={<FileText size={22} />}
        title="Guide & Help (V2 Features)"
        subtitle="Quick guide on using reporting, calendar, and resident summary tools."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-xs font-semibold text-slate-600">
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><BarChart3 size={14}/> Reporting</p>
            <p>Use filters (date, unit, status, specialty) then export CSV or PDF for QAPI and survey review.</p>
          </div>
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Calendar size={14}/> Calendar</p>
            <p>Week and Month views available. Use Print buttons for structured printable calendar layouts.</p>
          </div>
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><Printer size={14}/> Resident Summary</p>
            <p>Open a resident → print All, History, or Future appointment summary (clean clinical output).</p>
          </div>
          <div>
            <p className="font-black text-slate-800 mb-1 flex items-center gap-2"><FileText size={14}/> Reports</p>
            <p>PDF output is survey-ready with summary metrics and detailed appointment listings.</p>
          </div>
        </div>
      </Card>

      {/* ADMIN ONLY SECTION */}
      {isAdmin && (
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
              {facilities.map((facility) => (
                <div key={facility.id} className="flex justify-between p-3 border rounded-xl">
                  <span>{facility.name}</span>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setCurrentFacilityId(facility.id)}>Set</Button>
                    <Button variant="danger" onClick={() => deleteFacility(facility.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card icon={<User size={22} />} title="User Access Logic">
            <div className="space-y-2">
              {users.map((u: any) => (
                <div key={u.id} className="flex justify-between p-3 border rounded-xl">
                  <span>{u.name || u.email}</span>
                  <Button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}>Edit</Button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
