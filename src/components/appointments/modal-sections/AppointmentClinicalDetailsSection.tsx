import React from "react";
import type { Appointment } from "../../../types";

type Props = {
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  FormField: (props: { label: string; info?: string; children: React.ReactNode }) => JSX.Element;
};

export function AppointmentClinicalDetailsSection({ newAppt, setNewAppt, FormField }: Props) {
  return (
    <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Nursing Staff">
          <input type="text" value={newAppt.nurseCompleting || ""} onChange={(e)=>setNewAppt({...newAppt,nurseCompleting:e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb]" />
        </FormField>
        <FormField label="Patient Weight">
          <input type="text" value={newAppt.weight || ""} onChange={(e)=>setNewAppt({...newAppt,weight:e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb]" />
        </FormField>
        <FormField label="Patient Height">
          <input type="text" value={newAppt.height || ""} onChange={(e)=>setNewAppt({...newAppt,height:e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb]" />
        </FormField>
      </div>

      <div className="mt-5 pt-5 border-t border-[#d6deeb] flex flex-wrap gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!newAppt.ambulating} onChange={(e)=>setNewAppt({...newAppt,ambulating:e.target.checked})} /> Ambulating
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!newAppt.wheelchair} onChange={(e)=>setNewAppt({...newAppt,wheelchair:e.target.checked})} /> Wheelchair
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!newAppt.withLift} onChange={(e)=>setNewAppt({...newAppt,withLift:e.target.checked})} /> With lift
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!newAppt.recliner} onChange={(e)=>setNewAppt({...newAppt,recliner:e.target.checked})} /> Recliner
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={newAppt.escort === "Yes"} onChange={(e)=>setNewAppt({...newAppt,escort:e.target.checked?"Yes":"No"})} /> Escort
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!newAppt.oxygen} onChange={(e)=>setNewAppt({...newAppt,oxygen:e.target.checked})} /> Oxygen
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!newAppt.bariatric} onChange={(e)=>setNewAppt({...newAppt,bariatric:e.target.checked})} /> Bariatric
        </label>
      </div>
    </section>
  );
}
