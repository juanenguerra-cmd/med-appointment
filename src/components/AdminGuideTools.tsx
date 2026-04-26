import React from "react";
import { Home, Plus, Trash2, User } from "lucide-react";
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

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
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
          {facilities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">
              No facilities found. Use New Facility to add one.
            </div>
          ) : (
            facilities.map((facility) => (
              <div
                key={facility.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <Home size={18} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{facility.name}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {[facility.address, facility.phone].filter(Boolean).join(" • ") || "No facility details listed"}
                    </p>
                    {facility.id === currentFacilityId && (
                      <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">
                        Current Facility
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setCurrentFacilityId(facility.id)}>
                    Set Active
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingFac(facility);
                      setIsFacModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    icon={<Trash2 size={15} />}
                    onClick={() => {
                      const ok = window.confirm(
                        `Delete facility ${facility.name}? This does not delete existing appointment records from the database.`
                      );
                      if (ok) deleteFacility(facility.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card
        icon={<User size={22} />}
        title="User Access Logic"
        subtitle="Manage facility visibility for staff members."
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
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">
              No users found.
            </div>
          ) : (
            users.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{u.name || u.fullName || u.email}</p>
                    <p className="text-xs font-semibold text-slate-500">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                    {u.role}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingUser(u);
                    setIsUserModalOpen(true);
                  }}
                >
                  Access Logic
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
