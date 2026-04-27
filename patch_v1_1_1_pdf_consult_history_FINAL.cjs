const fs = require("fs");
const path = require("path");

const root = process.cwd();
const pdfPath = path.join(root, "src", "services", "pdfService.ts");
const consultPath = path.join(root, "src", "services", "consultForms.ts");
const versionPath = path.join(root, "src", "components", "VersionHistoryPanel.tsx");

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}
function write(file, text) {
  fs.writeFileSync(file, text, "utf8");
}
function once(text, search, replace, label) {
  if (!text.includes(search)) {
    console.warn(`SKIP: ${label} anchor not found or already patched.`);
    return text;
  }
  return text.replace(search, replace);
}
function insertAfter(text, anchor, insertion, label) {
  if (text.includes(insertion.trim().slice(0, 60))) {
    console.log(`OK: ${label} already present.`);
    return text;
  }
  if (!text.includes(anchor)) throw new Error(`Anchor not found: ${label}`);
  return text.replace(anchor, anchor + insertion);
}

function patchPdf() {
  let text = read(pdfPath);

  const importAnchor = 'import { Appointment, Resident, Facility } from "../types";\n';
  const helpers = `
const formatTimeAMPMForPdf = (value?: string | null) => {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/\\b(am|pm)\\b/i.test(raw)) return raw.toUpperCase();

  const match = raw.match(/^(\\d{1,2})(?::(\\d{2}))?/);
  if (!match) return raw;

  let hour = Number(match[1]);
  const minute = match[2] || "00";
  if (Number.isNaN(hour)) return raw;

  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return \`\${hour}:\${minute} \${suffix}\`;
};

const getTransportCompanyDisplay = (appointment: Appointment) => {
  const name =
    appointment.transportCompanyOther ||
    appointment.transportCompany ||
    "";
  return String(name || "").trim();
};

const getTransportPhoneDisplay = (appointment: Appointment) => {
  return String(appointment.transportCompanyPhone || "").trim();
};

const getEscortDisplay = (appointment: Appointment) => {
  const escortName = String(appointment.escortDetails || appointment.escort || "").trim();
  const escortPhone = String(appointment.escortPhone || "").trim();

  if (!escortName && !escortPhone) return "—";
  if (escortName && escortPhone) return \`\${escortName}\\nPhone: \${escortPhone}\`;
  if (escortPhone) return \`Phone: \${escortPhone}\`;
  return escortName;
};

`;
  text = insertAfter(text, importAnchor, helpers, "PDF helper functions");

  text = once(
    text,
    '["Date & Time", `${appointment.date} at ${appointment.time}`],',
    '["Date & Time", `${appointment.date} at ${formatTimeAMPMForPdf(appointment.time)}`],',
    "appointment PDF date/time AMPM"
  );

  text = once(
    text,
    'return type ? `${type} ${apt.transportCompany ? `(${apt.transportCompany})` : \'\'} ` : "";',
    'return type ? `${type} ${getTransportCompanyDisplay(apt) ? `(${getTransportCompanyDisplay(apt)}${getTransportPhoneDisplay(apt) ? ` / ${getTransportPhoneDisplay(apt)}` : ""})` : ""}` : "";',
    "full report transport phone"
  );

  // fallback for exact existing no-space version
  text = once(
    text,
    'return type ? `${type} ${apt.transportCompany ? `(${apt.transportCompany})` : \'\'}` : "";',
    'return type ? `${type} ${getTransportCompanyDisplay(apt) ? `(${getTransportCompanyDisplay(apt)}${getTransportPhoneDisplay(apt) ? ` / ${getTransportPhoneDisplay(apt)}` : ""})` : ""}` : "";',
    "full report transport phone fallback"
  );

  text = once(
    text,
    'apt.time,',
    'formatTimeAMPMForPdf(apt.time),',
    "transport calendar appt time AMPM"
  );

  text = once(
    text,
    'apt.pickUpTime || "—",',
    'formatTimeAMPMForPdf(apt.pickUpTime),',
    "transport calendar pickup time AMPM"
  );

  const oldTransportCalendar = '`${apt.transportType === \'Others\' && apt.transportTypeOther ? apt.transportTypeOther : (apt.transportType || "")}\\n${apt.transportCompany || ""}`,';
  const newTransportCalendar = '`${apt.transportType === \'Others\' && apt.transportTypeOther ? apt.transportTypeOther : (apt.transportType || "")}\\n${getTransportCompanyDisplay(apt)}${getTransportPhoneDisplay(apt) ? `\\nPhone: ${getTransportPhoneDisplay(apt)}` : ""}`,';
  text = once(text, oldTransportCalendar, newTransportCalendar, "transport calendar company phone");

  const oldEscortCalendar = 'apt.escort === "Yes" && apt.escortDetails ? `Yes: ${apt.escortDetails}` : (apt.escort || "—"),';
  const newEscortCalendar = 'getEscortDisplay(apt),';
  text = once(text, oldEscortCalendar, newEscortCalendar, "transport calendar escort phone");

  text = once(
    text,
    'content: `APPOINTMENT TIME:  ${appointment.time}`',
    'content: `APPOINTMENT TIME:  ${formatTimeAMPMForPdf(appointment.time)}`',
    "checklist appointment time AMPM"
  );

  text = once(
    text,
    'content: `PICK-UP TIME:  ${appointment.pickUpTime || ""}`',
    'content: `PICK-UP TIME:  ${formatTimeAMPMForPdf(appointment.pickUpTime)}`',
    "checklist pickup time AMPM"
  );

  text = once(
    text,
    'content: `To be transported by: ${appointment.transportCompany || ""}\\nPhone # of Ambulette: _____________________\\nInvoice number of MAS (Medical Answering Services for Medicaid resident: ____________________`,',
    'content: `To be transported by: ${getTransportCompanyDisplay(appointment)}\\nPhone # of Transport: ${getTransportPhoneDisplay(appointment) || "_____________________"}\\nInvoice number of MAS (Medical Answering Services for Medicaid resident: ____________________`,',
    "checklist transport phone"
  );

  write(pdfPath, text);
  console.log("Patched pdfService.ts");
}

