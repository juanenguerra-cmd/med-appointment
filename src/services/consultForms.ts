import { Appointment, Resident, Facility } from "../types";

export const isOrthopedicSpecialty = (specialty?: string) => {
  const value = String(specialty || "").trim().toLowerCase();
  return value.includes("ortho") || value.includes("orthopedic") || value.includes("orthopaedic");
};

export const getConsultFormLabel = (apt: Appointment) => {
  return isOrthopedicSpecialty(apt.type) ? "ORTHO CONSULT" : "REGULAR CONSULT";
};

export const openConsultForm = (
  apt: Appointment,
  resident?: Resident,
  facility?: Facility
) => {
  const title = isOrthopedicSpecialty(apt.type)
    ? "ORTHO CONSULTATION/FOLLOW-UP ASSESSMENT"
    : "SPECIALIST CONSULTATION/FOLLOW-UP ASSESSMENT";

  const dobMatch = resident?.notes?.match(/DOB:\s*([^|\n]+)/i);
  const dob = dobMatch?.[1]?.trim() || "";

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: letter portrait; margin: 0.35in; }
          body { font-family: "Times New Roman", serif; font-size: 12px; color: #000; }
          .title { text-align:center; font-weight:bold; font-size:18px; margin-bottom:8px; }
          .row { display:flex; gap:8px; margin-bottom:4px; }
          .field { flex:1; border-bottom:1px solid #000; min-height:18px; }
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
          <span class="label">Resident’s Name:</span><span class="field">${apt.residentName || resident?.name || ""}</span>
          <span class="label">Rm. #</span><span class="field">${apt.roomNumber || resident?.roomNumber || ""}</span>
          <span class="label">Date of Request:</span><span class="field">${apt.referralDate || apt.schedulingDate || apt.date || ""}</span>
        </div>

        <div class="row">
          <span class="label">Specialty:</span><span class="field">${apt.type || ""}</span>
          <span class="label">Requesting Physician:</span><span class="field">${resident?.doctor || apt.providerName || ""}</span>
        </div>

        <div class="row">
          <span class="label">Reason for Consultation:</span><span class="field">${apt.description || apt.reasonConsultation || apt.consultReason || ""}</span>
        </div>

        <div class="row" style="justify-content:flex-end;">
          <span class="label">Resident’s Date of Birth:</span><span class="field" style="max-width:220px;">${dob}</span>
        </div>

        <div style="border:1px solid #000; padding:4px; font-weight:bold;">
          History: Unobtainable from resident due to:
          ☐ Dementia ☐ Aphasia ☐ Coma ☐ Other: ____________________
        </div>

        <div class="box">
          <b>Chief Complaint/HPI:</b><br/>
          <b>ROS:</b>
        </div>
        <div class="box small"><b>Past Medical/Family/Social History:</b></div>
        <div class="box"><b>Physical Exam:</b></div>
        <div class="box small"><b>Diagnosis(es)/Recommendation(s):</b></div>

        <div class="sig">
          <b>Consultant Physician Signature:</b><span class="line"></span>
          <b>Date:</b><span class="line"></span>
        </div>

        <hr/>

        <div style="font-weight:bold;margin-top:6px;">
          Attending/Primary Care Provider
          ☐ Agree with above &nbsp;&nbsp; ☐ Disagree with Above (See progress note)
        </div>

        <div class="sig">
          <b>Attending/Primary Care Provider Signature:</b><span class="line"></span>
          <b>Date:</b><span class="line"></span>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
};