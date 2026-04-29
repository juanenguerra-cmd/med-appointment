import React from "react";
import type { Appointment } from "../../../types";

type AppointmentDateStatusSectionProps = {
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  setModalStatusPrompt: React.Dispatch<
    React.SetStateAction<{ status: string; reason: string } | null>
  >;
  FormField: (props: {
    label: string;
    info?: string;
    children: React.ReactNode;
  }) => JSX.Element;
};

export function AppointmentDateStatusSection({
  newAppt,
  setNewAppt,
  setModalStatusPrompt,
  FormField,
}: AppointmentDateStatusSectionProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <FormField label="Transport Scheduling">
        <input
          type="date"
          value={newAppt.schedulingDate || ""}
          onChange={(e) =>
            setNewAppt({
              ...newAppt,
              schedulingDate: e.target.value,
            })
          }
          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
        />
      </FormField>

      <FormField label="Date of Referral">
        <input
          type="date"
          value={newAppt.referralDate || ""}
          onChange={(e) =>
            setNewAppt({ ...newAppt, referralDate: e.target.value })
          }
          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
        />
      </FormField>

      <FormField label="Status">
        <select
          value={newAppt.status || "Scheduled"}
          onChange={(e) => {
            const val = e.target.value;

            setNewAppt({
              ...newAppt,
              status: val as any,
            });

            if (
              ["Cancelled", "Rescheduled", "Deferred", "Discontinued"].includes(
                val,
              )
            ) {
              setModalStatusPrompt({ status: val, reason: "" });
            }
          }}
          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
        >
          <option value="Pending Scheduling Review">
            Pending Scheduling Review
          </option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Rescheduled">Rescheduled</option>
          <option value="Discontinued">Discontinued</option>
          <option value="Deferred">Deferred</option>
        </select>
      </FormField>
    </section>
  );
}