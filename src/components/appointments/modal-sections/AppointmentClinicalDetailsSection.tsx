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
    </section>
  );
}
