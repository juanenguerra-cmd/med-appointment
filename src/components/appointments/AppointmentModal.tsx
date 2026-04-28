import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, Database, User, Calendar } from "lucide-react";
import { Button } from "../Button";
import type { Appointment, Resident, TransportationCompany } from "../../types";
import { CONSULT_REASONS_BY_SPECIALTY } from "../../constants/consultReasons";
import { MEDICAL_SPECIALTIES } from "../../constants/medicalSpecialties";

type AppointmentModalProps = {
  isOpen: boolean;
  editingId: string | null;
  newAppt: Partial<Appointment>;
  setNewAppt: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
  showOtherSpecialtyInput: boolean;
  setShowOtherSpecialtyInput: React.Dispatch<React.SetStateAction<boolean>>;
  modalStatusPrompt: { status: string; reason: string } | null;
  setModalStatusPrompt: React.Dispatch<React.SetStateAction<{ status: string; reason: string } | null>>;
  residentSearchTerm: string;
  setResidentSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  showResidentSuggestions: boolean;
  setShowResidentSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  filteredResidents: Resident[];
  handleResidentInputChange: (value: string) => void;
  handleSelectResident: (resident: Resident) => void;
  handleSaveAppointment: () => void;
  onClose: () => void;
  transportCompanies: TransportationCompany[];
  FormField: (props: { label: string; info?: string; children: React.ReactNode }) => JSX.Element;
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
                    {/* Origins Section */}
                    <section>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Origin of Appointment"
                          info="e.g., MD Order / Family / Hospital / Specialist"
                        >
                          <input
                            type="text"
                            value={newAppt.origin}
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
                              value={newAppt.residentName}
                              onChange={(e) =>
                                handleResidentInputChange(e.target.value)
                              }
                              onFocus={() => setShowResidentSuggestions(true)}
                              onBlur={() =>
                                setTimeout(
                                  () => setShowResidentSuggestions(false),
                                  200,
                                )
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                              placeholder="Search census..."
                            />
                            {showResidentSuggestions &&
                              (residentSearchTerm || newAppt.residentName) &&
                              filteredResidents.length > 0 && (
                                <div className="absolute z-60 w-full mt-2 bg-white border border-[#d6deeb] rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                  {filteredResidents.map((r) => (
                                    <button
                                      key={r.id}
                                      type="button"
                                      className="w-full px-4 py-3 text-left hover:bg-brand-light/30 border-b border-[#f0f4f8] last:border-0 transition-colors"
                                      onClick={() => {
                                        handleSelectResident(r);
                                        setResidentSearchTerm("");
                                        setShowResidentSuggestions(false);
                                      }}
                                    >
                                      <p className="font-black text-slate-800 text-sm">
                                        {r.name}
                                      </p>
                                      <p className="text-[10px] text-slate-500">
                                        MRN: {r.mrn} • {r.unit} • {r.roomNumber}
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
                            value={newAppt.unit}
                            onChange={(e) =>
                              setNewAppt({ ...newAppt, unit: e.target.value })
                            }
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
                            value={newAppt.roomNumber}
                            onChange={(e) =>
                              setNewAppt({ ...newAppt, roomNumber: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                            placeholder="e.g., 214A"
                          />
                        </FormField>
                      </div>
                    </section>

                    {/* Location Details Section */}
                    <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                        <MapPin size={16} /> Location Details
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="Staff/Doctor Name">
                          <input
                            type="text"
                            value={newAppt.providerName}
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
                            value={newAppt.location}
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
                            value={newAppt.contactNumber}
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

                    {/* Dates & Status Section */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField label="Transport Scheduling">
                        <input
                          type="date"
                          value={newAppt.schedulingDate}
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
                          value={newAppt.referralDate}
                          onChange={(e) =>
                            setNewAppt({ ...newAppt, referralDate: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        />
                      </FormField>
                      <FormField label="Status">
                        <select
                          value={newAppt.status}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewAppt({
                              ...newAppt,
                              status: val as any,
                            });
                            if (["Cancelled", "Rescheduled", "Deferred", "Discontinued"].includes(val)) {
                               setModalStatusPrompt({ status: val, reason: "" });
                            }
                          }}
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Discontinued">Discontinued</option>
                          <option value="Deferred">Deferred</option>
                        </select>
                      </FormField>
                    </section>

                    {/* Detailed Timing Section */}
                    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField label="Date of Appt">
                        <input
                          type="date"
                          value={newAppt.date}
                          onChange={(e) =>
                            setNewAppt({ ...newAppt, date: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        />
                      </FormField>
                      <FormField label="Time of Appt">
                        <input
                          type="time"
                          value={newAppt.time}
                          onChange={(e) =>
                            setNewAppt({ ...newAppt, time: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        />
                      </FormField>
                      <FormField label="Pick Up Time">
                        <input
                          type="time"
                          value={newAppt.pickUpTime}
                          onChange={(e) =>
                            setNewAppt({ ...newAppt, pickUpTime: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        />
                      </FormField>
                    </section>

                    {/* Specialty & Service info */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Appt. Type (Specialty)">
                          <div className="space-y-2">
                            <select
                              value={showOtherSpecialtyInput ? "Other" : newAppt.type}
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
                                value={newAppt.type}
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
                            value={newAppt.description}
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
                            value={newAppt.serviceInHouse}
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
                            value={newAppt.reasonSendOut}
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
                              <option value="" disabled>Select a valid specialty first</option>
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
                            placeholder="e.g., 5' 2&quot;"
                          />
                        </FormField>
                      </div>
                      <div className="mt-5 pt-5 border-t border-[#d6deeb] flex flex-wrap gap-x-6 gap-y-3">
                        <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                          <input type="checkbox" checked={!!newAppt.ambulating} onChange={e => setNewAppt({...newAppt, ambulating: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Ambulating
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                          <input type="checkbox" checked={!!newAppt.wheelchair} onChange={e => setNewAppt({...newAppt, wheelchair: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Wheelchair
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                          <input type="checkbox" checked={!!newAppt.withLift} onChange={e => setNewAppt({...newAppt, withLift: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> With lift
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                          <input type="checkbox" checked={!!newAppt.recliner} onChange={e => setNewAppt({...newAppt, recliner: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Recliner
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                          <input type="checkbox" checked={newAppt.escort === "Yes"} onChange={e => setNewAppt({...newAppt, escort: e.target.checked ? "Yes" : "No"})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Escort
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                          <input type="checkbox" checked={!!newAppt.oxygen} onChange={e => setNewAppt({...newAppt, oxygen: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Oxygen
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                          <input type="checkbox" checked={!!newAppt.bariatric} onChange={e => setNewAppt({...newAppt, bariatric: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Bariatric
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
                              value={newAppt.transportType}
                              onChange={(e) =>
                                setNewAppt({
                                  ...newAppt,
                                  transportType: e.target.value,
                                  ...(e.target.value !== "Others" ? { transportTypeOther: "" } : {})
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
                            value={newAppt.transportCompanyId || (newAppt.transportCompany === "Others" ? "others" : "")}
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
                              value={newAppt.payerForRide}
                              onChange={(e) =>
                                setNewAppt({
                                  ...newAppt,
                                  payerForRide: e.target.value,
                                  ...(e.target.value !== "Others" ? { payerForRideOther: "" } : {})
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
                            value={newAppt.roundTrip}
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
                              value={newAppt.escort}
                              onChange={(e) =>
                                setNewAppt({ ...newAppt, escort: e.target.value, ...(e.target.value === "No" ? { escortDetails: "" } : {}) })
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

                    <FormField label="Notes / Other">
                      <textarea
                        value={newAppt.notes}
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
                          <h3 className="font-bold text-slate-800 text-lg">Update Status</h3>
                        </div>
                        <div className="p-6">
                          <p className="text-sm font-medium text-slate-600 mb-3 block">Reason for changing status to <span className="font-bold text-brand">{modalStatusPrompt.status}</span>:</p>
                          <textarea
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none mb-4"
                            rows={3}
                            placeholder="Enter reason..."
                            value={modalStatusPrompt.reason}
                            onChange={(e) => setModalStatusPrompt({...modalStatusPrompt, reason: e.target.value})}
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
                                setNewAppt(prev => {
                                   const existingNotes = prev.notes || "";
                                   const val = modalStatusPrompt.status;
                                   const reason = modalStatusPrompt.reason;
                                   return {
                                     ...prev,
                                     notes: existingNotes ? `${existingNotes}\n[${val} Reason]: ${reason}` : `[${val} Reason]: ${reason}`
                                   }
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

            {isResidentDetailOpen && selectedResident && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsResidentDetailOpen(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 18 }}
                  className="relative w-full max-w-4xl bg-[#f8fbff] rounded-3xl shadow-2xl overflow-hidden border border-[#d6deeb] max-h-[90vh] flex flex-col"
                >
                  <div className="transport-gradient text-white p-5 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white border border-white/30 backdrop-blur-md">
                        <User size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">
                          {selectedResident.name}
                        </h3>
                        <p className="text-xs opacity-85 mt-0.5">
                          Resident ID:{" "}
                          <span className="font-mono">{selectedResident.mrn}</span>{" "}
                          • Room {selectedResident.roomNumber}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsResidentDetailOpen(false)}
                      className="p-2 hover:bg-white/15 rounded-full"
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto page-scrollbar flex-1 space-y-8">
                    {/* Basic Info Grid */}
                    <section>
                      <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                        <User size={16} /> Demographics & Identity
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DetailItem label="Sex" value={selectedResident.sex} />
                        <DetailItem label="Age" value={selectedResident.age} />
                        <DetailItem
                          label="Admission Date"
                          value={selectedResident.admissionDate}
                        />
                        <DetailItem
                          label="Primary Doctor"
                          value={selectedResident.doctor}
                        />
                        <DetailItem
                          label="Location"
                          value={`${selectedResident.floor} • ${selectedResident.unit}`}
                        />
                        <DetailItem
                          label="Room Number"
                          value={selectedResident.roomNumber}
                        />
                      </div>
                    </section>

                    {/* Clinical Summary */}
                    <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                        <Activity size={16} /> Clinical Profile
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                            Primary Diagnosis
                          </p>
                          <p className="text-sm font-bold text-slate-800 bg-brand-light/20 p-3 rounded-xl border border-brand/5">
                            {selectedResident.diagnosis}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                            Allergies
                          </p>
                          <p
                            className={`text-sm font-bold p-3 rounded-xl border ${selectedResident.allergies.toLowerCase() === "no known allergies" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}
                          >
                            {selectedResident.allergies}
                          </p>
                        </div>
                        {selectedResident.notes && (
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                              Medical Brief / Notes
                            </p>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                              {selectedResident.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Appointment History */}
                    <section>
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                          <Calendar size={16} /> Appointment & Visit History
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => printResidentAppointmentSummary("all")}>Print All</Button>
                          <Button size="sm" variant="secondary" onClick={() => printResidentAppointmentSummary("history")}>Print History</Button>
                          <Button size="sm" variant="secondary" onClick={() => printResidentAppointmentSummary("future")}>Print Future</Button>
                        </div>
                      </div>

                      {residentAppointments.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-[#d6deeb] bg-white shadow-sm">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-[#f8fbff] text-[10px] font-black uppercase tracking-wider text-slate-500">
                              <tr>
                                <th className="border-b border-[#d6deeb] px-4 py-3">Date / Time</th>
                                <th className="border-b border-[#d6deeb] px-4 py-3">Visit Category</th>
                                <th className="border-b border-[#d6deeb] px-4 py-3">Provider / Clinic</th>
                                <th className="border-b border-[#d6deeb] px-4 py-3">Location</th>
                                <th className="border-b border-[#d6deeb] px-4 py-3">Status</th>
                                <th className="border-b border-[#d6deeb] px-4 py-3">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eef2f7]">
                              {residentAppointments
                                .sort(
                                  (a, b) =>
                                    new Date(b.date).getTime() -
                                    new Date(a.date).getTime(),
                                )
                                .map((apt) => (
                                  <tr key={apt.id} className="hover:bg-brand-light/20 transition-colors">
                                    <td className="px-4 py-3 align-top">
                                      <p className="font-black text-slate-800">{formatFullDate(apt.date)}</p>
                                      <p className="text-xs font-bold text-brand">{formatTimeAMPM(apt.time)}</p>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                      <p className="font-black text-slate-800">{apt.type || "—"}</p>
                                      {(apt.reasonConsultation || apt.consultReason || apt.description) && (
                                        <p className="mt-1 text-xs font-semibold text-slate-500 line-clamp-2">
                                          {apt.reasonConsultation || apt.consultReason || apt.description}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                      <p className="font-bold text-slate-700">{apt.providerName || "—"}</p>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                      <p className="text-xs font-semibold text-slate-500 line-clamp-2">{apt.location || "—"}</p>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                      <span
                                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                                          apt.status === "Completed"
                                            ? "bg-green-100 text-green-700"
                                            : apt.status === "Cancelled" || apt.status === "Discontinued" || apt.status === "Deferred"
                                              ? "bg-red-100 text-red-700"
                                              : "bg-brand-light text-brand"
                                        }`}
                                      >
                                        {apt.status || "Scheduled"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 align-top text-xs font-semibold text-slate-500 max-w-[260px]">
                                      <p className="line-clamp-3">{apt.notes || "—"}</p>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                          <p className="text-slate-400 font-bold text-sm">
                            No appointment records found for this resident.
                          </p>
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="p-5 border-t border-[#d6deeb] bg-[rgba(11,42,111,.03)] shrink-0 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => setIsResidentDetailOpen(false)}
                    >
                      Close Detailed View
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
  );
}
