import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, Check, Pencil, Plus, Save, ShieldCheck, Trash2, UserCog, Users, X } from "lucide-react";

import App from "./App";
import { UserManagementAdminPage } from "./pages/UserManagementAdminPage";

type FacilityRecord = {
  id: string;
  name: string;
  shortName?: string;
  code?: string;
  address?: string;
  phone?: string;
  administrator?: string;
  don?: string;
  status?: string;
};

type FacilityForm = Omit<FacilityRecord, "id"> & { id?: string };

function normalizeFacilities(payload: unknown): FacilityRecord[] {
  const list = Array.isArray(payload) ? payload : (payload as any)?.facilities;
  if (!Array.isArray(list)) return [];
  return list
    .map((facility: any) => ({
      id: String(facility?.id || ""),
      name: String(facility?.name || facility?.shortName || facility?.code || "Unnamed Facility"),
      shortName: facility?.short_name || facility?.shortName || "",
      code: facility?.code || "",
      address: facility?.address || "",
      phone: facility?.phone || "",
      administrator: facility?.administrator || "",
      don: facility?.don || "",
      status: facility?.status || "active",
    }))
    .filter((facility) => facility.id && facility.status !== "inactive");
}

function readFacilityFallback() {
  try {
    return String(localStorage.getItem("currentFacilityId") || localStorage.getItem("facilityId") || "facility-main");
  } catch {
    return "facility-main";
  }
}

