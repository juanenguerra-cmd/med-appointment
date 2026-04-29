import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
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

export function AppointmentModal(props:any){
  const {isOpen,onClose,newAppt,setNewAppt,FormField,transportCompanies,editingId,handleSaveAppointment,deleteAppointment,modalStatusPrompt,setModalStatusPrompt}=props;

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

            <div className="p-4 flex justify-between items-center">
              <h3 className="font-bold">Appointment</h3>
              <button onClick={onClose}><X /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <AppointmentOriginSection {...props} />
              <AppointmentLocationSection {...props} />
              <AppointmentDateStatusSection {...props} />
              <AppointmentTimingSection newAppt={newAppt} setNewAppt={setNewAppt} FormField={FormField} />
              <AppointmentSpecialtySection {...props} />
              <AppointmentClinicalDetailsSection newAppt={newAppt} setNewAppt={setNewAppt} FormField={FormField} />
              <AppointmentTransportSection newAppt={newAppt} setNewAppt={setNewAppt} transportCompanies={transportCompanies} FormField={FormField} />
              <AppointmentNotesSection newAppt={newAppt} setNewAppt={setNewAppt} FormField={FormField} />
            </div>

            <AppointmentModalFooter
              editingId={editingId}
              deleteAppointment={deleteAppointment}
              handleSaveAppointment={handleSaveAppointment}
              onClose={onClose}
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
