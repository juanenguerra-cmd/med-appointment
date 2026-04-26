import { Appointment, Resident, Facility } from "../types";

export const isOrthopedicSpecialty = (specialty?: string) => {
  const value = String(specialty || "").toLowerCase();
  return value.includes("ortho") || value.includes("orthopedic");
};

export const getConsultFormLabel = (apt: Appointment) => {
  return isOrthopedicSpecialty(apt.type)
    ? "ORTHO CONSULT"
    : "REGULAR CONSULT";
};

export const generateRegularConsultHTML = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility
) => {
  return `
  <html>
    <head>
      <title>Regular Consult</title>
    </head>
    <body>
      <h2 style="text-align:center;">SPECIALIST CONSULTATION / FOLLOW-UP</h2>
      <p><b>Resident:</b> ${apt.residentName}</p>
      <p><b>Room:</b> ${apt.roomNumber}</p>
      <p><b>Date:</b> ${apt.date}</p>
      <p><b>Specialty:</b> ${apt.type}</p>
      <p><b>Reason:</b> ${apt.description || apt.reasonConsultation || ""}</p>
      <br/><br/>
      <p>__________________________________________</p>
      <p>Consultant Signature</p>
    </body>
  </html>
  `;
};

export const openConsultForm = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility
) => {
  const html = generateRegularConsultHTML(apt, resident, facility);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
};
