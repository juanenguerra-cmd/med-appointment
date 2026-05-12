import React from "react";
import { Database } from "lucide-react";
import type { Appointment } from "../../../types";

type Props = {
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  FormField: (props: { label: string; info?: string; children: React.ReactNode }) => React.ReactElement;
};

export function AppointmentClinicalDetailsSection({ newAppt, setNewAppt, FormField }: Props) {
  const inputClass = "w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30";
  const checkboxClass = "w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20";
  const labelClass = "flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer";

  return (
    <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
        <Database size={16} /> Patient & Consult Details
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Nursing Staff">
          <input
            type="text"
            value={newAppt.nurseCompleting || ""}
            onChange={(e) => setNewAppt({ ...newAppt, nurseCompleting: e.target.value })}
            className={inputClass}
            placeholder="Nurse completing form"
          />
        </FormField>

        <FormField label="Patient Weight">
          <input
            type="text"
            value={newAppt.weight || ""}
            onChange={(e) => setNewAppt({ ...newAppt, weight: e.target.value })}
            className={inputClass}
            placeholder="e.g., 150 lbs"
          />
        </FormField>

        <FormField label="Patient Height">
          <input
            type="text"
            value={newAppt.height || ""}
            onChange={(e) => setNewAppt({ ...newAppt, height: e.target.value })}
            className={inputClass}
            placeholder={`e.g., 5' 2"`}
          />
        </FormField>
      </div>

      <div className="mt-5 pt-5 border-t border-[#d6deeb] flex flex-wrap gap-x-6 gap-y-3">
        <label className={labelClass}>
          <input type="checkbox" checked={!!newAppt.ambulating} onChange={(e) => setNewAppt({ ...newAppt, ambulating: e.target.checked })} className={checkboxClass} /> Ambulating
        </label>
        <label className={labelClass}>
          <input type="checkbox" checked={!!newAppt.wheelchair} onChange={(e) => setNewAppt({ ...newAppt, wheelchair: e.target.checked })} className={checkboxClass} /> Wheelchair
        </label>
        <label className={labelClass}>
          <input type="checkbox" checked={!!newAppt.withLift} onChange={(e) => setNewAppt({ ...newAppt, withLift: e.target.checked })} className={checkboxClass} /> With lift
        </label>
        <label className={labelClass}>
          <input type="checkbox" checked={!!newAppt.recliner} onChange={(e) => setNewAppt({ ...newAppt, recliner: e.target.checked })} className={checkboxClass} /> Recliner
        </label>
        <label className={labelClass}>
          <input type="checkbox" checked={newAppt.escort === "Yes"} onChange={(e) => setNewAppt({ ...newAppt, escort: e.target.checked ? "Yes" : "No" })} className={checkboxClass} /> Escort
        </label>
        <label className={labelClass}>
          <input type="checkbox" checked={!!newAppt.oxygen} onChange={(e) => setNewAppt({ ...newAppt, oxygen: e.target.checked })} className={checkboxClass} /> Oxygen
        </label>
        <label className={labelClass}>
          <input type="checkbox" checked={!!newAppt.bariatric} onChange={(e) => setNewAppt({ ...newAppt, bariatric: e.target.checked })} className={checkboxClass} /> Bariatric
        </label>
      </div>
    </section>
  );
}
