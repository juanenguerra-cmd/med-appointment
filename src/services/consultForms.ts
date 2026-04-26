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

const getDateOfRequest = (apt: Appointment) => {
  return apt.referralDate || apt.schedulingDate || apt.date || "";
};

const getReasonForConsultation = (apt: Appointment) => {
  return (
    apt.description ||
    apt.reasonConsultation ||
    apt.consultReason ||
    apt.reasonSendOut ||
    ""
  );
};

export const isOrthopedicSpecialty = (specialty?: string) => {
  const value = String(specialty || "").trim().toLowerCase();

  return (
    value === "orthopedics" ||
    value === "orthopedic" ||
    value === "ortho" ||
    value.includes("orthopedics") ||
    value.includes("orthopedic") ||
    value.includes("ortho")
  );
};

export const getConsultFormLabel = (apt: Appointment) => {
  return isOrthopedicSpecialty(apt.type) ? "ORTHO CONSULT" : "REGULAR CONSULT";
};

export const generateRegularConsultHTML = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility,
) => {
  const facilityName = escapeHtml(facility?.name || "FACILITY NAME");
  const facilityAddress = escapeHtml(facility?.address || "Facility Address");
  const facilityPhone = escapeHtml(facility?.phone || "Facility Number");

  const residentName = escapeHtml(apt.residentName || resident?.name || "");
  const room = escapeHtml(apt.roomNumber || resident?.roomNumber || "");
  const dateOfRequest = escapeHtml(getDateOfRequest(apt));
  const specialty = escapeHtml(apt.type || "");
  const requestingPhysician = escapeHtml(getRequestingPhysician(apt, resident));
  const reason = escapeHtml(getReasonForConsultation(apt));
  const dob = escapeHtml(getDob(resident));

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Regular Consult</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 8.5in;
      height: 11in;
      background: #ffffff;
      color: #000000;
      font-family: "Times New Roman", Times, serif;
      font-size: 12.2px;
      line-height: 1.08;
    }

    body {
      overflow: hidden;
    }

    .sheet {
      width: 8.5in;
      height: 11in;
      padding: 0.16in 0.30in 0.12in 0.30in;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #ffffff;
    }

    .letterhead {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.05;
      margin: 0 0 2px;
      flex: 0 0 auto;
    }

    .facility-name {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .facility-details {
      font-size: 8.5px;
      font-weight: 600;
    }

    .title {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: -0.45px;
      line-height: 1;
      margin: 1px 0 2px;
      flex: 0 0 auto;
    }

    .checkline {
      text-align: center;
      font-weight: bold;
      font-size: 13px;
      line-height: 1;
      margin-bottom: 5px;
      flex: 0 0 auto;
    }

    .form-row {
      display: grid;
      align-items: end;
      column-gap: 5px;
      min-height: 16px;
      margin-bottom: 2px;
      flex: 0 0 auto;
    }

    .row-1 {
      grid-template-columns: 1.45fr 0.45fr 0.95fr;
    }

    .row-2 {
      grid-template-columns: 1.05fr 1fr;
    }

    .row-3 {
      grid-template-columns: 1fr;
    }

    .field {
      display: flex;
      align-items: end;
      min-width: 0;
    }

    .label {
      font-weight: bold;
      white-space: nowrap;
      margin-right: 3px;
      font-size: 13px;
    }

    .value-line {
      flex: 1;
      min-height: 14px;
      border-bottom: 1.2px solid #000;
      padding: 0 4px 1px;
      overflow: hidden;
      white-space: nowrap;
      font-size: 13px;
    }

    .double-blank {
      height: 24px;
      border-top: 1.2px solid #000;
      border-bottom: 1.2px solid #000;
      margin: 2px 0 2px;
      flex: 0 0 auto;
    }

    .dob-row {
      display: flex;
      justify-content: flex-end;
      min-height: 16px;
      margin-bottom: 2px;
      flex: 0 0 auto;
    }

    .dob-row .field {
      width: 315px;
    }

    .history-row {
      display: flex;
      align-items: center;
      gap: 5px;
      min-height: 16px;
      margin-bottom: 2px;
      font-size: 13px;
      font-weight: bold;
      white-space: nowrap;
      flex: 0 0 auto;
    }

    .history-row span {
      font-weight: bold;
    }

    .other-line {
      display: inline-block;
      width: 120px;
      height: 10px;
      border-bottom: 1.2px solid #000;
    }

    .clinical-area {
      flex: 0 0 7.5in;
      display: grid;
      grid-template-rows: 1.05fr 0.95fr 1.05fr 0.70fr;
      border: 1.2px solid #000;
      border-bottom: 0;
      min-height: 0;
    }

    .clinical-box {
      border-bottom: 1.2px solid #000;
      padding: 4px 6px;
      min-height: 0;
    }

    .clinical-box h4 {
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.08;
      font-weight: bold;
    }

    .clinical-box small {
      font-size: 13px;
      font-weight: bold;
    }

    .signature-row {
      display: grid;
      grid-template-columns: auto 1fr auto 0.52fr;
      align-items: end;
      gap: 6px;
      min-height: 18px;
      margin-top: 5px;
      font-size: 12px;
      font-weight: bold;
      flex: 0 0 auto;
    }

    .sig-line {
      height: 14px;
      border-bottom: 1.2px solid #000;
    }

    .stars {
      height: 8px;
      line-height: 8px;
      overflow: hidden;
      white-space: nowrap;
      font-size: 10px;
      font-weight: bold;
      margin-top: 1px;
      flex: 0 0 auto;
    }

    .pcp-row {
      display: flex;
      align-items: center;
      gap: 14px;
      min-height: 17px;
      margin-top: 3px;
      font-size: 12px;
      font-weight: bold;
      white-space: nowrap;
      flex: 0 0 auto;
    }

    @media screen {
      body {
        background: #f5f5f5;
      }

      .sheet {
        margin: 0 auto;
        background: #ffffff;
      }
    }

    @media print {
      html,
      body {
        width: 8.5in;
        height: 11in;
      }

      .sheet {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="letterhead">
      <div class="facility-name">${facilityName}</div>
      <div class="facility-details">${facilityAddress}${facilityPhone ? " | " + facilityPhone : ""}</div>
    </div>

    <div class="title">SPECIALIST CONSULTATION/FOLLOW-UP ASSESSMENT</div>

    <div class="checkline">
      ☐ Initial Consultation
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      ☐ Subsequent Management
    </div>

    <div class="form-row row-1">
      <div class="field">
        <span class="label">Resident’s Name:</span>
        <span class="value-line">${residentName}</span>
      </div>
      <div class="field">
        <span class="label">Rm. #</span>
        <span class="value-line">${room}</span>
      </div>
      <div class="field">
        <span class="label">Date of Request:</span>
        <span class="value-line">${dateOfRequest}</span>
      </div>
    </div>

    <div class="form-row row-2">
      <div class="field">
        <span class="label">Specialty:</span>
        <span class="value-line">${specialty}</span>
      </div>
      <div class="field">
        <span class="label">Requesting Physician:</span>
        <span class="value-line">${requestingPhysician}</span>
      </div>
    </div>

    <div class="form-row row-3">
      <div class="field">
        <span class="label">Reason for Consultation:</span>
        <span class="value-line">${reason}</span>
      </div>
    </div>

    <div class="double-blank"></div>

    <div class="dob-row">
      <div class="field">
        <span class="label">Resident’s Date of Birth:</span>
        <span class="value-line">${dob}</span>
      </div>
    </div>

    <div class="history-row">
      <span>History: Unobtainable from resident due to:</span>
      <span>☐ Dementia</span>
      <span>☐Aphasia</span>
      <span>☐Coma</span>
      <span>☐Other:</span><span class="other-line"></span>
    </div>

    <div class="clinical-area">
      <div class="clinical-box">
        <h4>
          Chief Complaint/HPI:
          <small>(location, duration, timing, quality, severity, context, modifying factors, assoc, S&amp;S or status, etc.)</small>
        </h4>
        <h4>
          ROS:
          <small>(questions/answers regarding systems related to presenting problem(s))</small>
        </h4>
      </div>

      <div class="clinical-box">
        <h4>Past Medical/Family/Social History:</h4>
      </div>

      <div class="clinical-box">
        <h4>Physical Exam:</h4>
      </div>

      <div class="clinical-box">
        <h4>Diagnosis(es)/Recommendation(s):</h4>
      </div>
    </div>

    <div class="signature-row">
      <span>Consultant Physician Signature:</span>
      <span class="sig-line"></span>
      <span>Date:</span>
      <span class="sig-line"></span>
    </div>

    <div class="stars">
      ********************************************************************************************************************************************************************************
    </div>

    <div class="pcp-row">
      <span>Attending/Primary Care Provider</span>
      <span>☐ Agree with above</span>
      <span>☐ Disagree with Above (See progress note)</span>
    </div>

    <div class="signature-row">
      <span>Attending/Primary Care Provider Signature:</span>
      <span class="sig-line"></span>
      <span>Date:</span>
      <span class="sig-line"></span>
    </div>
  </div>
</body>
</html>`;
};

export const generateOrthoConsultHTML = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility,
) => {
  const facilityName = escapeHtml(facility?.name || "FACILITY NAME");
  const facilityAddress = escapeHtml(facility?.address || "Facility Address");
  const facilityPhone = escapeHtml(facility?.phone || "Facility Number");
  const facilityFax = escapeHtml((facility as any)?.fax || "");

  const residentName = escapeHtml(apt.residentName || resident?.name || "");
  const room = escapeHtml(apt.roomNumber || resident?.roomNumber || "");
  const dateOfRequest = escapeHtml(getDateOfRequest(apt));
  const physician = escapeHtml(getRequestingPhysician(apt, resident));
  const dob = escapeHtml(getDob(resident));
  const diagnosis = escapeHtml(resident?.diagnosis || "");
  const reasonForConsultation = escapeHtml(
    apt.reasonConsultation?.trim() ||
      apt.consultReason?.trim() ||
      apt.description?.trim() ||
      apt.reasonSendOut?.trim() ||
      "",
  );

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ortho Consult</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 8.5in;
      height: 11in;
      background: #ffffff;
      color: #000000;
      font-family: "Times New Roman", Times, serif;
      font-size: 13px;
      line-height: 1.15;
    }

    body {
      overflow: hidden;
    }

    .sheet {
      width: 8.5in;
      height: 11in;
      padding: 0.18in 0.45in 0.18in 0.45in;
      background: #ffffff;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .letterhead {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.05;
      margin-bottom: 2px;
      flex: 0 0 auto;
    }

    .facility-name {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .facility-details {
      font-size: 10px;
      font-weight: 600;
    }

    .title {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.35px;
      line-height: 1;
      margin: 2px 0 4px;
      flex: 0 0 auto;
    }

    .checkline {
      display: flex;
      justify-content: center;
      gap: 115px;
      font-weight: bold;
      font-size: 13px;
      line-height: 1;
      margin-bottom: 8px;
      flex: 0 0 auto;
    }

    .form-row {
      display: grid;
      align-items: end;
      column-gap: 7px;
      min-height: 22px;
      margin-bottom: 3px;
      flex: 0 0 auto;
    }

    .row-1 {
      grid-template-columns: 1.35fr 0.45fr 0.95fr;
    }

    .row-2 {
      grid-template-columns: 1.12fr 0.90fr;
    }

    .row-3 {
      grid-template-columns: 1fr;
    }

    .field {
      display: flex;
      align-items: end;
      min-width: 0;
    }

    .label {
      font-weight: bold;
      white-space: nowrap;
      margin-right: 4px;
      font-size: 13.5px;
    }

    .value-line {
      flex: 1;
      min-height: 17px;
      border-bottom: 1.2px solid #000;
      padding: 0 5px 1px;
      overflow: hidden;
      white-space: nowrap;
      font-size: 13.5px;
    }

    .long-rule {
      height: 22px;
      border-bottom: 1.2px solid #000;
      flex: 0 0 auto;
    }

    .reason-label {
      font-weight: bold;
      font-size: 13.5px;
      margin-top: 8px;
      line-height: 1.12;
      flex: 0 0 auto;
    }

    .reason-note {
      font-weight: bold;
      font-size: 12.5px;
      line-height: 1.1;
      margin-bottom: 3px;
      flex: 0 0 auto;
    }

    .write-line {
      border-bottom: 1.2px solid #000;
      min-height: 21px;
      padding: 0 4px 1px;
      font-size: 13.5px;
      flex: 0 0 auto;
    }

    .section-title {
      text-align: left;
      font-weight: bold;
      letter-spacing: 1.8px;
      font-size: 15px;
      margin: 16px 0 14px;
      flex: 0 0 auto;
    }

    .wb-section {
      margin-left: 14px;
      flex: 0 0 auto;
    }

    .subhead {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .check-stack {
      margin-left: 72px;
      display: grid;
      grid-template-columns: 18px 80px;
      row-gap: 4px;
      align-items: center;
      font-weight: bold;
      font-size: 14px;
      line-height: 1;
    }

    .rom-section {
      margin-left: 42px;
      margin-top: 26px;
      flex: 0 0 auto;
    }

    .rom-section .check-stack {
      margin-left: 42px;
      grid-template-columns: 18px 120px;
    }

    .line-row {
      display: flex;
      align-items: end;
      gap: 4px;
      min-height: 24px;
      margin-top: 10px;
      font-weight: bold;
      font-size: 13.5px;
      flex: 0 0 auto;
    }

    .fill-line {
      flex: 1;
      border-bottom: 1.2px solid #000;
      height: 17px;
    }

    .instructions {
      margin-top: 8px;
      flex: 0 0 auto;
    }

    .instructions-title {
      font-weight: bold;
      font-size: 13.5px;
      margin-bottom: 2px;
    }

    .instruction-line {
      border-bottom: 1.2px solid #000;
      height: 22px;
    }

    .push-space {
  flex: 0 0 0.9in;
  min-height: 0;
}

    .signature-row {
      display: grid;
      grid-template-columns: auto 1fr auto 0.42fr;
      align-items: end;
      column-gap: 8px;
      min-height: 22px;
      margin-top: 6px;
      font-size: 13.5px;
      font-weight: bold;
      flex: 0 0 auto;
    }

    .sig-line {
      height: 17px;
      border-bottom: 1.2px solid #000;
    }

    .long-divider {
      border-bottom: 2px solid #000;
      height: 15px;
      margin: 2px 0 8px;
      flex: 0 0 auto;
    }

    .pcp-row {
      display: flex;
      align-items: center;
      gap: 18px;
      min-height: 20px;
      font-size: 13px;
      font-weight: bold;
      white-space: nowrap;
      flex: 0 0 auto;
    }

    .footer-note {
      text-align: center;
      font-size: 13px;
      margin-top: -2px;
      flex: 0 0 auto;
    }

    @media screen {
      body {
        background: #f5f5f5;
      }

      .sheet {
        margin: 0 auto;
      }
    }

    @media print {
      html,
      body {
        width: 8.5in;
        height: 11in;
      }

      .sheet {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="letterhead">
      <div class="facility-name">${facilityName}</div>
      <div class="facility-details">${facilityAddress}${facilityPhone ? " | " + facilityPhone : ""}${facilityFax ? " | Fax: " + facilityFax : ""}</div>
    </div>

    <div class="title">ORTHOPEDIC CONSULTATION/FOLLOW-UP ASSESSMENT</div>

    <div class="checkline">
      <span>☐ Initial Consultation</span>
      <span>☐ Subsequent Management</span>
    </div>

    <div class="form-row row-1">
      <div class="field">
        <span class="label">Resident’s Name:</span>
        <span class="value-line">${residentName}</span>
      </div>
      <div class="field">
        <span class="label">Rm. #:</span>
        <span class="value-line">${room}</span>
      </div>
      <div class="field">
        <span class="label">Date of Request:</span>
        <span class="value-line">${dateOfRequest}</span>
      </div>
    </div>

    <div class="form-row row-2">
      <div class="field">
        <span class="label">Requesting Physician:</span>
        <span class="value-line">${physician}</span>
      </div>
      <div class="field">
        <span class="label">Resident’s Date of Birth:</span>
        <span class="value-line">${dob}</span>
      </div>
    </div>

    <div class="form-row row-3">
      <div class="field">
        <span class="label">Diagnosis:</span>
        <span class="value-line">${diagnosis}</span>
      </div>
    </div>

    <div class="long-rule"></div>

    <div class="reason-label">
      Reason for Consultation:
      <span style="font-weight:bold;">
        (Indicate history such as date and type of surgery, affected limb, adjustment of
      </span>
    </div>
    <div class="reason-note">meds, follow-up, etc.)</div>

    <div class="write-line">${reasonForConsultation}</div>
    <div class="write-line"></div>
    <div class="write-line"></div>

    <div class="section-title">PLEASE PROVIDE US WITH THE FOLLOWING INFORMATION:</div>

    <div class="wb-section">
      <div class="subhead">Weight Bearing Status:</div>
      <div class="check-stack">
        <span>☐</span><span>FWB</span>
        <span>☐</span><span>WBAT</span>
        <span>☐</span><span>PWB</span>
        <span>☐</span><span>TTWB</span>
        <span>☐</span><span>NWB</span>
      </div>
    </div>

    <div class="rom-section">
      <div class="subhead">ROM:</div>
      <div class="check-stack">
        <span>☐</span><span>Active</span>
        <span>☐</span><span>Active Assist</span>
        <span>☐</span><span>Passive</span>
      </div>
    </div>

    <div class="line-row">
      <span>Contraindications:</span>
      <span class="fill-line"></span>
    </div>

    <div class="line-row">
      <span>Next Visit:</span>
      <span class="fill-line"></span>
    </div>

    <div class="instructions">
      <div class="instructions-title">Special Instructions:</div>
      <div class="instruction-line"></div>
      <div class="instruction-line"></div>
      <div class="instruction-line"></div>
    </div>

    <div class="push-space"></div>

    <div class="signature-row">
      <span>Consultant Signature:</span>
      <span class="sig-line"></span>
      <span>Date:</span>
      <span class="sig-line"></span>
    </div>

    <div class="long-divider"></div>

    <div class="pcp-row">
      <span>Attending/Primary Care Provider</span>
      <span>☐Agree with above</span>
      <span>☐Disagree with Above (See progress note)</span>
    </div>

    <div class="signature-row">
      <span>Attending/Primary Care Provider Signature:</span>
      <span class="sig-line"></span>
      <span>Date:</span>
      <span class="sig-line"></span>
    </div>

    <div class="footer-note">(Form to be submitted to the Clinic Coordinator or RN Supervisor)</div>
  </div>
</body>
</html>`;
};

export const openConsultForm = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility,
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
