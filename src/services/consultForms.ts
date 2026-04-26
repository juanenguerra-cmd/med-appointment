import { Appointment, Resident, Facility } from "../types";

const escapeHtml = (value?: string | number | null) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getDob = (resident?: Resident) => {
  const dobMatch = resident?.notes?.match(/DOB:\s*([^|\n]+)/i);
  return dobMatch?.[1]?.trim() || "";
};

const getRequestingPhysician = (apt: Appointment, resident?: Resident) => {
  return resident?.doctor || apt.providerName || "";
};

export const isOrthopedicSpecialty = (specialty?: string) => {
  const value = String(specialty || "").trim().toLowerCase();
  return value === "orthopedics" || value === "orthopedic" || value.includes("ortho");
};

export const getConsultFormLabel = (apt: Appointment) => {
  return isOrthopedicSpecialty(apt.type) ? "ORTHO CONSULT" : "REGULAR CONSULT";
};

export const generateRegularConsultHTML = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility
) => {
  const title = "SPECIALIST CONSULTATION/FOLLOW-UP ASSESSMENT";
  const dob = escapeHtml(getDob(resident));
  const reason = escapeHtml(apt.description || apt.reasonConsultation || apt.consultReason || "");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Regular Consult</title>
  <style>
    @page { size: letter portrait; margin: 0.35in; }
    * { box-sizing: border-box; }
    body { font-family: "Times New Roman", serif; font-size: 12px; color: #000; margin: 0; }
    .title { text-align:center; font-weight:bold; font-size:18px; margin-bottom:8px; }
    .row { display:flex; gap:8px; margin-bottom:4px; align-items:flex-end; }
    .field { flex:1; border-bottom:1px solid #000; min-height:18px; padding:0 4px; }
    .label { font-weight:bold; white-space:nowrap; }
    .box { border:1px solid #000; min-height:110px; padding:5px; margin-top:0; }
    .box.small { min-height:85px; }
    .sig { display:flex; gap:10px; margin-top:8px; align-items:end; }
    .line { flex:1; border-bottom:1px solid #000; height:18px; }
  </style>
</head>
<body>
  <div class="title">${title}</div>
  <div style="text-align:center;font-weight:bold;">☐ Initial Consultation &nbsp;&nbsp;&nbsp;&nbsp; ☐ Subsequent Management</div>
  <div class="row">
    <span class="label">Resident’s Name:</span><span class="field">${escapeHtml(apt.residentName || resident?.name || "")}</span>
    <span class="label">Rm. #</span><span class="field">${escapeHtml(apt.roomNumber || resident?.roomNumber || "")}</span>
    <span class="label">Date of Request:</span><span class="field">${escapeHtml(apt.referralDate || apt.schedulingDate || apt.date || "")}</span>
  </div>
  <div class="row">
    <span class="label">Specialty:</span><span class="field">${escapeHtml(apt.type || "")}</span>
    <span class="label">Requesting Physician:</span><span class="field">${escapeHtml(getRequestingPhysician(apt, resident))}</span>
  </div>
  <div class="row"><span class="label">Reason for Consultation:</span><span class="field">${reason}</span></div>
  <div class="row" style="justify-content:flex-end;"><span class="label">Resident’s Date of Birth:</span><span class="field" style="max-width:220px;">${dob}</span></div>
  <div style="border:1px solid #000; padding:4px; font-weight:bold;">History: Unobtainable from resident due to: ☐ Dementia ☐ Aphasia ☐ Coma ☐ Other: ____________________</div>
  <div class="box"><b>Chief Complaint/HPI:</b><br/><b>ROS:</b></div>
  <div class="box small"><b>Past Medical/Family/Social History:</b></div>
  <div class="box"><b>Physical Exam:</b></div>
  <div class="box small"><b>Diagnosis(es)/Recommendation(s):</b></div>
  <div class="sig"><b>Consultant Physician Signature:</b><span class="line"></span><b>Date:</b><span class="line"></span></div>
  <hr/>
  <div style="font-weight:bold;margin-top:6px;">Attending/Primary Care Provider ☐ Agree with above &nbsp;&nbsp; ☐ Disagree with Above (See progress note)</div>
  <div class="sig"><b>Attending/Primary Care Provider Signature:</b><span class="line"></span><b>Date:</b><span class="line"></span></div>
</body>
</html>`;
};

export const generateOrthoConsultHTML = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility
) => {
  const facilityName = escapeHtml(facility?.name || "");
  const facilityAddress = escapeHtml(facility?.address || "");
  const facilityPhone = escapeHtml(facility?.phone || "");
  const facilityFax = escapeHtml((facility as any)?.fax || "");
  const residentName = escapeHtml(apt.residentName || resident?.name || "");
  const room = escapeHtml(apt.roomNumber || resident?.roomNumber || "");
  const dateOfRequest = escapeHtml(apt.referralDate || apt.schedulingDate || apt.date || "");
  const physician = escapeHtml(getRequestingPhysician(apt, resident));
  const dob = escapeHtml(getDob(resident));
  const diagnosis = escapeHtml(resident?.diagnosis || "");
  const reasonForConsultation = escapeHtml(
    apt.reasonConsultation?.trim() || apt.consultReason?.trim() || ""
  );

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ortho Consult</title>
  <style>
    @page { size: Letter portrait; margin: 0.35in; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; font-family: "Times New Roman", Times, serif; font-size: 12px; line-height: 1.15; }
    .sheet { width: 100%; }
    .letterhead { text-align: center; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.25; margin-bottom: 6px; }
    .facility-name { font-weight: 800; font-size: 13px; text-transform: uppercase; }
    .title { text-align: center; font-family: Arial, Helvetica, sans-serif; font-weight: 900; font-size: 18px; margin: 6px 0 5px; }
    .checkline { text-align: center; font-weight: bold; margin-bottom: 8px; }
    .row { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 5px; }
    .field { display: flex; align-items: flex-end; min-width: 0; flex: 1; }
    .label { font-weight: bold; white-space: nowrap; margin-right: 4px; }
    .line { border-bottom: 1px solid #000; min-height: 16px; flex: 1; padding: 0 4px 1px; overflow: hidden; white-space: nowrap; }
    .full-line { border-bottom: 1px solid #000; height: 18px; margin-bottom: 4px; padding: 0 4px; }
    .section-title { font-weight: bold; text-transform: uppercase; margin: 10px 0 6px; text-align: center; font-size: 12px; }
    .reason-note { font-size: 11px; font-weight: bold; margin-bottom: 2px; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 4px 0 10px; font-weight: bold; }
    .rom-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 4px 0 10px; font-weight: bold; }
    .signature-row { display: grid; grid-template-columns: auto 1fr auto 0.6fr; gap: 8px; align-items: end; margin-top: 10px; font-weight: bold; }
    .sigline { border-bottom: 1px solid #000; height: 18px; }
    .pcp-row { display: flex; align-items: center; gap: 16px; margin-top: 12px; font-weight: bold; }
    .footer-note { text-align: center; font-size: 11px; font-style: italic; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="letterhead"><div class="facility-name">${facilityName}</div><div>${facilityAddress}</div><div>${facilityPhone}${facilityFax ? " | Fax: " + facilityFax : ""}</div></div>
    <div class="title">ORTHOPEDIC CONSULTATION/FOLLOW-UP ASSESSMENT</div>
    <div class="checkline">☐ Initial Consultation&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;☐ Subsequent Management</div>
    <div class="row"><div class="field" style="flex:1.5;"><span class="label">Resident’s Name:</span><span class="line">${residentName}</span></div><div class="field" style="flex:.45;"><span class="label">Rm. #:</span><span class="line">${room}</span></div><div class="field" style="flex:.9;"><span class="label">Date of Request:</span><span class="line">${dateOfRequest}</span></div></div>
    <div class="row"><div class="field"><span class="label">Requesting Physician:</span><span class="line">${physician}</span></div></div>
    <div class="row"><div class="field"><span class="label">Resident’s Date of Birth:</span><span class="line">${dob}</span></div></div>
    <div class="row"><div class="field"><span class="label">Diagnosis:</span><span class="line">${diagnosis}</span></div></div>
    <div class="full-line"></div>
    <div style="font-weight:bold;margin-top:8px;">Reason for Consultation:</div>
    <div class="reason-note">(Indicate history such as date and type of surgery, affected limb, adjustment of meds, follow-up, etc.)</div>
    <div class="full-line">${reasonForConsultation}</div><div class="full-line"></div><div class="full-line"></div><div class="full-line"></div>
    <div class="section-title">PLEASE PROVIDE US WITH THE FOLLOWING INFORMATION:</div>
    <div style="font-weight:bold;">Weight Bearing Status:</div>
    <div class="checkbox-grid"><span>☐ FWB</span><span>☐ WBAT</span><span>☐ PWB</span><span>☐ TTWB</span><span>☐ NWB</span></div>
    <div style="font-weight:bold;">ROM:</div>
    <div class="rom-grid"><span>☐ Active</span><span>☐ Active Assist</span><span>☐ Passive</span></div>
    <div class="row"><div class="field"><span class="label">Contraindications:</span><span class="line"></span></div></div>
    <div class="row"><div class="field"><span class="label">Next Visit:</span><span class="line"></span></div></div>
    <div style="font-weight:bold;margin-top:8px;">Special Instructions:</div><div class="full-line"></div><div class="full-line"></div><div class="full-line"></div>
    <div class="signature-row"><span>Consultant Signature:</span><span class="sigline"></span><span>Date:</span><span class="sigline"></span></div>
    <div class="pcp-row"><span>Attending/Primary Care Provider</span><span>☐ Agree with above</span><span>☐ Disagree with Above (See progress note)</span></div>
    <div class="signature-row"><span>Attending/Primary Care Provider Signature:</span><span class="sigline"></span><span>Date:</span><span class="sigline"></span></div>
    <div class="footer-note">(Form to be submitted to the Clinic Coordinator or RN Supervisor)</div>
  </div>
</body>
</html>`;
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
  setTimeout(() => win.print(), 250);
};
