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
    margin: 0.25in 0.35in;
  }

  html, body {
    width: 8.5in;
    height: 11in;
    margin: 0;
    padding: 0;
    font-family: "Times New Roman", serif;
    font-size: 11.5px;
    line-height: 1.1;
    color: #000;
  }

  .sheet {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* HEADER */
  .letterhead {
    text-align: center;
    font-family: Arial, sans-serif;
  }

  .facility-name {
    font-size: 13px;
    font-weight: 900;
  }

  .facility-details {
    font-size: 9px;
  }

  .title {
    text-align: center;
    font-family: Arial, sans-serif;
    font-size: 20px;
    font-weight: 900;
    margin-top: 4px;
  }

  .checkline {
    text-align: center;
    font-size: 11px;
    margin-bottom: 6px;
  }

  /* TOP FIELDS */
  .top-row {
    display: flex;
    gap: 6px;
    margin-bottom: 3px;
  }

  .field {
    display: flex;
    flex: 1;
    align-items: flex-end;
  }

  .label {
    font-weight: bold;
    margin-right: 4px;
    white-space: nowrap;
  }

  .line {
    flex: 1;
    border-bottom: 1px solid #000;
    min-height: 16px;
  }

  .blank-rule {
    border-bottom: 1px solid #000;
    margin: 4px 0;
  }

  .dob-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 4px;
  }

  .history-row {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  /* 🔥 MAIN FIX — FLEX GRID THAT FILLS PAGE */
  .clinical-grid {
    flex: 1;
    display: grid;
    grid-template-rows: 1.2fr 1fr 1.2fr 0.8fr;
    border: 1px solid #000;
    border-bottom: none;
  }

  .box {
    border-bottom: 1px solid #000;
    padding: 6px;
  }

  .box h4 {
    margin: 0;
    font-size: 11px;
    font-weight: bold;
  }

  .box small {
    font-size: 9px;
  }

  /* FOOTER */
  .signature-row {
    display: grid;
    grid-template-columns: auto 1fr auto 0.5fr;
    gap: 6px;
    margin-top: 6px;
    font-size: 11px;
    font-weight: bold;
  }

  .sig-line {
    border-bottom: 1px solid #000;
    height: 16px;
  }

  .pcp-row {
    display: flex;
    gap: 16px;
    margin-top: 6px;
    font-size: 11px;
    font-weight: bold;
  }

  .stars {
    font-size: 8px;
    margin-top: 2px;
  }

  @media print {
    .sheet {
      height: 100%;
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

    <div class="top-row">
      <div class="field" style="flex: 1.45;">
        <span class="label">Resident’s Name:</span>
        <span class="line">${residentName}</span>
      </div>

      <div class="field" style="flex: 0.38;">
        <span class="label">Rm. #</span>
        <span class="line">${room}</span>
      </div>

      <div class="field" style="flex: 0.82;">
        <span class="label">Date of Request:</span>
        <span class="line">${dateOfRequest}</span>
      </div>
    </div>

    <div class="top-row">
      <div class="field" style="flex: 1;">
        <span class="label">Specialty:</span>
        <span class="line">${specialty}</span>
      </div>

      <div class="field" style="flex: 1;">
        <span class="label">Requesting Physician:</span>
        <span class="line">${requestingPhysician}</span>
      </div>
    </div>

    <div class="top-row">
      <div class="field" style="flex: 1;">
        <span class="label">Reason for Consultation:</span>
        <span class="line">${reason}</span>
      </div>
    </div>

    <div class="blank-rule"></div>

    <div class="dob-row">
      <div class="field">
        <span class="label">Resident’s Date of Birth:</span>
        <span class="line">${dob}</span>
      </div>
    </div>

    <div class="history-row">
      <span>History: Unobtainable from resident due to:</span>
      <span>☐ Dementia</span>
      <span>☐Aphasia</span>
      <span>☐Coma</span>
      <span class="history-other">☐Other:<span class="history-other-line"></span></span>
    </div>

    <div class="box hpi-box">
      <h4>
        Chief Complaint/HPI:
        <small>(location, duration, timing, quality, severity, context, modifying factors, assoc, S&amp;S or status, etc.)</small>
      </h4>
      <h4>
        ROS:
        <small>(questions/answers regarding systems related to presenting problem(s))</small>
      </h4>
    </div>

    <div class="box history-box">
      <h4>Past Medical/Family/Social History:</h4>
    </div>

    <div class="box exam-box">
      <h4>Physical Exam:</h4>
    </div>

    <div class="box dx-box last">
      <h4>Diagnosis(es)/Recommendation(s):</h4>
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
