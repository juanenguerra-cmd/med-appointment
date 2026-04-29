import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Database } from "lucide-react";
import { Button } from "../Button";
import type { Appointment, Resident, TransportationCompany } from "../../types";
import { AppointmentDateStatusSection } from "./modal-sections/AppointmentDateStatusSection";
import { AppointmentLocationSection } from "./modal-sections/AppointmentLocationSection";
import { AppointmentOriginSection } from "./modal-sections/AppointmentOriginSection";
import { AppointmentSpecialtySection } from "./modal-sections/AppointmentSpecialtySection";

type AppointmentModalProps = {
  isOpen: boolean;
  editingId: string | null;
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  showOtherSpecialtyInput: boolean;
  setShowOtherSpecialtyInput: React.Dispatch<React.SetStateAction<boolean>>;
  modalStatusPrompt: { status: string; reason: string } | null;
  setModalStatusPrompt: React.Dispatch<
    React.SetStateAction<{ status: string; reason: string } | null>
  >;
  residentSearchTerm: string;
  setResidentSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  showResidentSuggestions: boolean;
  setShowResidentSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  filteredResidents: Resident[];
  handleResidentInputChange: (value: string) => void;
  handleSelectResident: (resident: Resident) => void;
  handleSaveAppointment: () => void;
  deleteAppointment: (id: string) => void;
  onClose: () => void;
  transportCompanies: TransportationCompany[];
  FormField: (props: {
    label: string;
    info?: string;
    children: React.ReactNode;
  }) => JSX.Element;
};

