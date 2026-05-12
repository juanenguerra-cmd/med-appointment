import { useEffect, useMemo, useState } from "react";
import { CheckSquare, RefreshCw, Save, ShieldCheck, Square, UserCog } from "lucide-react";
import { ACCESS_MODULES, APP_ROLES, defaultAccessForRole, normalizeRoleKey } from "../access/accessMatrix";
import { apiFetch } from "../api/apiClient";
import type { Facility, User } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";

type UserAccessMatrixPanelProps = {
  users: any[];
  facilities: Facility[];
  currentFacilityId: string | null;
  currentUser?: Pick<User, "id" | "fullName" | "role"> | null;
};

const userName = (user: any) => String(user?.fullName || user?.name || user?.email || "Unnamed user");
const userRole = (user: any) => String(user?.role || "viewer");

export function UserAccessMatrixPanel({ users, facilities, currentFacilityId, currentUser }: UserAccessMatrixPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState(currentFacilityId || "");
  const [accessKeys, setAccessKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedUser = useMemo(() => users.find((user: any) => user.id === selectedUserId), [selectedUserId, users]);
  const selectedFacility = useMemo(() => facilities.find((facility) => facility.id === selectedFacilityId), [facilities, selectedFacilityId]);
  const accessSet = useMemo(() => new Set(accessKeys), [accessKeys]);

  useEffect(() => {
    if (!selectedFacilityId && currentFacilityId) setSelectedFacilityId(currentFacilityId);
  }, [currentFacilityId, selectedFacilityId]);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) setSelectedUserId(String(users[0].id || ""));
  }, [selectedUserId, users]);

  const loadAccess = async () => {
    if (!selectedUserId || !selectedFacilityId) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await apiFetch<{ success: boolean; accessKeys: string[] }>(`/api/user-access-matrix?userId=${encodeURIComponent(selectedUserId)}&facilityId=${encodeURIComponent(selectedFacilityId)}`);
      const loadedKeys = Array.isArray(result.accessKeys) ? result.accessKeys : [];
      setAccessKeys(loadedKeys.length > 0 ? loadedKeys : defaultAccessForRole(selectedUser?.role));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error || "Unknown error");
      setMessage(`Unable to load access matrix. ${detail}`);
      setAccessKeys(defaultAccessForRole(selectedUser?.role));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccess().catch(() => undefined);
  }, [selectedUserId, selectedFacilityId]);

  const setRolePreset = (role: string) => {
    setAccessKeys(defaultAccessForRole(role));
    setMessage(`Loaded ${APP_ROLES.find((item) => item.key === normalizeRoleKey(role))?.label || "role"} default access. Save to apply.`);
  };

  const toggleAccessKey = (key: string) => {
    setAccessKeys((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  };

  const setModuleAccess = (moduleKey: string, checked: boolean) => {
    const module = ACCESS_MODULES.find((item) => item.key === moduleKey);
    if (!module) return;
    const moduleKeys = module.subModules.map((subModule) => subModule.key);
    setAccessKeys((prev) => {
      const next = new Set(prev);
      moduleKeys.forEach((key) => checked ? next.add(key) : next.delete(key));
      return Array.from(next);
    });
  };

  const saveAccess = async () => {
    if (!selectedUserId || !selectedFacilityId) {
      setMessage("Select a user and facility before saving.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await apiFetch("/api/user-access-matrix", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          facilityId: selectedFacilityId,
          accessKeys,
          updatedBy: currentUser?.id || "",
        }),
      });
      setMessage(`Access matrix saved for ${userName(selectedUser)} at ${selectedFacility?.name || "selected facility"}.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error || "Unknown error");
      setMessage(`Access matrix was not saved. ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="User Access Matrix"
      subtitle="Check which modules and submodules each user can access for the selected facility. This phase stores access settings; enforcement can be activated after review."
      actions={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={loadAccess} disabled={loading || !selectedUserId || !selectedFacilityId}>
            <RefreshCw size={16} /> Reload
          </Button>
          <Button variant="primary" onClick={saveAccess} disabled={saving || !selectedUserId || !selectedFacilityId}>
            <Save size={16} /> Save Matrix
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1.2fr]">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">User</span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            >
              {users.length === 0 && <option value="">No users loaded</option>}
              {users.map((user: any) => <option key={user.id} value={user.id}>{userName(user)} — {userRole(user)}</option>)}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Facility Scope</span>
            <select
              value={selectedFacilityId}
              onChange={(event) => setSelectedFacilityId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            >
              {!selectedFacilityId && <option value="">Select facility</option>}
              {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
            </select>
          </label>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role Preset</span>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {APP_ROLES.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setRolePreset(role.key)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 transition hover:border-sky-200 hover:bg-sky-50"
                  title={role.description}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {message && <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs font-bold text-sky-800">{message}</div>}

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            <p><span className="font-black">Implementation note:</span> This saves the access matrix now. Route/button enforcement should be enabled in a separate phase after the default role matrix is approved.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[280px_1fr] border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <div className="border-r border-slate-200 px-4 py-3">Module / Submodule</div>
            <div className="px-4 py-3">Access</div>
          </div>

          <div className="divide-y divide-slate-100">
            {ACCESS_MODULES.map((module) => {
              const moduleKeys = module.subModules.map((subModule) => subModule.key);
              const checkedCount = moduleKeys.filter((key) => accessSet.has(key)).length;
              const allChecked = checkedCount === moduleKeys.length;
              return (
                <div key={module.key} className="grid grid-cols-[280px_1fr]">
                  <div className="border-r border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-slate-900">{module.label}</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">{module.description}</p>
                        <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{checkedCount} of {moduleKeys.length} selected</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModuleAccess(module.key, !allChecked)}
                        className="rounded-full p-1 text-sky-700 hover:bg-sky-100"
                        aria-label={`${allChecked ? "Clear" : "Select"} ${module.label}`}
                      >
                        {allChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {module.subModules.map((subModule) => {
                      const checked = accessSet.has(subModule.key);
                      return (
                        <label key={subModule.key} className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-sky-50/60">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAccessKey(subModule.key)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black text-slate-800">{subModule.label}</p>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">{subModule.actions.join(" / ")}</span>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{subModule.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
          <p className="flex items-center gap-2 font-black text-slate-700"><UserCog size={15} /> Suggested workflow</p>
          <p className="mt-1">Select a user, choose the facility scope, apply a role preset if needed, then manually check or uncheck submodules before saving.</p>
        </div>
      </div>
    </Card>
  );
}
