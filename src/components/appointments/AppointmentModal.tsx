import React from "react";
import { AppointmentOriginSection } from "./modal-sections/AppointmentOriginSection";
import { AppointmentLocationSection } from "./modal-sections/AppointmentLocationSection";
import { AppointmentDateStatusSection } from "./modal-sections/AppointmentDateStatusSection";
import { AppointmentTimingSection } from "./modal-sections/AppointmentTimingSection";
import { AppointmentSpecialtySection } from "./modal-sections/AppointmentSpecialtySection";
import { AppointmentClinicalDetailsSection } from "./modal-sections/AppointmentClinicalDetailsSection";
import { AppointmentTransportSection } from "./modal-sections/AppointmentTransportSection";

export function AppointmentModal(props:any){
  const {newAppt,setNewAppt,FormField,transportCompanies}=props;

  return (
    <div className="p-6 space-y-6">
      <AppointmentOriginSection {...props} />
      <AppointmentLocationSection {...props} />
      <AppointmentDateStatusSection {...props} />
      <AppointmentTimingSection newAppt={newAppt} setNewAppt={setNewAppt} FormField={FormField} />
      <AppointmentSpecialtySection {...props} />
      <AppointmentClinicalDetailsSection newAppt={newAppt} setNewAppt={setNewAppt} FormField={FormField} />
      <AppointmentTransportSection newAppt={newAppt} setNewAppt={setNewAppt} transportCompanies={transportCompanies} FormField={FormField} />
    </div>
  );
}
