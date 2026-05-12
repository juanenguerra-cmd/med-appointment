import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarClock, DatabaseBackup, RefreshCw, RotateCcw, Users } from "lucide-react";
import { apiFetch } from "../api/apiClient";
import type { Appointment, Resident, User } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";

type AuditLog = {
  id: string;
  facilityId?: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  summary?: string;
  createdAt?: string;
};

type AdminRecoveryPanelProps = {
  currentFacilityId: string | null;
  currentUser?: Pick<User, "id" | "fullName" | "role"> | null;
};

const fmtDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const activeName = (resident: Partial<Resident>) => resident.name || [resident.lastName, resident.firstName].filter(Boolean).join(", ") || "Unnamed resident";

export function AdminRecoveryPanel({ currentFacilityId, currentUser }: AdminRecoveryPanelProps) {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const canLoad = Boolean(currentFacilityId);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredResidents = useMemo(() => {
    if (!normalizedQuery) return residents;
    return residents.filter((resident) => [resident.name, resident.mrn, resident.unit, resident.roomNumber, resident.status].join(" ").toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, residents]);

  const filteredAppointments = useMemo(() => {
    if (!normalizedQuery) return appointments;
    return appointments.filter((appointment) => [appointment.residentName, appointment.type, appointment.providerName, appointment.date, appointment.status].join(" ").toLowerCase().includes(normalizedQuery));
  }, [appointments, normalizedQuery]);

  const filteredAuditLogs = useMemo(() => {
    if (!normalizedQuery) return auditLogs;
    return auditLogs.filter((log) => [log.action, log.entity, log.summary, log.createdAt].join(" ").toLowerCase().includes(normalizedQuery));
  }, [auditLogs, normalizedQuery]);

  const loadRecoveryData = async () => {
    if (!currentFacilityId) return;
    setLoading(true);
    setMessage("");
    try {
      const [deletedResidents, deletedAppointments, logs] = await Promise.all([
        apiFetch<Resident[]>(`/api/deleted/residents?facilityId=${encodeURIComponent(currentFacilityId)}`),
        apiFetch<Appointment[]>(`/api/deleted/appointments?facilityId=${encodeURIComponent(currentFacilityId)}`),
        apiFetch<AuditLog[]>(`/api/audit-logs?facilityId=${encodeURIComponent(currentFacilityId)}&limit=75`),
      ]);
      setResidents(Array.isArray(deletedResidents) ? deletedResidents : []);
      setAppointments(Array.isArray(deletedAppointments) ? deletedAppointments : []);
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error || "Unknown error");
      setMessage(`Unable to load recovery data. ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecoveryData().catch(() => undefined);
  }, [currentFacilityId]);

  const restoreResident = async (resident: Resident) => {
    setLoading(true);
    setMessage("");
    try {
      await apiFetch(`/api/restore/residents/${encodeURIComponent(resident.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser?.id || "", note: "Restored from Admin Recovery panel" }),
      });
      setMessage(`Resident restored: ${activeName(resident)}`);
      await loadRecoveryData();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error || "Unknown error");
      setMessage(`Resident restore failed. ${detail}`);
      setLoading(false);
    }
  };

  const restoreAppointment = async (appointment: Appointment) => {
    setLoading(true);
    setMessage("");
    try {
      await apiFetch(`/api/restore/appointments/${encodeURIComponent(appointment.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser?.id || "", note: "Restored from Admin Recovery panel" }),
      });
      setMessage(`Appointment restored for ${appointment.residentName || "resident"}`);
      await loadRecoveryData();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error || "Unknown error");
      setMessage(`Appointment restore failed. ${detail}`);
      setLoading(false);
    }
  };

  return (
    <Card
      title="Admin Recovery & Audit"
      subtitle="Review discharged residents, soft-deleted appointments, and recent audit activity for the selected facility."
      actions={
        <Button variant="secondary" onClick={loadRecoveryData} disabled={!canLoad || loading}>
          <RefreshCw size={16} /> Refresh
        </Button>
      }
    >
      {!currentFacilityId ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          Select a facility before loading recovery records.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400"><Users size={14}/> Discharged Residents</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{residents.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400"><CalendarClock size={14}/> Deleted Appointments</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{appointments.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400"><Activity size={14}/> Audit Entries</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{auditLogs.length}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search recovery records..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
            {loading && <p className="text-[10px] font-black uppercase tracking-wider text-sky-700">Loading...</p>}
          </div>

          {message && <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs font-bold text-sky-800">{message}</div>}

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900"><Users size={16}/> Discharged / Inactive Residents</h3>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredResidents.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500">No discharged residents found for this search.</p>}
                {filteredResidents.map((resident) => (
                  <div key={resident.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-slate-900">{activeName(resident)}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">MRN: {resident.mrn || "—"} · {resident.unit || "—"} / {resident.roomNumber || "—"}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-amber-700">Discharged: {fmtDate(resident.dischargedAt)}</p>
                      </div>
                      <Button variant="secondary" onClick={() => restoreResident(resident)} disabled={loading}>
                        <RotateCcw size={15} /> Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900"><CalendarClock size={16}/> Soft-Deleted Appointments</h3>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredAppointments.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500">No deleted appointments found for this search.</p>}
                {filteredAppointments.map((appointment: Appointment & { deletedAt?: string; previousStatus?: string }) => (
                  <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-slate-900">{appointment.residentName || "Unnamed resident"}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{appointment.type || "Specialty not listed"} · {appointment.date || "No date"} {appointment.time || ""}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-amber-700">Deleted: {fmtDate(appointment.deletedAt)}</p>
                      </div>
                      <Button variant="secondary" onClick={() => restoreAppointment(appointment)} disabled={loading}>
                        <DatabaseBackup size={15} /> Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900"><Activity size={16}/> Recent Audit Log</h3>
            <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-slate-200 bg-white">
              {filteredAuditLogs.length === 0 ? (
                <p className="p-4 text-xs font-semibold text-slate-500">No audit logs found for this search.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-black">Date</th>
                      <th className="px-3 py-2 font-black">Action</th>
                      <th className="px-3 py-2 font-black">Entity</th>
                      <th className="px-3 py-2 font-black">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-3 py-2 font-semibold text-slate-500">{fmtDate(log.createdAt)}</td>
                        <td className="px-3 py-2 font-black text-slate-700">{log.action}</td>
                        <td className="px-3 py-2 font-semibold text-slate-600">{log.entity}</td>
                        <td className="px-3 py-2 font-semibold text-slate-600">{log.summary || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </Card>
  );
}
