import React, { useMemo, useState } from "react";
import { Search, Eye, Users, UserCheck, UserX } from "lucide-react";
import { Resident } from "../types";
import { Button } from "./Button";
import { getResidentStatusGroup, ResidentStatusFilter } from "../utils/residentStatus";

type PatientCensusUnitListProps = {
  residents: Resident[];
  searchQuery: unknown;
  onSearchChange: (value: string) => void;
  onViewDetails: (resident: Resident) => void;
  onDeleteResident?: (id: string) => void;
};

const safeText = (value: unknown) => String(value ?? "");
const safeLower = (value: unknown) => safeText(value).trim().toLowerCase();

const statusPillClass = (status: "Active" | "Discharged") =>
  status === "Discharged"
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

export function PatientCensusUnitList({
  residents,
  searchQuery,
  onSearchChange,
  onViewDetails,
  onDeleteResident,
}: PatientCensusUnitListProps) {
  const [statusFilter, setStatusFilter] = useState<ResidentStatusFilter>("Active");
  const q = safeLower(searchQuery);
  const safeResidents = Array.isArray(residents) ? residents : [];

  const statusCounts = useMemo(() => {
    const active = safeResidents.filter((resident) => getResidentStatusGroup(resident) === "Active").length;
    const discharged = safeResidents.filter((resident) => getResidentStatusGroup(resident) === "Discharged").length;
    return { active, discharged, all: safeResidents.length };
  }, [safeResidents]);

  const filteredResidents = safeResidents.filter((resident) => {
    const status = getResidentStatusGroup(resident);
    if (statusFilter !== "All" && status !== statusFilter) return false;
    if (!q) return true;

    return [
      resident?.name,
      resident?.firstName,
      resident?.lastName,
      resident?.mrn,
      resident?.roomNumber,
      resident?.unit,
      resident?.floor,
      resident?.doctor,
      resident?.diagnosis,
      resident?.sex,
      resident?.age,
      resident?.admissionDate,
      (resident as any)?.status,
    ]
      .map((value) => safeLower(value))
      .some((value) => value.includes(q));
  });

  const groupedByUnit = filteredResidents.reduce<Record<string, Resident[]>>(
    (groups, resident) => {
      const unitKey = safeText(resident?.unit).trim() || safeText(resident?.floor).trim() || "Unassigned";
      if (!groups[unitKey]) groups[unitKey] = [];
      groups[unitKey].push(resident);
      return groups;
    },
    {},
  );

  const sortedUnitNames = Object.keys(groupedByUnit).sort((a, b) => safeLower(a).localeCompare(safeLower(b)));

  const filterButtonClass = (filter: ResidentStatusFilter) =>
    `inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black transition-colors ${
      statusFilter === filter
        ? "bg-[#0b2a6f] text-white shadow-sm"
        : "border border-[#d6deeb] bg-white text-slate-600 hover:bg-slate-50"
    }`;

  return (
    <div className="transport-card overflow-hidden">
      <div className="p-5 border-b border-[#d6deeb] bg-white">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="font-black text-[#0b2a6f] text-lg flex items-center gap-2">
              <Users size={20} />
              Patient Census Registry
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {statusCounts.active} active • {statusCounts.discharged} discharged • {statusCounts.all} total
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-2">
              <button type="button" className={filterButtonClass("Active")} onClick={() => setStatusFilter("Active")}>
                <UserCheck size={14} /> Active ({statusCounts.active})
              </button>
              <button type="button" className={filterButtonClass("Discharged")} onClick={() => setStatusFilter("Discharged")}>
                <UserX size={14} /> Discharged ({statusCounts.discharged})
              </button>
              <button type="button" className={filterButtonClass("All")} onClick={() => setStatusFilter("All")}>
                <Users size={14} /> All ({statusCounts.all})
              </button>
            </div>

            <div className="relative w-full lg:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={safeText(searchQuery)}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#d6deeb] bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-2/20"
                placeholder="Search resident, MRN, unit, room..."
              />
            </div>
          </div>
        </div>
      </div>

      {filteredResidents.length === 0 ? (
        <div className="p-10 text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Users size={26} />
          </div>
          <p className="font-black text-slate-700">No residents found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search or switch the status filter.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#d6deeb]">
          {sortedUnitNames.map((unitName) => {
            const unitResidents = groupedByUnit[unitName].sort((a, b) =>
              safeLower(a?.roomNumber).localeCompare(safeLower(b?.roomNumber), undefined, { numeric: true }),
            );

            return (
              <section key={unitName}>
                <div className="sticky top-0 z-10 bg-[#f8fbff] border-b border-[#d6deeb] px-5 py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-[#0b2a6f] text-sm">{unitName}</h4>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      {unitResidents.length} resident{unitResidents.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white text-[10px] uppercase tracking-wider text-slate-400 font-black">
                      <tr>
                        <th className="px-5 py-3 border-b border-[#eef2f7]">Resident</th>
                        <th className="px-5 py-3 border-b border-[#eef2f7]">Status</th>
                        <th className="px-5 py-3 border-b border-[#eef2f7]">MRN</th>
                        <th className="px-5 py-3 border-b border-[#eef2f7]">Room</th>
                        <th className="px-5 py-3 border-b border-[#eef2f7]">Physician</th>
                        <th className="px-5 py-3 border-b border-[#eef2f7] text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#eef2f7]">
                      {unitResidents.map((resident, index) => {
                        const residentId = safeText(resident?.id) || `${safeText(resident?.name)}-${safeText(resident?.roomNumber)}-${index}`;
                        const status = getResidentStatusGroup(resident);

                        return (
                          <tr key={residentId} className="bg-white hover:bg-brand-light/20 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-black text-slate-800 text-sm">{safeText(resident?.name) || "—"}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                                {safeText(resident?.sex) || "—"}{resident?.age ? ` • Age ${safeText(resident.age)}` : ""}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${statusPillClass(status)}`}>
                                {status}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-xs font-mono text-slate-500">{safeText(resident?.mrn) || "—"}</td>

                            <td className="px-5 py-4">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                                {safeText(resident?.roomNumber) || "—"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-xs text-slate-500 italic">{safeText(resident?.doctor) || "—"}</td>

                            <td className="px-5 py-4 relative z-20 pointer-events-auto">
                              <div className="flex items-center justify-end gap-2 pointer-events-auto">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="gap-1 pointer-events-auto"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onViewDetails(resident);
                                  }}
                                >
                                  <Eye size={14} /> View
                                </Button>

                                {onDeleteResident && safeText(resident?.id) && status === "Active" && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      const confirmed = window.confirm(`Mark ${safeText(resident?.name) || "this resident"} inactive/discharged?`);
                                      if (!confirmed) return;
                                      onDeleteResident(safeText(resident.id));
                                    }}
                                    className="h-8 px-3 inline-flex items-center justify-center rounded-lg text-xs font-black text-amber-700 hover:bg-amber-50 transition-colors pointer-events-auto"
                                    aria-label="Mark resident inactive"
                                  >
                                    Mark inactive
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