export function AppointmentModal({
  isOpen,
  editingId,
  newAppt,
  setNewAppt,
  showOtherSpecialtyInput,
  setShowOtherSpecialtyInput,
  modalStatusPrompt,
  setModalStatusPrompt,
  residentSearchTerm,
  setResidentSearchTerm,
  showResidentSuggestions,
  setShowResidentSuggestions,
  filteredResidents,
  handleResidentInputChange,
  handleSelectResident,
  handleSaveAppointment,
  deleteAppointment,
  onClose,
  transportCompanies,
  FormField,
}: AppointmentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose()}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            className="relative w-full max-w-4xl bg-[#f8fbff] rounded-3xl shadow-2xl overflow-hidden border border-[#d6deeb] max-h-[90vh] flex flex-col"
          >
            <div className="transport-gradient text-white p-5 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  {editingId ? "Modify Record" : "New Appointment Request"}
                </h3>
                <p className="text-xs opacity-85 mt-0.5">
                  Comprehensive entry for clinical and transport tracking.
                </p>
              </div>

              <button
                onClick={() => onClose()}
                className="p-2 hover:bg-white/15 rounded-full"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto page-scrollbar space-y-8 flex-1">
              <AppointmentOriginSection
                newAppt={newAppt}
                setNewAppt={setNewAppt}
                residentSearchTerm={residentSearchTerm}
                setResidentSearchTerm={setResidentSearchTerm}
                showResidentSuggestions={showResidentSuggestions}
                setShowResidentSuggestions={setShowResidentSuggestions}
                filteredResidents={filteredResidents}
                handleResidentInputChange={handleResidentInputChange}
                handleSelectResident={handleSelectResident}
                FormField={FormField}
              />

              <AppointmentLocationSection
                newAppt={newAppt}
                setNewAppt={setNewAppt}
                FormField={FormField}
              />

              <AppointmentDateStatusSection
                newAppt={newAppt}
                setNewAppt={setNewAppt}
                setModalStatusPrompt={setModalStatusPrompt}
                FormField={FormField}
              />

              {/* Detailed Timing Section */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Date of Appt">
                  <input
                    type="date"
                    value={newAppt.date || ""}
                    onChange={(e) =>
                      setNewAppt({ ...newAppt, date: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                  />
                </FormField>

                <FormField label="Time of Appt">
                  <input
                    type="time"
                    value={newAppt.time || ""}
                    onChange={(e) =>
                      setNewAppt({ ...newAppt, time: e.target.value })
                    }
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

              <AppointmentSpecialtySection
                newAppt={newAppt}
                setNewAppt={setNewAppt}
                showOtherSpecialtyInput={showOtherSpecialtyInput}
                setShowOtherSpecialtyInput={setShowOtherSpecialtyInput}
                FormField={FormField}
              />

              {/* Additional Clinical Details (Checklist) */}
              <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                  <Database size={16} /> Patient & Consult Details
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Nursing Staff">
                    <input
                      type="text"
                      value={newAppt.nurseCompleting || ""}
                      onChange={(e) =>
                        setNewAppt({
                          ...newAppt,
                          nurseCompleting: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
                      placeholder="Nurse completing form"
                    />
                  </FormField>

                  <FormField label="Patient Weight">
                    <input
                      type="text"
                      value={newAppt.weight || ""}
                      onChange={(e) =>
                        setNewAppt({ ...newAppt, weight: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
                      placeholder="e.g., 150 lbs"
                    />
                  </FormField>

                  <FormField label="Patient Height">
                    <input
                      type="text"
                      value={newAppt.height || ""}
                      onChange={(e) =>
                        setNewAppt({ ...newAppt, height: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
                      placeholder={`e.g., 5' 2"`}
                    />
                  </FormField>
                </div>

                <div className="mt-5 pt-5 border-t border-[#d6deeb] flex flex-wrap gap-x-6 gap-y-3">
                  <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!newAppt.ambulating}
                      onChange={(e) =>
                        setNewAppt({
                          ...newAppt,
                          ambulating: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20"
                    />{" "}
                    Ambulating
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!newAppt.wheelchair}
                      onChange={(e) =>
                        setNewAppt({
                          ...newAppt,
                          wheelchair: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20"
                    />{" "}
                    Wheelchair
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!newAppt.withLift}
                      onChange={(e) =>
                        setNewAppt({
                          ...newAppt,
                          withLift: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20"
                    />{" "}
                    With lift
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!newAppt.recliner}
                      onChange={(e) =>
                        setNewAppt({
                          ...newAppt,
                          recliner: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20"
                    />{" "}
                    Recliner
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAppt.escort === "Yes"}
                      onChange={(e) =>
                        setNewAppt({
                          ...newAppt,
                          escort: e.target.checked ? "Yes" : "No",
                        })
                      }
                      className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20"
                    />{" "}
                    Escort
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!newAppt.oxygen}
                      onChange={(e) =>
                        setNewAppt({
                          ...newAppt,
                          oxygen: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20"
                    />{" "}
                    Oxygen
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!newAppt.bariatric}
                      onChange={(e) =>
                        setNewAppt({
                          ...newAppt,
                          bariatric: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20"
                    />{" "}
                    Bariatric
                  </label>
                </div>
              </section>

              {/* Transport Section */}
              <section className="bg-brand-light/30 border border-brand/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5 text-brand font-black text-xs uppercase tracking-wider">
                  <Database size={16} /> Transport & Logistics
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
                            ...(e.target.value !== "Others"
                              ? { transportTypeOther: "" }
                              : {}),
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
                            setNewAppt({
                              ...newAppt,
                              transportTypeOther: e.target.value,
                            })
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

                        const selected = transportCompanies.find(
                          (company) => company.id === value,
                        );

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
                          {company.name}
                          {company.phone ? ` — ${company.phone}` : ""}
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
                        setNewAppt({
                          ...newAppt,
                          transportCompanyPhone: e.target.value,
                        })
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
                            ...(e.target.value !== "Others"
                              ? { payerForRideOther: "" }
                              : {}),
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
                            setNewAppt({
                              ...newAppt,
                              payerForRideOther: e.target.value,
                            })
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
                      onChange={(e) =>
                        setNewAppt({ ...newAppt, roundTrip: e.target.value })
                      }
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
                            ...(e.target.value === "No"
                              ? { escortDetails: "" }
                              : {}),
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
                              setNewAppt({
                                ...newAppt,
                                escortDetails: e.target.value,
                              })
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
                              setNewAppt({
                                ...newAppt,
                                escortPhone: e.target.value,
                              })
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

              <FormField label="Notes / Other">
                <textarea
                  value={newAppt.notes || ""}
                  onChange={(e) =>
                    setNewAppt({ ...newAppt, notes: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white min-h-[100px]"
                  placeholder="Add any relevant details..."
                />
              </FormField>
            </div>

            <div className="p-6 border-t border-[#d6deeb] bg-white flex items-center justify-between shrink-0">
              <div>
                {editingId && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this record?")) {
                        deleteAppointment(editingId);
                        onClose();
                      }
                    }}
                  >
                    Delete Record
                  </Button>
                )}
              </div>

              <div>
                <Button
                  variant="secondary"
                  className="mr-3"
                  onClick={() => onClose()}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAppointment}>
                  {editingId
                    ? "Update Appointment Record"
                    : "Save Appointment Record"}
                </Button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {modalStatusPrompt && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
                >
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">
                      Update Status
                    </h3>
                  </div>

                  <div className="p-6">
                    <p className="text-sm font-medium text-slate-600 mb-3 block">
                      Reason for changing status to{" "}
                      <span className="font-bold text-brand">
                        {modalStatusPrompt.status}
                      </span>
                      :
                    </p>

                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none mb-4"
                      rows={3}
                      placeholder="Enter reason..."
                      value={modalStatusPrompt.reason}
                      onChange={(e) =>
                        setModalStatusPrompt({
                          ...modalStatusPrompt,
                          reason: e.target.value,
                        })
                      }
                    />

                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => {
                          setModalStatusPrompt(null);
                        }}
                        className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
                      >
                        Dismiss
                      </button>

                      <Button
                        onClick={() => {
                          setNewAppt((prev) => {
                            const existingNotes = prev.notes || "";
                            const val = modalStatusPrompt.status;
                            const reason = modalStatusPrompt.reason;

                            return {
                              ...prev,
                              notes: existingNotes
                                ? `${existingNotes}\n[${val} Reason]: ${reason}`
                                : `[${val} Reason]: ${reason}`,
                            };
                          });

                          setModalStatusPrompt(null);
                        }}
                      >
                        Append to Notes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