function readNavigatorSessionFacilityId() {
  try {
    const raw = localStorage.getItem("ltcFormsHub.authSession.v1");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return String(parsed?.currentFacilityId || "");
  } catch {
    return "";
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
  const fallbackFacilityId = useMemo(() => readNavigatorSessionFacilityId() || readFacilityFallback(), []);
  const [view, setView] = useState<AdminView>(initialView);
  const [facilities, setFacilities] = useState<FacilityRecord[]>([{ id: fallbackFacilityId, name: "Current Facility", status: "active" }]);
  const [activeFacilityId, setActiveFacilityId] = useState(fallbackFacilityId);
  const [facilitySource, setFacilitySource] = useState("Fallback session facility");
  const [facilityEditor, setFacilityEditor] = useState<FacilityForm | null>(null);
  const [facilityNotice, setFacilityNotice] = useState<string | null>(null);

  const loadFacilities = () => {
    let active = true;
    fetch("/api/facilities")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Facilities endpoint unavailable"))))
      .then((payload) => {
        if (!active) return;
        const loaded = normalizeFacilities(payload);
        if (loaded.length) {
          setFacilities(loaded);
          const preferred = loaded.find((facility) => facility.id === activeFacilityId || facility.id === fallbackFacilityId)?.id || loaded[0].id;
          setActiveFacilityId(preferred);
          setFacilitySource("Navigator Forms facility registry /api/facilities");
        }
      })
      .catch(() => {
        setFacilitySource("Fallback session facility; /api/facilities not available");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => loadFacilities(), [fallbackFacilityId]);

  const openView = (nextView: AdminView) => {
    setView(nextView);
    window.location.hash = nextView === "user-management" ? "admin/user-management" : "admin";
  };

  const closeAdmin = () => {
    window.location.hash = "";
    onClose();
  };

  const openNewFacility = () => {
    setFacilityNotice(null);
    setFacilityEditor({ name: "", shortName: "", code: "", address: "", phone: "", administrator: "", don: "", status: "active" });
  };

  const openEditFacility = (facility: FacilityRecord) => {
    setFacilityNotice(null);
    setFacilityEditor({ ...facility });
  };

  const saveFacility = async () => {
    if (!facilityEditor?.name?.trim()) {
      setFacilityNotice("Facility name is required.");
      return;
    }
    const isNew = !facilityEditor.id;
    const payload = {
      ...facilityEditor,
      id: facilityEditor.id || `facility-${Date.now()}`,
      name: facilityEditor.name.trim(),
      status: facilityEditor.status || "active",
    };
    try {
      const response = await fetch(isNew ? "/api/facilities" : "/api/facilities/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Facility endpoint unavailable");
      setFacilityEditor(null);
      setFacilityNotice("Facility configuration saved.");
      loadFacilities();
    } catch {
      setFacilities((prev) => {
        const next = isNew ? [...prev, payload as FacilityRecord] : prev.map((facility) => facility.id === payload.id ? payload as FacilityRecord : facility);
        return next.filter((facility) => facility.status !== "inactive");
      });
      setActiveFacilityId(payload.id);
      setFacilityEditor(null);
      setFacilityNotice("Facility saved locally in this admin session. Connect /api/facilities to persist permanently.");
    }
  };

  const deactivateFacility = async (facility: FacilityRecord) => {
    const updated = { ...facility, status: "inactive" };
    try {
      await fetch("/api/facilities/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {
      // Keep local session fallback if endpoint is unavailable.
    }
    setFacilities((prev) => prev.filter((item) => item.id !== facility.id));
    if (activeFacilityId === facility.id) {
      const nextFacility = facilities.find((item) => item.id !== facility.id);
      if (nextFacility) setActiveFacilityId(nextFacility.id);
    }
    setFacilityNotice("Facility removed from active admin list. Endpoint persistence depends on /api/facilities/update.");
  };

  return (
    <div className="min-h-screen bg-soft-bg px-4 py-5 md:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="transport-gradient rounded-2xl p-5 md:p-6 text-white shadow-[0_10px_30px_rgba(11,42,111,.12)] mb-5 relative overflow-hidden">
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute right-24 -bottom-20 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-black mb-3">
                <ShieldCheck size={15} className="mr-1" /> Admin Console
              </span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                {view === "user-management" ? "User Management" : "Administration"}
              </h1>
              <p className="text-sm opacity-90 mt-1 max-w-3xl leading-relaxed">
                {view === "user-management"
                  ? "Manage users, staff links, facility scope, roles, password reset, deactivation, and appointment workflow access."
                  : "Central admin page for Med-Appointment setup, facility configuration, users, roles, access matrix, and audit controls."}
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
        </header>

        <div className="mb-6 transport-card p-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button type="button" onClick={() => openView("home")} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${view === "home" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100"}`}>Admin Home</button>
            <button type="button" onClick={() => openView("user-management")} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${view === "user-management" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100"}`}>User Management</button>
          </div>
        </div>

        {view === "home" ? (
          <AdminHome
            onOpenUserManagement={() => openView("user-management")}
            facilities={facilities}
            activeFacilityId={activeFacilityId}
            setActiveFacilityId={setActiveFacilityId}
            facilitySource={facilitySource}
            facilityNotice={facilityNotice}
            onNewFacility={openNewFacility}
            onEditFacility={openEditFacility}
            onDeactivateFacility={deactivateFacility}
          />
        ) : (
          <UserManagementAdminPage
            currentUser={{ fullName: "Administrator", username: "admin", roleIds: ["role-facility-admin"], assignedFacilityIds: facilities.map((facility) => facility.id), defaultFacilityId: activeFacilityId }}
            facilities={facilities.map((facility) => ({ id: facility.id, name: facility.name }))}
            currentFacilityId={activeFacilityId}
            facilityCount={facilities.length}
          />
        )}
      </div>

      {facilityEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">{facilityEditor.id ? "Edit Facility Configuration" : "New Facility Configuration"}</h3>
              <button type="button" onClick={() => setFacilityEditor(null)} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X size={18} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <FacilityField label="Facility Name" value={facilityEditor.name || ""} onChange={(value) => setFacilityEditor({ ...facilityEditor, name: value })} />
              <FacilityField label="Short Name" value={facilityEditor.shortName || ""} onChange={(value) => setFacilityEditor({ ...facilityEditor, shortName: value })} />
              <FacilityField label="Facility Code" value={facilityEditor.code || ""} onChange={(value) => setFacilityEditor({ ...facilityEditor, code: value })} />
              <FacilityField label="Phone" value={facilityEditor.phone || ""} onChange={(value) => setFacilityEditor({ ...facilityEditor, phone: value })} />
              <FacilityField label="Administrator" value={facilityEditor.administrator || ""} onChange={(value) => setFacilityEditor({ ...facilityEditor, administrator: value })} />
              <FacilityField label="DON" value={facilityEditor.don || ""} onChange={(value) => setFacilityEditor({ ...facilityEditor, don: value })} />
              <label className="md:col-span-2 text-xs font-black text-slate-700">Address
                <textarea value={facilityEditor.address || ""} onChange={(event) => setFacilityEditor({ ...facilityEditor, address: event.target.value })} className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold outline-none focus:border-sky-500" />
              </label>
            </div>
            {facilityNotice && <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">{facilityNotice}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setFacilityEditor(null)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Cancel</button>
              <button type="button" onClick={saveFacility} className="inline-flex items-center gap-2 rounded-full bg-[#0b2a6f] px-4 py-2 text-xs font-black text-white"><Save size={14} /> Save Facility</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminHome({
  onOpenUserManagement,
  facilities,
  activeFacilityId,
  setActiveFacilityId,
  facilitySource,
  facilityNotice,
  onNewFacility,
  onEditFacility,
  onDeactivateFacility,
}: {
  onOpenUserManagement: () => void;
  facilities: FacilityRecord[];
  activeFacilityId: string;
  setActiveFacilityId: (facilityId: string) => void;
  facilitySource: string;
  facilityNotice: string | null;
  onNewFacility: () => void;
  onEditFacility: (facility: FacilityRecord) => void;
  onDeactivateFacility: (facility: FacilityRecord) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="transport-card p-5">
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

      <section className="transport-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Building2 size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Facility Configuration</h2>
              <p className="text-sm font-semibold text-slate-600">Configure facility profiles and active admin access scope.</p>
            </div>
          </div>
          <button type="button" onClick={onNewFacility} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b2a6f] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow">
            <Plus size={14} /> New Facility
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-xs font-semibold text-slate-600">
          <p><span className="font-black text-slate-900">Source:</span> {facilitySource}</p>
          <p className="mt-1"><span className="font-black text-slate-900">Loaded facilities:</span> {facilities.length}</p>
          {facilityNotice && <p className="mt-2 rounded-xl bg-amber-50 p-2 text-amber-800">{facilityNotice}</p>}
        </div>
        <div className="mt-4 space-y-2">
          {facilities.map((facility) => (
            <div key={facility.id} className={`rounded-2xl border p-3 text-xs font-semibold ${facility.id === activeFacilityId ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-100 bg-slate-50 text-slate-700"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black">{facility.name}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider opacity-70">{facility.id}{facility.id === activeFacilityId ? " • Active" : ""}</p>
                  {(facility.address || facility.phone) && <p className="mt-1 text-[11px] opacity-80">{facility.address}{facility.address && facility.phone ? " • " : ""}{facility.phone}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setActiveFacilityId(facility.id)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 ring-1 ring-slate-200"><Check size={12} /> Set</button>
                  <button type="button" onClick={() => onEditFacility(facility)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 ring-1 ring-slate-200"><Pencil size={12} /> Edit</button>
                  <button type="button" onClick={() => onDeactivateFacility(facility)} className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 ring-1 ring-rose-100"><Trash2 size={12} /> Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FacilityField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs font-black text-slate-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold outline-none focus:border-sky-500" /></label>;
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
