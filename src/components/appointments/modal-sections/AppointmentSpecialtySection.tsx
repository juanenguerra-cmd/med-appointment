import React from "react";
import type { Appointment } from "../../../types";
import { CONSULT_REASONS_BY_SPECIALTY } from "../../../constants/consultReasons";
import { MEDICAL_SPECIALTIES } from "../../../constants/medicalSpecialties";

type AppointmentSpecialtySectionProps = {
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  showOtherSpecialtyInput: boolean;
  setShowOtherSpecialtyInput: React.Dispatch<React.SetStateAction<boolean>>;
  FormField: (props: {
    label: string;
    info?: string;
    children: React.ReactNode;
  }) => JSX.Element;
};

export function AppointmentSpecialtySection({
  newAppt,
  setNewAppt,
  showOtherSpecialtyInput,
  setShowOtherSpecialtyInput,
  FormField,
}: AppointmentSpecialtySectionProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Appt. Type (Specialty)">
          <div className="space-y-2">
            <select
              value={showOtherSpecialtyInput ? "Other" : newAppt.type || ""}
              onChange={(e) => {
                if (e.target.value === "Other") {
                  setShowOtherSpecialtyInput(true);
                  setNewAppt({ ...newAppt, type: "" });
                } else {
                  setShowOtherSpecialtyInput(false);
                  setNewAppt({ ...newAppt, type: e.target.value });
                }
              }}
              className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
            >
              <option value="">— Select Specialty —</option>
              {MEDICAL_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
              <option value="Other">Other (Manual Entry)</option>
            </select>
            {showOtherSpecialtyInput && (
              <input
                type="text"
                placeholder="Enter specialty manually..."
                value={newAppt.type || ""}
                onChange={(e) =>
                  setNewAppt({ ...newAppt, type: e.target.value })
                }
                className="w-full px-4 py-2 text-sm rounded-xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                autoFocus
              />
            )}
          </div>
        </FormField>
        <FormField label="Visit Category">
          <select
            value={newAppt.description || ""}
            onChange={(e) =>
              setNewAppt({
                ...newAppt,
                description: e.target.value,
              })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
          >
            <option value="">— Select Category —</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Initial Eval">Initial Eval</option>
            <option value="Procedure">Procedure</option>
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Service In House?">
          <select
            value={newAppt.serviceInHouse || ""}
            onChange={(e) =>
              setNewAppt({
                ...newAppt,
                serviceInHouse: e.target.value,
              })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
          >
            <option value="">—</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </FormField>
        <FormField label="Description">
          <input
            type="text"
            value={newAppt.reasonSendOut || ""}
            onChange={(e) =>
              setNewAppt({
                ...newAppt,
                reasonSendOut: e.target.value,
              })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
            placeholder="Provider unavailable"
          />
        </FormField>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Consult Reason (Admin)">
          <select
            value={newAppt.consultReason || ""}
            onChange={(e) =>
              setNewAppt({
                ...newAppt,
                consultReason: e.target.value,
              })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
          >
            <option value="">— Select Statistical Reason —</option>
            {newAppt.type && CONSULT_REASONS_BY_SPECIALTY[newAppt.type] ? (
              CONSULT_REASONS_BY_SPECIALTY[newAppt.type].map((reason, idx) => (
                <option key={idx} value={reason}>
                  {reason}
                </option>
              ))
            ) : (
              <option value="" disabled>
                Select a valid specialty first
              </option>
            )}
            {(!newAppt.type || !CONSULT_REASONS_BY_SPECIALTY[newAppt.type]) && (
              <option value="Other">Other</option>
            )}
          </select>
        </FormField>
        <FormField label="Reason for Consultation (Notes)">
          <input
            type="text"
            value={newAppt.reasonConsultation || ""}
            onChange={(e) =>
              setNewAppt({
                ...newAppt,
                reasonConsultation: e.target.value,
              })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
            placeholder="Additional details for the outside consult"
          />
        </FormField>
      </div>
    </section>
  );
}
