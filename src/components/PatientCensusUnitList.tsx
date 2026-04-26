import React, { useMemo, useState } from "react";
import { ChevronRight, Eye, Trash2, Users } from "lucide-react";
import { Resident } from "../types";
import { Button } from "./Button";

interface PatientCensusUnitListProps {
  residents: Resident[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onViewDetails: (resident: Resident) => void;
  onDeleteResident?: (id: string) => void;
}

const normalize = (value: unknown) => String(value ?? "").trim();

const unitLabel = (resident: Resident) => {
  const unit = normalize(resident.unit);
  if (unit && unit !== "—") return unit;

  const floor = normalize(resident.floor);
  if (floor && floor !== "—") return floor;

  return "Unassigned Unit";
};

export function PatientCensusUnitList({
  residents,
  searchQuery,
  onSearchChange,
  onViewDetails,
  onDeleteResident,
}: PatientCensusUnitListProps) {
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});

  const filteredResidents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return residents;

    return residents.filter((resident) => {
      const haystack = [
        resident.name,
        resident.mrn,
        resident.roomNumber,
        resident.unit,
        resident.floor,
        resident.doctor,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [residents, searchQuery]);

  const groupedResidents = useMemo(() => {
    const map = new Map<string, Resident[]>();

    filteredResidents.forEach((resident) => {
      const key = unitLabel(resident);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(resident);
    });

    return Array.from(map.entries())
      .map(([unit, list]) => [
        unit,
        list.sort((a, b) => {
          const roomCompare = String(a.roomNumber || "").localeCompare(
            String(b.roomNumber || ""),
            undefined,
            { numeric: true },
          );
          if (roomCompare !== 0) return roomCompare;
          return String(a.name || "").localeCompare(String(b.name || ""));
        }),
      ] as const)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [filteredResidents]);

  const isUnitOpen = (unit: string) => {
    if (searchQuery.trim()) return true;
    if (openUnits[unit] === undefined) return groupedResidents.length <= 2;
    return openUnits[unit];
  };

  const toggleUnit = (unit: string) => {
    setOpenUnits((prev) => ({ ...prev, [unit]: !isUnitOpen(unit) }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    groupedResidents.forEach(([unit]) => {
      next[unit] = true;
    });
    setOpenUnits(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    groupedResidents.forEach(([unit]) => {
      next[unit] = false;
    });
    setOpenUnits(next);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Active Patient Census</h3>
            <p className="text-xs font-semibold text-slate-500">
              Collapsible by unit. Quick actions remain visible for each resident.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search resident, MRN, room, unit, or physician..."
            className="min-w-[260px] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-200"
            >
              Expand
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-200"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {groupedResidents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
            No active residents found.
          </div>
        )}

        {groupedResidents.map(([unit, list]) => {
          const open = isUnitOpen(unit);
          return (
            <div key={unit} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => toggleUnit(unit)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-100"
              >
                <div className="flex items-center gap-3">
                  <ChevronRight
                    size={18}
                    className={`text-slate-500 transition-transform ${open ? "rotate-90" : ""}`}
                  />
                  <div>
                    <p className="text-sm font-black text-slate-800">{unit}</p>
                    <p className="text-[11px] font-bold text-slate-500">
                      {list.length} resident{list.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                  {open ? "Hide" : "Show"}
                </span>
              </button>

              {open && (
                <div className="divide-y divide-slate-100 bg-white">
                  {list.map((resident) => (
                    <div
                      key={resident.id}
                      className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">{resident.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1">Room {resident.roomNumber || "—"}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">MRN {resident.mrn || "—"}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">{resident.doctor || "No physician listed"}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="inline-flex items-center gap-2 rounded-full text-xs font-black"
                          onClick={() => onViewDetails(resident)}
                        >
                          <Eye size={14} />
                          View Details
                        </Button>
                        {onDeleteResident && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="inline-flex items-center gap-2 rounded-full text-xs font-black"
                            onClick={() => {
                              const ok = window.confirm(`Delete ${resident.name} from the active census?`);
                              if (ok) onDeleteResident(resident.id);
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
