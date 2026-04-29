import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import type { Appointment, Resident, TransportationCompany } from "../../types";
import { validateAppointmentDraft } from "./modal-sections/appointmentValidation";
import { AppointmentOriginSection } from "./modal-sections/AppointmentOriginSection";
import { AppointmentLocationSection } from "./modal-sections/AppointmentLocationSection";
import { AppointmentDateStatusSection } from "./modal-sections/AppointmentDateStatusSection";
import { AppointmentTimingSection } from "./modal-sections/AppointmentTimingSection";
import { AppointmentSpecialtySection } from "./modal-sections/AppointmentSpecialtySection";
import { AppointmentClinicalDetailsSection } from "./modal-sections/AppointmentClinicalDetailsSection";
import { AppointmentTransportSection } from "./modal-sections/AppointmentTransportSection";
import { AppointmentNotesSection } from "./modal-sections/AppointmentNotesSection";
import { AppointmentModalFooter } from "./modal-sections/AppointmentModalFooter";
import { AppointmentStatusPrompt } from "./modal-sections/AppointmentStatusPrompt";

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
  React.useEffect(() => {
    setNewAppt((prev) => {
      if (!prev.date) {
        if (prev.status !== "Pending Scheduling Review") {
          return { ...prev, status: "Pending Scheduling Review" as any };
        }
        return prev;
      }

      if (prev.date && prev.status === "Pending Scheduling Review") {
        return { ...prev, status: "Scheduled" as any };
      }

      return prev;
    });
  }, [newAppt.date, setNewAppt]);

  const validation = validateAppointmentDraft(newAppt);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                onClick={onClose}
                className="p-2 hover:bg-white/15 rounded-full"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto page-scrollbar space-y-8 flex-1">
              {!validation.isValid && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {validation.errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}

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
              <AppointmentTimingSection
                newAppt={newAppt}
                setNewAppt={setNewAppt}
                FormField={FormField}
              />
              <AppointmentSpecialtySection
                newAppt={newAppt}
                setNewAppt={setNewAppt}
                showOtherSpecialtyInput={showOtherSpecialtyInput}
                setShowOtherSpecialtyInput={setShowOtherSpecialtyInput}
                FormField={FormField}
              />
              <AppointmentClinicalDetailsSection
                newAppt={newAppt}
                setNewAppt={setNewAppt}
                FormField={FormField}
              />
              <AppointmentTransportSection
                newAppt={newAppt}
                setNewAppt={setNewAppt}
                transportCompanies={transportCompanies}
                FormField={FormField}
              />
              <AppointmentNotesSection
                newAppt={newAppt}
                setNewAppt={setNewAppt}
                FormField={FormField}
              />
            </div>

            <AppointmentModalFooter
              editingId={editingId}
              deleteAppointment={deleteAppointment}
              handleSaveAppointment={handleSaveAppointment}
              onClose={onClose}
              isSaveDisabled={!validation.isValid}
            />
          </motion.div>

          <AppointmentStatusPrompt
            modalStatusPrompt={modalStatusPrompt}
            setModalStatusPrompt={setModalStatusPrompt}
            setNewAppt={setNewAppt}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