function patchConsult() {
  let text = read(consultPath);

  text = once(
    text,
    `const getReasonForConsultation = (apt: Appointment) => {
  return (
    apt.description ||
    apt.reasonConsultation ||
    apt.consultReason ||
    apt.reasonSendOut ||
    ""
  );
};`,
    `const getReasonForConsultation = (apt: Appointment) => {
  return (
    apt.reasonConsultation?.trim() ||
    apt.consultReason?.trim() ||
    apt.description?.trim() ||
    apt.reasonSendOut?.trim() ||
    ""
  );
};`,
    "consult reason fallback priority"
  );

  text = once(
    text,
    '<span class="label">Specialty:</span>',
    '<span class="label">Visit Category:</span>',
    "regular consult Visit Category label"
  );

  text = once(
    text,
    '<span class="label">Reason for Consultation:</span>',
    '<span class="label">Reason for Consultation (Notes):</span>',
    "regular consult consultation notes label"
  );

  write(consultPath, text);
  console.log("Patched consultForms.ts");
}

function patchVersion() {
  let text = read(versionPath);

  if (text.includes('version: "1.1.1"')) {
    console.log("OK: Version history already has v1.1.1.");
    return;
  }

  const entry = `  {
    version: "1.1.1",
    releaseDate: "2026-04-27",
    title: "Transportation Directory, PDF Output, and Consult Form Update",
    summary:
      "Added a shared transportation directory connected to the database, improved New Appointment transport auto-fill, and updated consult/checklist/transport-calendar outputs for clearer operational use.",
    capabilities: [
      "Shared Transportation Directory is stored in the database so Staff and Admin users can use the same company list.",
      "New Appointment Request can auto-fill transport company contact details from the directory.",
      "Manual Others option supports transportation companies not yet listed in the directory.",
      "Checklist PDF now displays AM/PM time formatting and transport phone number from the appointment record.",
      "Transport Calendar export now includes AM/PM time formatting, transportation phone number, and escort phone number.",
      "Regular Consult form now uses Visit Category and Reason for Consultation (Notes) with fallback to Consult Reason (Admin).",
    ],
    processFlow: [
      "Admin or Staff opens Directory and records transportation company name and contact details.",
      "Staff opens New Appointment Request and selects a transportation company.",
      "The app auto-populates the company phone number into the appointment record.",
      "If the company is not listed, Staff selects Others and enters details manually.",
      "Checklist, consult form, and transport calendar exports pull the saved transport and escort details into the printed output.",
    ],
    userImpact: [
      "Transportation contact details are consistent across users.",
      "Less duplicate typing is needed when scheduling appointments.",
      "Printed forms are clearer for nurses, transport coordination, and appointment packets.",
      "Reports better support daily transport workflow and survey-ready documentation.",
    ],
  },
`;

  const anchor = "const VERSION_HISTORY: VersionEntry[] = [\n";
  if (!text.includes(anchor)) throw new Error("Version history array anchor not found.");
  text = text.replace(anchor, anchor + entry);

  // Open latest v1.1.1 entry by default
  text = text.replace('open={entry.version === "1.0.0"}', 'open={entry.version === "1.1.1"}');

  write(versionPath, text);
  console.log("Patched VersionHistoryPanel.tsx");
}

patchPdf();
patchConsult();
patchVersion();

console.log("Patch complete. Run: npm run build");
