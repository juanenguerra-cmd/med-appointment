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

function patchPdfService() {
  let text = read(pdfPath);

  if (!text.includes("const formatTimeAMPMForPdf")) {
    const helper = `
const formatTimeAMPMForPdf = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/\\b(AM|PM)\\b/i.test(raw)) return raw;
  const match = raw.match(/^(\\d{1,2}):(\\d{2})/);
  if (!match) return raw;
  const date = new Date(\`1970-01-01T\${match[1].padStart(2, "0")}:\${match[2]}:00\`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
};

const getTransportCompanyDisplay = (appointment: Appointment) => {
  return (
    appointment.transportCompanyOther ||
    appointment.transportCompany ||
    ""
  );
};

const getTransportDetailsForPdf = (appointment: Appointment) => {
  const transportType =
    appointment.transportType === "Others" && appointment.transportTypeOther
      ? appointment.transportTypeOther
      : appointment.transportType || "";
  const company = getTransportCompanyDisplay(appointment);
  const phone = appointment.transportCompanyPhone || "";
  return [transportType, company, phone ? \`Phone: \${phone}\` : ""]
    .filter(Boolean)
    .join("\\n");
};

const getEscortDetailsForPdf = (appointment: Appointment) => {
  const escortName =
    appointment.escort === "Yes" && appointment.escortDetails
      ? appointment.escortDetails
      : appointment.escort || "";
  const phone = appointment.escortPhone || "";
  return [escortName, phone ? \`Phone: \${phone}\` : ""].filter(Boolean).join("\\n") || "—";
};

`;
    text = text.replace(
      /import\s+\{\s*Appointment,\s*Resident,\s*Facility\s*\}\s+from\s+["']\.\.\/types["'];\s*/,
      (m) => m + helper
    );
  }

  // Visit form Date & Time
  text = text.replace(
    /`\$\{appointment\.date\} at \$\{appointment\.time\}`/g,
    "`${appointment.date} at ${formatTimeAMPMForPdf(appointment.time)}`"
  );

  // Full report Time column
  text = text.replace(/Time:\s*"time",/g, 'Time: (apt: Appointment) => formatTimeAMPMForPdf(apt.time),');

  // Full report Transport column
  text = text.replace(
    /return type \? `\$\{type\} \$\{apt\.transportCompany \? `\(\$\{apt\.transportCompany\}\)` : ''\}` : "";/g,
    'return getTransportDetailsForPdf(apt).replace(/\\n/g, " ");'
  );

  // Transport schedule appt/pickup times
  text = text.replace(/(\n\s*)apt\.time,(\n\s*)apt\.pickUpTime \|\| "—",/g,
    '$1formatTimeAMPMForPdf(apt.time),$2formatTimeAMPMForPdf(apt.pickUpTime),'
  );

  // Transport schedule transportation column
  text = text.replace(
    /`\$\{apt\.transportType === 'Others' && apt\.transportTypeOther \? apt\.transportTypeOther : \(apt\.transportType \|\| ""\)\}\\n\$\{apt\.transportCompany \|\| ""\}`/g,
    "getTransportDetailsForPdf(apt)"
  );

  // Transport schedule escort column
  text = text.replace(
    /apt\.escort === "Yes" && apt\.escortDetails \? `Yes: \$\{apt\.escortDetails\}` : \(apt\.escort \|\| "—"\)/g,
    "getEscortDetailsForPdf(apt)"
  );

  // Checklist footer time fields
  text = text.replace(
    /content: `APPOINTMENT TIME:\s+\$\{appointment\.time\}`/g,
    'content: `APPOINTMENT TIME:  ${formatTimeAMPMForPdf(appointment.time)}`'
  );
  text = text.replace(
    /content: `PICK-UP TIME:\s+\$\{appointment\.pickUpTime \|\| ""\}`/g,
    'content: `PICK-UP TIME:  ${formatTimeAMPMForPdf(appointment.pickUpTime)}`'
  );

  // Checklist transport company + phone
  text = text.replace(
    /content: `To be transported by: \$\{appointment\.transportCompany \|\| ""\}\\nPhone # of Ambulette: _____________________\\nInvoice number of MAS \(Medical Answering Services for Medicaid resident: ____________________`,/g,
    'content: `To be transported by: ${getTransportCompanyDisplay(appointment)}\\nPhone #: ${appointment.transportCompanyPhone || "_____________________"}\\nInvoice number of MAS (Medical Answering Services for Medicaid resident: ____________________`,'
  );

  write(pdfPath, text);
  console.log("Patched pdfService.ts");
}

function patchConsultForms() {
  let text = read(consultPath);

  text = text.replace(
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
};`
  );

  // Change regular consult label from Specialty to Visit Category if present.
  text = text.replace(
    /<span class="label">Specialty:<\/span>\s*<span class="value-line">\$\{specialty\}<\/span>/g,
    '<span class="label">Visit Category:</span>\\n        <span class="value-line">${specialty}</span>'
  );

  // Change label for regular consult reason.
  text = text.replace(
    /<span class="label">Reason for Consultation:<\/span>\s*<span class="value-line">\$\{reason\}<\/span>/g,
    '<span class="label">Reason for Consultation (Notes):</span>\\n        <span class="value-line">${reason}</span>'
  );

  write(consultPath, text);
  console.log("Patched consultForms.ts");
}

function patchVersionHistory() {
  let text = read(versionPath);
  if (text.includes('version: "1.1.1"')) {
    console.log("Version history already has v1.1.1");
    return;
  }

  const entry = `  {
    version: "1.1.1",
    releaseDate: "2026-04-27",
    title: "Transportation Directory, Auto-Fill, and Form Output Update",
    summary:
      "Adds shared transportation directory support, transport auto-fill in appointment requests, improved consult form wording, and updated PDF outputs with AM/PM time formatting and transport contact details.",
    capabilities: [
      "Shared Transportation Directory connected to the database for multi-user access.",
      "New Appointment Request can select transportation companies and auto-populate contact phone details.",
      "Manual Others option supports transportation companies not yet listed in the directory.",
      "Checklist PDF now displays AM/PM time formatting and transport company contact number.",
      "Transport Calendar export now displays AM/PM times and transport/escort phone details.",
      "Regular Consult form now uses Visit Category and Reason for Consultation (Notes) with fallback to Consult Reason (Admin).",
    ],
    processFlow: [
      "Staff or admin opens Directory and adds/updates transportation company contact details.",
      "New Appointment Request loads the shared directory for the selected facility.",
      "Selecting a transportation company auto-fills the company name and phone number.",
      "Checklist and Transport Calendar exports use the saved appointment transport and escort phone details.",
      "Consult forms prioritize staff-entered consultation notes before admin consult reason.",
    ],
    userImpact: [
      "Transport contact details are consistent across users.",
      "Appointment entry is faster and reduces duplicate manual typing.",
      "PDF outputs are clearer for staff review, transportation coordination, and appointment packets.",
      "Version history documents the workflow change in plain language.",
    ],
  },
`;

  text = text.replace(/const VERSION_HISTORY: VersionEntry\[\] = \[\s*/, (m) => m + "\n" + entry);
  write(versionPath, text);
  console.log("Patched VersionHistoryPanel.tsx");
}

patchPdfService();
patchConsultForms();
patchVersionHistory();
console.log("Patch complete. Now run: npm run build");
