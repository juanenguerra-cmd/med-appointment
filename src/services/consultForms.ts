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
      font-size: 13px;
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
      font-size: 21px;
      font-weight: 900;
      letter-spacing: -0.45px;
      line-height: 1;
      margin: 1px 0 2px;
      flex: 0 0 auto;
    }

    .checkline {
      text-align: center;
      font-weight: bold;
      font-size: 11px;
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
      font-size: 12px;
    }

    .value-line {
      flex: 1;
      min-height: 14px;
      border-bottom: 1.2px solid #000;
      padding: 0 4px 1px;
      overflow: hidden;
      white-space: nowrap;
      font-size: 12px;
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
      font-size: 11.5px;
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
      flex: 1 1 auto;
      display: grid;
      grid-template-rows: 1.08fr 0.95fr 1.08fr 0.70fr;
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
      font-size: 11.5px;
      line-height: 1.08;
      font-weight: bold;
    }

    .clinical-box small {
      font-size: 9px;
      font-weight: bold;
    }

    .signature-row {
      display: grid;
      grid-template-columns: auto 1fr auto 0.52fr;
      align-items: end;
      gap: 6px;
      min-height: 18px;
      margin-top: 5px;
      font-size: 11.5px;
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
      font-size: 7px;
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
      font-size: 11.5px;
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
      margin: 0.34in;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #000;
      font-family: "Times New Roman", Times, serif;
      font-size: 12px;
      line-height: 1.15;
    }

    .sheet {
      width: 100%;
    }

    .letterhead {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.25;
      margin-bottom: 6px;
    }

    .facility-name {
      font-weight: 800;
      font-size: 13px;
      text-transform: uppercase;
    }

    .title {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      font-weight: 900;
      font-size: 18px;
      margin: 6px 0 5px;
    }

    .checkline {
      text-align: center;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      margin-bottom: 5px;
    }

    .field {
      display: flex;
      align-items: flex-end;
      min-width: 0;
      flex: 1;
    }

    .label {
      font-weight: bold;
      white-space: nowrap;
      margin-right: 4px;
    }

    .line {
      border-bottom: 1px solid #000;
      min-height: 16px;
      flex: 1;
      padding: 0 4px 1px;
      overflow: hidden;
      white-space: nowrap;
    }

    .full-line {
      border-bottom: 1px solid #000;
      height: 18px;
      margin-bottom: 4px;
      padding: 0 4px;
    }

    .section-title {
      font-weight: bold;
      text-transform: uppercase;
      margin: 10px 0 6px;
      text-align: center;
      font-size: 12px;
    }

    .reason-note {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin: 4px 0 10px;
      font-weight: bold;
    }

    .rom-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin: 4px 0 10px;
      font-weight: bold;
    }

    .signature-row {
      display: grid;
      grid-template-columns: auto 1fr auto 0.6fr;
      gap: 8px;
      align-items: end;
      margin-top: 10px;
      font-weight: bold;
    }

    .sigline {
      border-bottom: 1px solid #000;
      height: 18px;
    }

    .pcp-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 12px;
      font-weight: bold;
    }

    .footer-note {
      text-align: center;
      font-size: 11px;
      font-style: italic;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="letterhead">
      <div class="facility-name">${facilityName}</div>
      <div>${facilityAddress}</div>
      <div>${facilityPhone}${facilityFax ? " | Fax: " + facilityFax : ""}</div>
    </div>

    <div class="title">ORTHOPEDIC CONSULTATION/FOLLOW-UP ASSESSMENT</div>

    <div class="checkline">
      ☐ Initial Consultation&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;☐ Subsequent Management
    </div>

    <div class="row">
      <div class="field" style="flex:1.5;">
        <span class="label">Resident’s Name:</span>
        <span class="line">${residentName}</span>
      </div>

      <div class="field" style="flex:.45;">
        <span class="label">Rm. #:</span>
        <span class="line">${room}</span>
      </div>

      <div class="field" style="flex:.9;">
        <span class="label">Date of Request:</span>
        <span class="line">${dateOfRequest}</span>
      </div>
    </div>

    <div class="row">
      <div class="field">
        <span class="label">Requesting Physician:</span>
        <span class="line">${physician}</span>
      </div>
    </div>

    <div class="row">
      <div class="field">
        <span class="label">Resident’s Date of Birth:</span>
        <span class="line">${dob}</span>
      </div>
    </div>

    <div class="row">
      <div class="field">
        <span class="label">Diagnosis:</span>
        <span class="line">${diagnosis}</span>
      </div>
    </div>

    <div class="full-line"></div>

    <div style="font-weight:bold;margin-top:8px;">Reason for Consultation:</div>
    <div class="reason-note">
      (Indicate history such as date and type of surgery, affected limb, adjustment of meds, follow-up, etc.)
    </div>

    <div class="full-line">${reasonForConsultation}</div>
    <div class="full-line"></div>
    <div class="full-line"></div>
    <div class="full-line"></div>

    <div class="section-title">PLEASE PROVIDE US WITH THE FOLLOWING INFORMATION:</div>

    <div style="font-weight:bold;">Weight Bearing Status:</div>
    <div class="checkbox-grid">
      <span>☐ FWB</span>
      <span>☐ WBAT</span>
      <span>☐ PWB</span>
      <span>☐ TTWB</span>
      <span>☐ NWB</span>
    </div>

    <div style="font-weight:bold;">ROM:</div>
    <div class="rom-grid">
      <span>☐ Active</span>
      <span>☐ Active Assist</span>
      <span>☐ Passive</span>
    </div>

    <div class="row">
      <div class="field">
        <span class="label">Contraindications:</span>
        <span class="line"></span>
      </div>
    </div>

    <div class="row">
      <div class="field">
        <span class="label">Next Visit:</span>
        <span class="line"></span>
      </div>
    </div>

    <div style="font-weight:bold;margin-top:8px;">Special Instructions:</div>
    <div class="full-line"></div>
    <div class="full-line"></div>
    <div class="full-line"></div>

    <div class="signature-row">
      <span>Consultant Signature:</span>
      <span class="sigline"></span>
      <span>Date:</span>
      <span class="sigline"></span>
    </div>

    <div class="pcp-row">
      <span>Attending/Primary Care Provider</span>
      <span>☐ Agree with above</span>
      <span>☐ Disagree with Above (See progress note)</span>
    </div>

    <div class="signature-row">
      <span>Attending/Primary Care Provider Signature:</span>
      <span class="sigline"></span>
      <span>Date:</span>
      <span class="sigline"></span>
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
