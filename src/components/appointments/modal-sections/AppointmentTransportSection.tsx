import React from "react";
import type { Appointment, TransportationCompany } from "../../../types";

type Props = {
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  transportCompanies: TransportationCompany[];
  FormField: (props: { label: string; info?: string; children: React.ReactNode }) => JSX.Element;
};

export function AppointmentTransportSection({
  newAppt,
  setNewAppt,
  transportCompanies,
  FormField,
}: Props) {
  return (
    <section className="bg-brand-light/30 border border-brand/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5 text-brand font-black text-xs uppercase tracking-wider">
        Transport & Logistics
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="flex flex-col gap-3">
          <FormField label="Type of Transport">
            <select
              value={newAppt.transportType || ""}
              onChange={(e) =>
                setNewAppt({
                  ...newAppt,
                  transportType: e.target.value,
                  ...(e.target.value !== "Others" ? { transportTypeOther: "" } : {}),
                })
              }
              className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
            >
              <option value="">— Select —</option>
              <option value="Facility Van">Facility Van</option>
              <option value="Ambulance">Ambulance</option>
              <option value="Lyft/Uber">Lyft/Uber</option>
              <option value="Ambulette">Ambulette</option>
              <option value="Private Care">Private Care</option>
              <option value="Others">Others</option>
            </select>
          </FormField>

          {newAppt.transportType === "Others" && (
            <FormField label="Other Transport Type">
              <input
                type="text"
                value={newAppt.transportTypeOther || ""}
                onChange={(e) =>
                  setNewAppt({ ...newAppt, transportTypeOther: e.target.value })
                }
                className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                placeholder="Enter transport type"
              />
            </FormField>
          )}
        </div>

        <FormField label="Transport Company">
          <select
            value={
              newAppt.transportCompanyId ||
              (newAppt.transportCompany === "Others" ? "others" : "")
            }
            onChange={(e) => {
              const value = e.target.value;

              if (value === "others") {
                setNewAppt({
                  ...newAppt,
                  transportCompanyId: "",
                  transportCompany: "Others",
                  transportCompanyOther: "",
                  transportCompanyPhone: "",
                });
                return;
              }

              const selected = transportCompanies.find((company) => company.id === value);
              if (selected) {
                setNewAppt({
                  ...newAppt,
                  transportCompanyId: selected.id,
                  transportCompany: selected.name,
                  transportCompanyOther: "",
                  transportCompanyPhone: selected.phone || "",
                });
              }
            }}
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
          >
            <option value="">Select transportation company</option>
            {transportCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}{company.phone ? ` — ${company.phone}` : ""}
              </option>
            ))}
            <option value="others">Others / Not in Directory</option>
          </select>
        </FormField>

        {newAppt.transportCompany === "Others" && (
          <FormField label="Manual Transport Company">
            <input
              type="text"
              value={newAppt.transportCompanyOther || ""}
              onChange={(e) =>
                setNewAppt({
                  ...newAppt,
                  transportCompanyOther: e.target.value,
                  transportCompany: e.target.value || "Others",
                })
              }
              className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
              placeholder="Enter company name"
            />
          </FormField>
        )}

        <FormField label="Transport Company Contact #">
          <input
            type="text"
            value={newAppt.transportCompanyPhone || ""}
            onChange={(e) =>
              setNewAppt({ ...newAppt, transportCompanyPhone: e.target.value })
            }
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
            placeholder="Auto-filled from directory or enter manually"
          />
        </FormField>

        <div className="flex flex-col gap-3">
          <FormField label="Payer for Ride">
            <select
              value={newAppt.payerForRide || ""}
              onChange={(e) =>
                setNewAppt({
                  ...newAppt,
                  payerForRide: e.target.value,
                  ...(e.target.value !== "Others" ? { payerForRideOther: "" } : {}),
                })
              }
              className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
            >
              <option value="">— Select —</option>
              <option value="Medicaid">Medicaid</option>
              <option value="Medicare">Medicare</option>
              <option value="Facility">Facility</option>
              <option value="Resident">Resident</option>
              <option value="Others">Others</option>
            </select>
          </FormField>

          {newAppt.payerForRide === "Others" && (
            <FormField label="Other Payer">
              <input
                type="text"
                value={newAppt.payerForRideOther || ""}
                onChange={(e) =>
                  setNewAppt({ ...newAppt, payerForRideOther: e.target.value })
                }
                className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                placeholder="Enter payer details"
              />
            </FormField>
          )}
        </div>

        <FormField label="Round Trip?">
          <select
            value={newAppt.roundTrip || ""}
            onChange={(e) => setNewAppt({ ...newAppt, roundTrip: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
          >
            <option value="">—</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </FormField>

        <div className="flex flex-col gap-3">
          <FormField label="Escort?">
            <select
              value={newAppt.escort || ""}
              onChange={(e) =>
                setNewAppt({
                  ...newAppt,
                  escort: e.target.value,
                  ...(e.target.value === "No" ? { escortDetails: "" } : {}),
                })
              }
              className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
            >
              <option value="">—</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          {newAppt.escort === "Yes" && (
            <>
              <FormField label="Escort Details">
                <input
                  type="text"
                  value={newAppt.escortDetails || ""}
                  onChange={(e) =>
                    setNewAppt({ ...newAppt, escortDetails: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                  placeholder="Enter escort name/details..."
                />
              </FormField>

              <FormField label="Escort Phone #">
                <input
                  type="text"
                  value={newAppt.escortPhone || ""}
                  onChange={(e) =>
                    setNewAppt({ ...newAppt, escortPhone: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                  placeholder="Escort contact number"
                />
              </FormField>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
