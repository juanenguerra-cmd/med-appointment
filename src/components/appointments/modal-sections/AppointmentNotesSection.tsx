import React from "react";
import type { Appointment } from "../../../types";

type Props = {
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  FormField: any;
};

export function AppointmentNotesSection({ newAppt, setNewAppt, FormField }: Props) {
  return (
    <FormField label="Notes / Other">
      <textarea
        value={newAppt.notes || ""}
        onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white min-h-[100px]"
        placeholder="Add any relevant details..."
      />
    </FormField>
  );
}
