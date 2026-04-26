import { Appointment, Resident, Facility } from "../types";

const escapeHtml = (value?: string | number | null) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getDob = (resident?: Resident) => {
  const notes = resident?.notes || "";
  const dobMatch = notes.match(/DOB:\s*([^|\n]+)/i);
  return dobMatch?.[1]?.trim() || "";
};

export const isOrthopedicSpecialty = (specialty?: string) => {
  const value = String(specialty || "").trim().toLowerCase();
  return value.includes("ortho") || value.includes("orthopedic") || value.includes("orthopaedic");
};

export const getConsultFormLabel = (apt: Appointment) => {
  return isOrthopedicSpecialty(apt.type) ? "ORTHO CONSULT" : "REGULAR CONSULT";
};

const getRequestingPhysician = (apt: Appointment, resident?: Resident) => {
  return resident?.doctor || apt.providerName || "";
};

const getReasonForConsult = (apt: Appointment) => {
  return apt.description || apt.reasonConsultation || apt.consultReason || apt.reasonSendOut || "";
};

export const generateRegularConsultHTML = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility
) => {
  const residentName = escapeHtml(apt.residentName || resident?.name || "");
  const room = escapeHtml(apt.roomNumber || resident?.roomNumber || "");
  const dateOfRequest = escapeHtml(apt.referralDate || apt.schedulingDate || apt.date || "");
  const specialty = escapeHtml(apt.type || "");
  const physician = escapeHtml(getRequestingPhysician(apt, resident));
  const reason = escapeHtml(getReasonForConsult(apt));
  const dob = escapeHtml(getDob(resident));

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Regular Consult</title>
  <style>
    @page { size: Letter portrait; margin: 0.32in; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; font-family: "Times New Roman", Times, serif; font-size: 12px; }
    .sheet { width: 100%; }
    .title { text-align: center; font-family: Arial, Helvetica, sans-serif; font-weight: 900; font-size: 20px; letter-spacing: -0.02em; line-height: 1; margin-bottom: 4px; }
    .checkline { text-align: center; font-weight: bold; margin-bottom: 6px; }
    .top-row { display: grid; grid-template-columns: 1.6fr 0.45fr 1fr; gap: 7px; align-items: end; margin-bottom: 2px; }
    .two-row { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; align-items: end; margin-bottom: 2px; }
    .field { display: flex; align-items: flex-end; min-width: 0; }
    .label { font-weight: bold; white-space: nowrap; margin-right: 3px; }
    .line { border-bottom: 1px solid #000; min-height: 15px; flex: 1; padding: 0 3px 1px 3px; overflow: hidden; white-space: nowrap; }
    .full-field { display: flex; align-items: flex-end; margin-bottom: 2px; }
    .blank-rule { border-bottom: 1px solid #000; height: 17px; margin-bottom: 2px; }
    .dob-row { display: flex; justify-content: flex-end; align-items: flex-end; margin-top: 1px; }
    .dob-field { width: 47%; display: flex; align-items: flex-end; }
    .history { border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; padding: 2px 4px; font-weight: bold; line-height: 1.15; }
    .history span { font-weight: normal; margin-left: 9px; white-space: nowrap; }
    .box { border: 1px solid #000; border-top: 0; padding: 4px 6px; }
    .box-title { font-weight: bold; line-height: 1.08; }
    .box-title span { font-size: 11px; }
    .hpi { min-height: 140px; }
    .history-box { min-height: 128px; }
    .exam { min-height: 138px; }
    .dx { min-height: 94px; }
    .signature-row { display: grid; grid-template-columns: auto 1fr auto 0.62fr; gap: 6px; align-items: end; margin-top: 4px; font-weight: bold; }
    .sigline { border-bottom: 1px solid #000; height: 17px; }
    .stars { margin-top: 1px; border-top: 1px solid #000; overflow: hidden; white-space: nowrap; font-size: 10px; line-height: 10px; }
    .pcp-row { margin-top: 5px; display: flex; align-items: center; gap: 12px; font-weight: bold; }
    .print-note { display: none; }
    @media print { .print-note { display: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="title">SPECIALIST CONSULTATION/FOLLOW-UP ASSESSMENT</div>
    <div class="checkline">☐ Initial Consultation&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;☐ Subsequent Management</div>

    <div class="top-row">
      <div class="field"><span class="label">Resident’s Name:</span><span class="line">${residentName}</span></div>
      <div class="field"><span class="label">Rm. #</span><span class="line">${room}</span></div>
      <div class="field"><span class="label">Date of Request:</span><span class="line">${dateOfRequest}</span></div>
    </div>

    <div class="two-row">
      <div class="field"><span class="label">Specialty:</span><span class="line">${specialty}</span></div>
      <div class="field"><span class="label">Requesting Physician:</span><span class="line">${physician}</span></div>
    </div>

    <div class="full-field"><span class="label">Reason for Consultation:</span><span class="line">${reason}</span></div>
    <div class="blank-rule"></div>

    <div class="dob-row"><div class="dob-field"><span class="label">Resident’s Date of Birth:</span><span class="line">${dob}</span></div></div>

    <div class="history">
      History: Unobtainable from resident due to:
      <span>☐ Dementia</span><span>☐ Aphasia</span><span>☐ Coma</span><span>☐ Other: ____________________</span>
    </div>

    <div class="box hpi">
      <div class="box-title">Chief Complaint/HPI: <span>(location, duration, timing, quality, severity, context, modifying factors, assoc S&amp;S or status, etc.)</span></div>
      <div class="box-title">ROS: <span>(questions/answers regarding systems related to presenting problem(s))</span></div>
    </div>

    <div class="box history-box"><div class="box-title">Past Medical/Family/Social History:</div></div>
    <div class="box exam"><div class="box-title">Physical Exam:</div></div>
    <div class="box dx"><div class="box-title">Diagnosis(es)/Recommendation(s):</div></div>

    <div class="signature-row"><span>Consultant Physician Signature:</span><span class="sigline"></span><span>Date:</span><span class="sigline"></span></div>
    <div class="stars">***********************************************************************************************************************</div>
    <div class="pcp-row"><span>Attending/Primary Care Provider</span><span>☐ Agree with above</span><span>☐ Disagree with Above (See progress note)</span></div>
    <div class="signature-row"><span>Attending/Primary Care Provider Signature:</span><span class="sigline"></span><span>Date:</span><span class="sigline"></span></div>
  </div>
</body>
</html>`;
};

export const generateOrthoConsultHTML = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility
) => {
  const base = generateRegularConsultHTML(apt, resident, facility);
  return base.replace("<title>Regular Consult</title>", "<title>Ortho Consult</title>")
    .replace("SPECIALIST CONSULTATION/FOLLOW-UP ASSESSMENT", "ORTHO CONSULTATION/FOLLOW-UP ASSESSMENT");
};

export const openConsultForm = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility
) => {
  const html = isOrthopedicSpecialty(apt.type)
    ? generateOrthoConsultHTML(apt, resident, facility)
    : generateRegularConsultHTML(apt, resident, facility);

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
};
