import React from "react";
import type { Appointment, Resident } from "../../../types";

type AppointmentOriginSectionProps = {
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  residentSearchTerm: string;
  setResidentSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  showResidentSuggestions: boolean;
  setShowResidentSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  filteredResidents: Resident[];
  handleResidentInputChange: (value: string) => void;
  handleSelectResident: (resident: Resident) => void;
  FormField: (props: {
    label: string;
    info?: string;
    children: React.ReactNode;
  }) => JSX.Element;
};

export function AppointmentOriginSection({
  newAppt,
  setNewAppt,
  residentSearchTerm,
  setResidentSearchTerm,
  showResidentSuggestions,
  setShowResidentSuggestions,
  filteredResidents,
  handleResidentInputChange,
  handleSelectResident,
  FormField,
}: AppointmentOriginSectionProps) {
  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Origin of Appointment"
          info="e.g., MD Order / Family / Hospital / Specialist"
        >
          <input
            type="text"
            value={newAppt.origin || ""}
            onChange={(e) =>
              setNewAppt({ ...newAppt, origin: e.target.value })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
            placeholder="e.g., MD Order"
          />
        </FormField>

        <FormField label="Resident Name *" info="Last, First">
          <div className="relative">
            <input
              type="text"
              value={newAppt.residentName || ""}
              onChange={(e) => handleResidentInputChange(e.target.value)}
              onFocus={() => setShowResidentSuggestions(true)}
              onBlur={() =>
                setTimeout(() => setShowResidentSuggestions(false), 200)
              }
              className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
              placeholder="Search census..."
            />

            {showResidentSuggestions &&
              (residentSearchTerm || newAppt.residentName) &&
              filteredResidents.length > 0 && (
                <div className="absolute z-60 w-full mt-2 bg-white border border-[#d6deeb] rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {filteredResidents.map((resident) => (
                    <button
                      key={resident.id}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-brand-light/30 border-b border-[#f0f4f8] last:border-0 transition-colors"
                      onClick={() => {
                        handleSelectResident(resident);
                        setResidentSearchTerm("");
                        setShowResidentSuggestions(false);
                      }}
                    >
                      <p className="font-black text-slate-800 text-sm">
                        {resident.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        MRN: {resident.mrn} • {resident.unit} •{" "}
                        {resident.roomNumber}
                      </p>
                    </button>
                  ))}
                </div>
              )}
          </div>
        </FormField>

        <FormField label="Unit">
          <input
            list="unit-options"
            value={newAppt.unit || ""}
            onChange={(e) => setNewAppt({ ...newAppt, unit: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
            placeholder="e.g., Unit A"
          />
          <datalist id="unit-options">
            <option value="Unit A" />
            <option value="Unit B" />
            <option value="Unit 1" />
            <option value="Unit 2" />
            <option value="Unit 3" />
            <option value="Unit 4" />
            <option value="Rehab" />
          </datalist>
        </FormField>

        <FormField label="Room #">
          <input
            type="text"
            value={newAppt.roomNumber || ""}
            onChange={(e) =>
              setNewAppt({ ...newAppt, roomNumber: e.target.value })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
            placeholder="e.g., 214A"
          />
        </FormField>
      </div>
    </section>
  );
}