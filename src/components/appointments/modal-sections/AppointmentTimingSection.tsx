import React from "react";
import type { Appointment } from "../../../types";

type AppointmentTimingSectionProps = {
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  FormField: (props: {
    label: string;
    info?: string;
    children: React.ReactNode;
  }) => React.ReactElement;
};

export function AppointmentTimingSection({
  newAppt,
  setNewAppt,
  FormField,
}: AppointmentTimingSectionProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <FormField label="Date of Appt">
        <input
          type="date"
          value={newAppt.date || ""}
          onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
        />
      </FormField>

      <FormField label="Time of Appt">
        <input
          type="time"
          value={newAppt.time || ""}
          onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
        />
      </FormField>

      <FormField label="Pick Up Time">
        <input
          type="time"
          value={newAppt.pickUpTime || ""}
          onChange={(e) =>
            setNewAppt({ ...newAppt, pickUpTime: e.target.value })
          }
          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
        />
      </FormField>
    </section>
  );
}
