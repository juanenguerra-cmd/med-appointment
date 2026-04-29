import React from "react";
import { MapPin } from "lucide-react";
import type { Appointment } from "../../../types";

type AppointmentLocationSectionProps = {
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  FormField: (props: {
    label: string;
    info?: string;
    children: React.ReactNode;
  }) => JSX.Element;
};

export function AppointmentLocationSection({
  newAppt,
  setNewAppt,
  FormField,
}: AppointmentLocationSectionProps) {
  return (
    <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
        <MapPin size={16} /> Location Details
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Staff/Doctor Name">
          <input
            type="text"
            value={newAppt.providerName || ""}
            onChange={(e) =>
              setNewAppt({
                ...newAppt,
                providerName: e.target.value,
              })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
            placeholder="e.g., Dr. Smith"
          />
        </FormField>

        <FormField label="Location Name / Address">
          <input
            type="text"
            value={newAppt.location || ""}
            onChange={(e) =>
              setNewAppt({ ...newAppt, location: e.target.value })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
            placeholder="Clinic / Hospital / Address"
          />
        </FormField>

        <FormField label="Contact Number">
          <input
            type="text"
            value={newAppt.contactNumber || ""}
            onChange={(e) =>
              setNewAppt({
                ...newAppt,
                contactNumber: e.target.value,
              })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
            placeholder="(###) ###-####"
          />
        </FormField>
      </div>
    </section>
  );
}