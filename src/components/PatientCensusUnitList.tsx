import React, { useEffect, useMemo, useState } from "react";
import { Search, Eye, Users, UserCheck, UserX, X, Printer } from "lucide-react";
import type { Appointment, Resident } from "../types";
import { Button } from "./Button";
import { getResidentStatusGroup, ResidentStatusFilter } from "../utils/residentStatus";

type PatientCensusUnitListProps = {
  residents: Resident[];
  appointments?: Appointment[];
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

const formatDate = (value: unknown) => {
  const text = safeText(value).trim();
  if (!text) return "—";
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return text;
  const [, y, m, d] = match;
  return `${m}/${d}/${y}`;
};

const formatTime = (value: unknown) => {
  const text = safeText(value).trim();
  if (!text) return "—";
  const [rawHour, rawMinute = "00"] = text.split(":");
  const hour = Number(rawHour);
  if (Number.isNaN(hour)) return text;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${rawMinute.padStart(2, "0")} ${suffix}`;
};

const escapeHtml = (value: unknown) =>
  safeText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function normalizeNameForMatch(value: unknown) {
  return safeLower(value)
    .replace(/[^a-z0-9\s,]/g, " ")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getResidentAppointments(resident: Resident, appointments: Appointment[]) {
  const residentId = safeText(resident.id).trim();
  const residentMrn = safeLower(resident.mrn);
  const residentName = normalizeNameForMatch(resident.name);
  const firstName = normalizeNameForMatch(resident.firstName);
  const lastName = normalizeNameForMatch(resident.lastName);
  const residentRoom = safeLower(resident.roomNumber);

  return appointments
    .filter((appointment) => {
      const appointmentResidentId = safeText((appointment as any).residentId).trim();
      const appointmentResidentMrn = safeLower((appointment as any).residentMrn);
      const apptResident = normalizeNameForMatch(appointment.residentName);
      const apptRoom = safeLower(appointment.roomNumber);
      const apptNotes = safeLower(appointment.notes);

      if (residentId && appointmentResidentId && appointmentResidentId === residentId) return true;
      if (residentMrn && residentMrn !== "—" && appointmentResidentMrn && appointmentResidentMrn === residentMrn) return true;
      if (residentMrn && residentMrn !== "—" && apptNotes.includes(residentMrn)) return true;
      if (!apptResident) return false;
      if (apptResident === residentName) return true;
      if (residentName && (apptResident.includes(residentName) || residentName.includes(apptResident))) return true;
      if (firstName && lastName && apptResident.includes(firstName) && apptResident.includes(lastName)) return true;
      if (residentRoom && apptRoom && residentRoom === apptRoom && lastName && apptResident.includes(lastName)) return true;
      return false;
    })
    .sort((a, b) => `${safeText(b.date)} ${safeText(b.time)}`.localeCompare(`${safeText(a.date)} ${safeText(a.time)}`));
}

export function PatientCensusUnitList({
  residents,
  appointments = [],
  searchQuery,
  onSearchChange,
  onViewDetails,
  onDeleteResident,
}: PatientCensusUnitListProps) {
  const [statusFilter, setStatusFilter] = useState<ResidentStatusFilter>("Active");
  const [detailResident, setDetailResident] = useState<Resident | null>(null);
  const [fetchedAppointments, setFetchedAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const q = safeLower(searchQuery);
  const safeResidents = Array.isArray(residents) ? residents : [];
  const appointmentSource = appointments.length > 0 ? appointments : fetchedAppointments;

  useEffect(() => {
    if (!detailResident || appointments.length > 0) return;

    const facilityId = safeText((detailResident as any).facilityId) || safeText((safeResidents[0] as any)?.facilityId);
    if (!facilityId) return;

    let cancelled = false;
    setIsLoadingAppointments(true);

    fetch(`/api/appointments?facilityId=${encodeURIComponent(facilityId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setFetchedAppointments(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Failed to load resident appointment history", error);
        if (!cancelled) setFetchedAppointments([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAppointments(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detailResident, appointments.length, safeResidents]);

  const detailAppointments = detailResident ? getResidentAppointments(detailResident, appointmentSource) : [];
  const todayKey = new Date().toISOString().slice(0, 10);
  const historicalAppointments = detailAppointments.filter((appointment) => safeText(appointment.date) && safeText(appointment.date) < todayKey);
  const futureAppointments = detailAppointments.filter((appointment) => !safeText(appointment.date) || safeText(appointment.date) >= todayKey);

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

  const groupedByUnit = filteredResidents.reduce<Record<string, Resident[]>>((groups, resident) => {
    const unitKey = safeText(resident?.unit).trim() || safeText(resident?.floor).trim() || "Unassigned";
    if (!groups[unitKey]) groups[unitKey] = [];
    groups[unitKey].push(resident);
    return groups;
  }, {});

  const sortedUnitNames = Object.keys(groupedByUnit).sort((a, b) => safeLower(a).localeCompare(safeLower(b)));

  const filterButtonClass = (filter: ResidentStatusFilter) =>
    `inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black transition-colors ${statusFilter === filter ? "bg-[#0b2a6f] text-white shadow-sm" : "border border-[#d6deeb] bg-white text-slate-600 hover:bg-slate-50"}`;

  const handleViewResident = (resident: Resident) => {
    setDetailResident(resident);
    onViewDetails(resident);
  };

  const printResidentSummary = (mode: "all" | "history" | "future") => {
    if (!detailResident) return;
    const source = mode === "history" ? historicalAppointments : mode === "future" ? futureAppointments : detailAppointments;
    const title = mode === "history" ? "Historical Appointment Summary" : mode === "future" ? "Future Appointment Summary" : "All Appointment Summary";
    const rows = source
      .map(
        (appointment) => `<tr><td>${escapeHtml(formatDate(appointment.date))}</td><td>${escapeHtml(formatTime(appointment.time))}</td><td>${escapeHtml(appointment.type || "—")}</td><td>${escapeHtml(appointment.providerName || "—")}</td><td>${escapeHtml(appointment.location || "—")}</td><td>${escapeHtml(appointment.status || "—")}</td></tr>`,
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>@page{size:letter landscape;margin:.35in}body{font-family:Arial,Helvetica,sans-serif;color:#111827}.header{border-bottom:3px solid #0b2a6f;padding-bottom:10px;margin-bottom:12px;display:flex;justify-content:space-between;gap:24px}h1{color:#0b2a6f;font-size:19px;margin:0 0 4px;text-transform:uppercase}.subtitle{color:#475569;font-size:11px;font-weight:800}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 16px;font-size:11px;margin:12px 0;padding:10px;background:#f8fbff;border:1px solid #d6deeb;border-radius:10px}.meta strong{color:#0b2a6f}table{width:100%;border-collapse:collapse;font-size:10.5px}th,td{border:1px solid #cbd5e1;padding:6px 7px;text-align:left;vertical-align:top}th{background:#0b2a6f;color:#fff;font-size:9.5px;text-transform:uppercase}tbody tr:nth-child(even){background:#f8fafc}.footer{margin-top:16px;border-top:1px solid #cbd5e1;padding-top:6px;text-align:center;font-size:8px;color:#64748b;font-weight:800}</style></head><body><div class="header"><div><h1>Resident Appointment Summary Report</h1><div class="subtitle">${escapeHtml(title)}</div></div><div class="subtitle">Generated: ${escapeHtml(new Date().toLocaleString())}</div></div><div class="meta"><div><strong>Resident:</strong> ${escapeHtml(detailResident.name)}</div><div><strong>MRN:</strong> ${escapeHtml(detailResident.mrn || "—")}</div><div><strong>Room:</strong> ${escapeHtml(detailResident.roomNumber || "—")}</div><div><strong>Unit:</strong> ${escapeHtml(detailResident.unit || detailResident.floor || "—")}</div><div><strong>Primary Doctor:</strong> ${escapeHtml(detailResident.doctor || "—")}</div><div><strong>Total Records:</strong> ${source.length}</div></div><table><thead><tr><th>Date</th><th>Time</th><th>Specialty</th><th>Provider / Clinic</th><th>Location</th><th>Status</th></tr></thead><tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:#64748b;font-weight:700;">No appointments found.</td></tr>`}</tbody></table><div class="footer">CONFIDENTIAL MEDICAL RECORD / APPOINTMENT SUMMARY</div><script>window.onload=()=>window.print();</script></body></html>`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="transport-card overflow-hidden">
      <div className="p-5 border-b border-[#d6deeb] bg-white">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="font-black text-[#0b2a6f] text-lg flex items-center gap-2">
              <Users size={20} /> Patient Census Registry
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {statusCounts.active} active • {statusCounts.discharged} discharged • {statusCounts.all} total
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-2">
              <button type="button" className={filterButtonClass("Active")} onClick={() => setStatusFilter("Active")}> <UserCheck size={14} /> Active ({statusCounts.active})</button>
              <button type="button" className={filterButtonClass("Discharged")} onClick={() => setStatusFilter("Discharged")}> <UserX size={14} /> Discharged ({statusCounts.discharged})</button>
              <button type="button" className={filterButtonClass("All")} onClick={() => setStatusFilter("All")}> <Users size={14} /> All ({statusCounts.all})</button>
            </div>
            <div className="relative w-full lg:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={safeText(searchQuery)} onChange={(e) => onSearchChange(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#d6deeb] bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-2/20" placeholder="Search resident, MRN, unit, room..." />
            </div>
          </div>
        </div>
      </div>

      {filteredResidents.length === 0 ? (
        <div className="p-10 text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"><Users size={26} /></div>
          <p className="font-black text-slate-700">No residents found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search or switch the status filter.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#d6deeb]">
          {sortedUnitNames.map((unitName) => {
            const unitResidents = groupedByUnit[unitName].sort((a, b) => safeLower(a?.roomNumber).localeCompare(safeLower(b?.roomNumber), undefined, { numeric: true }));
            return (
              <section key={unitName}>
                <div className="sticky top-0 z-10 bg-[#f8fbff] border-b border-[#d6deeb] px-5 py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-[#0b2a6f] text-sm">{unitName}</h4>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{unitResidents.length} resident{unitResidents.length === 1 ? "" : "s"}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white text-[10px] uppercase tracking-wider text-slate-400 font-black">
                      <tr><th className="px-5 py-3 border-b border-[#eef2f7]">Resident</th><th className="px-5 py-3 border-b border-[#eef2f7]">Status</th><th className="px-5 py-3 border-b border-[#eef2f7]">MRN</th><th className="px-5 py-3 border-b border-[#eef2f7]">Room</th><th className="px-5 py-3 border-b border-[#eef2f7]">Physician</th><th className="px-5 py-3 border-b border-[#eef2f7] text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef2f7]">
                      {unitResidents.map((resident, index) => {
                        const rowKey = safeText(resident?.id) || `${safeText(resident?.name)}-${safeText(resident?.roomNumber)}-${index}`;
                        const status = getResidentStatusGroup(resident);
                        return (
                          <tr key={rowKey} className="bg-white hover:bg-brand-light/20 transition-colors">
                            <td className="px-5 py-4"><p className="font-black text-slate-800 text-sm">{safeText(resident?.name) || "—"}</p><p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{safeText(resident?.sex) || "—"}{resident?.age ? ` • Age ${safeText(resident.age)}` : ""}</p></td>
                            <td className="px-5 py-4"><span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${statusPillClass(status)}`}>{status}</span></td>
                            <td className="px-5 py-4 text-xs font-mono text-slate-500">{safeText(resident?.mrn) || "—"}</td>
                            <td className="px-5 py-4"><span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{safeText(resident?.roomNumber) || "—"}</span></td>
                            <td className="px-5 py-4 text-xs text-slate-500 italic">{safeText(resident?.doctor) || "—"}</td>
                            <td className="px-5 py-4 relative z-20 pointer-events-auto">
                              <div className="flex items-center justify-end gap-2 pointer-events-auto">
                                <Button type="button" size="sm" variant="secondary" className="gap-1 pointer-events-auto" onClick={(event) => { event.preventDefault(); event.stopPropagation(); handleViewResident(resident); }}><Eye size={14} /> View</Button>
                                {onDeleteResident && safeText(resident?.id) && status === "Active" && <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); const confirmed = window.confirm(`Mark ${safeText(resident?.name) || "this resident"} inactive/discharged?`); if (!confirmed) return; onDeleteResident(safeText(resident.id)); }} className="h-8 px-3 inline-flex items-center justify-center rounded-lg text-xs font-black text-amber-700 hover:bg-amber-50 transition-colors pointer-events-auto" aria-label="Mark resident inactive">Mark inactive</button>}
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

      {detailResident && <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"><div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-[#d6deeb] overflow-hidden max-h-[90vh] flex flex-col"><div className="transport-gradient text-white p-5 flex items-start justify-between gap-4 shrink-0"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Resident Details</p><h3 className="text-xl font-black mt-1">{safeText(detailResident.name) || "Resident"}</h3><p className="text-xs opacity-85 mt-1">Room {safeText(detailResident.roomNumber) || "—"} • {safeText(detailResident.unit || detailResident.floor) || "Unassigned"}</p></div><button type="button" onClick={() => setDetailResident(null)} className="p-2 rounded-full hover:bg-white/15 transition-colors" aria-label="Close resident details"><X size={20} /></button></div><div className="p-6 overflow-y-auto page-scrollbar space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm"><DetailItem label="Status" value={getResidentStatusGroup(detailResident)} /><DetailItem label="MRN" value={safeText(detailResident.mrn) || "—"} /><DetailItem label="Sex / Age" value={`${safeText(detailResident.sex) || "—"}${detailResident.age ? ` • Age ${safeText(detailResident.age)}` : ""}`} /><DetailItem label="Unit / Floor" value={safeText(detailResident.unit || detailResident.floor) || "—"} /><DetailItem label="Room" value={safeText(detailResident.roomNumber) || "—"} /><DetailItem label="Physician" value={safeText(detailResident.doctor) || "—"} /><DetailItem label="Admission Date" value={safeText(detailResident.admissionDate) || "—"} /><DetailItem label="Allergies" value={safeText(detailResident.allergies) || "—"} /><DetailItem label="Diagnosis" value={safeText(detailResident.diagnosis) || "—"} /></div><div className="rounded-3xl border border-[#d6deeb] overflow-hidden"><div className="bg-[#f8fbff] border-b border-[#d6deeb] p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h4 className="font-black text-[#0b2a6f]">Appointment History</h4><p className="text-xs text-slate-500 mt-1">{isLoadingAppointments ? "Loading appointment history..." : `${detailAppointments.length} total • ${historicalAppointments.length} historical • ${futureAppointments.length} future/unscheduled`}</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="secondary" className="gap-1" onClick={() => printResidentSummary("all")}><Printer size={14} /> Print All</Button><Button type="button" size="sm" variant="secondary" className="gap-1" onClick={() => printResidentSummary("history")}><Printer size={14} /> Historical</Button><Button type="button" size="sm" variant="secondary" className="gap-1" onClick={() => printResidentSummary("future")}><Printer size={14} /> Future</Button></div></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-white text-[10px] uppercase tracking-wider text-slate-400 font-black"><tr><th className="px-4 py-3 border-b">Date</th><th className="px-4 py-3 border-b">Time</th><th className="px-4 py-3 border-b">Specialty</th><th className="px-4 py-3 border-b">Provider</th><th className="px-4 py-3 border-b">Location</th><th className="px-4 py-3 border-b">Status</th></tr></thead><tbody className="divide-y divide-[#eef2f7]">{detailAppointments.length > 0 ? detailAppointments.map((appointment) => <tr key={appointment.id} className="hover:bg-brand-light/20"><td className="px-4 py-3 font-bold text-slate-700">{formatDate(appointment.date)}</td><td className="px-4 py-3 text-slate-500">{formatTime(appointment.time)}</td><td className="px-4 py-3 font-bold text-slate-700">{safeText(appointment.type) || "—"}</td><td className="px-4 py-3 text-slate-500">{safeText(appointment.providerName) || "—"}</td><td className="px-4 py-3 text-slate-500">{safeText(appointment.location) || "—"}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 font-black text-slate-600">{safeText(appointment.status) || "—"}</span></td></tr>) : <tr><td colSpan={6} className="px-4 py-6 text-center font-bold text-slate-400">{isLoadingAppointments ? "Loading appointments..." : "No appointments found for this resident."}</td></tr>}</tbody></table></div></div></div><div className="p-5 bg-slate-50 border-t border-[#d6deeb] flex justify-end shrink-0"><Button type="button" variant="secondary" onClick={() => setDetailResident(null)}>Close</Button></div></div></div>}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#d6deeb] bg-[#f8fbff] p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-700 break-words">{value}</p></div>;
}
