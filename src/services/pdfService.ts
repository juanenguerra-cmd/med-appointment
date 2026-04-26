import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Appointment, Resident, Facility } from "../types";

export const generateAppointmentPDF = (
  appointment: Appointment,
  resident?: Resident,
  facility?: Facility,
) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();

  // --- Header Section ---
  doc.setFillColor(11, 42, 111); // Brand Blue
  doc.rect(0, 0, width, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CONSULTATION & VISIT FORM", 15, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(facility?.name || "Facility Coordinator", 15, 28);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 34);

  if (facility) {
    doc.setFontSize(8);
    doc.text(`${facility.address || ""} | ${facility.phone || ""}`, 15, 38);
  }

  // --- Resident Information Box ---
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 248, 255);
  doc.rect(10, 45, width - 20, 35, "F");
  doc.rect(10, 45, width - 20, 35, "S");

  doc.setTextColor(11, 42, 111);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PATIENT IDENTIFICATION", 15, 52);

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  // Column 1
  doc.text(`Name: ${appointment.residentName}`, 15, 60);
  doc.text(`MRN: ${resident?.mrn || "N/A"}`, 15, 66);
  doc.text(`DOB/Age: ${resident?.age || "N/A"}`, 15, 72);

  // Column 2
  doc.text(`Unit/Floor: ${appointment.unit}`, 80, 60);
  doc.text(`Room/Bed: ${appointment.roomNumber}`, 80, 66);
  doc.text(`Sex: ${resident?.sex || "N/A"}`, 80, 72);

  // Column 3
  doc.text(`Admission Date: ${resident?.admissionDate || "N/A"}`, 140, 60);
  doc.text(`Primary MD: ${resident?.doctor || "N/A"}`, 140, 66);

  // --- Appointment Details ---
  doc.setTextColor(11, 42, 111);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("APPOINTMENT & PROVIDER DETAILS", 15, 90);

  autoTable(doc, {
    startY: 95,
    head: [["Field", "Information"]],
    body: [
      ["Service Type", appointment.type],
      ["Provider/Center", appointment.providerName],
      ["Location", appointment.location],
      ["Date & Time", `${appointment.date} at ${appointment.time}`],
      [
        "Transport",
        `${appointment.transportType === 'Others' && appointment.transportTypeOther ? appointment.transportTypeOther : appointment.transportType} ${appointment.transportCompany ? `(${appointment.transportCompany})` : ''}`,
      ],
      [
        "Reason for Visit",
        appointment.reasonSendOut ||
          appointment.description ||
          "Routine Checkup",
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [44, 62, 80] },
    styles: { fontSize: 9 },
  });

  // --- Clinical Section (The "Flat" Template Part) ---
  const clinicalStartY = (doc as any).lastAutoTable.finalY + 15;

  doc.setTextColor(11, 42, 111);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CLINICAL ENCOUNTER SUMMARY", 15, clinicalStartY);

  // Diagnosis & Allergies Boxes
  doc.setDrawColor(220, 220, 220);
  doc.rect(10, clinicalStartY + 5, width - 20, 15);
  doc.setFontSize(8);
  doc.text("PRIMARY DIAGNOSIS:", 12, clinicalStartY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(resident?.diagnosis || "See Chart", 45, clinicalStartY + 10);

  doc.setFont("helvetica", "bold");
  doc.text("ALLERGIES:", 12, clinicalStartY + 16);

  const allergiesText = String(resident?.allergies ?? "");

  doc.setTextColor(
    allergiesText.toLowerCase().includes("no known") ? 0 : 200,
    0,
    0,
  );
  doc.text(allergiesText || "N/A", 45, clinicalStartY + 16);

  // Notes Area
  doc.setTextColor(11, 42, 111);
  doc.rect(10, clinicalStartY + 25, width - 20, 50);
  doc.setFontSize(8);
  doc.text("FOLLOW-UP NOTES & RECOMMENDATIONS:", 12, clinicalStartY + 30);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const splitNotes = doc.splitTextToSize(
    appointment.notes || "No specific notes provided for this visit.",
    width - 30,
  );
  doc.text(splitNotes, 15, clinicalStartY + 38);

  // --- Signature Line ---
  const footerY = 270;
  doc.setDrawColor(150, 150, 150);
  doc.line(10, footerY, 80, footerY);
  doc.line(120, footerY, 190, footerY);

  doc.setFontSize(7);
  doc.text("Facility Coordinator Signature", 10, footerY + 5);
  doc.text("Date", 70, footerY + 5);

  doc.text("Authorizing Physician/Provider Signature", 120, footerY + 5);
  doc.text("Date", 180, footerY + 5);

  // Footer
  doc.setFontSize(8);
  doc.text("CONFIDENTIAL MEDICAL RECORD - HIPAA PROTECTED", width / 2, 285, {
    align: "center",
  });

  doc.save(
    `Visit_Form_${appointment.residentName.replace(/\s+/g, "_")}_${appointment.date}.pdf`,
  );
};

export const generateFullReport = (
  appointments: Appointment[],
  columns: string[],
  title: string = "Appointment Summary Report",
  facility?: Facility,
) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const width = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(11, 42, 111);
  doc.rect(0, 0, width, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const displayTitle = facility ? `${facility.name} - ${title}` : title;
  doc.text(displayTitle.toUpperCase(), 15, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${new Date().toLocaleString()} | Total Records: ${appointments.length}`,
    width - 15,
    16,
    { align: "right" },
  );

  // Map column names to appointment keys or formatter functions
  const columnMap: Record<string, keyof Appointment | ((apt: Appointment) => string)> = {
    "Resident Name": "residentName",
    Date: "date",
    Time: "time",
    Provider: "providerName",
    Specialty: "type",
    "Transport": (apt: Appointment) => {
      const type = apt.transportType === "Others" && apt.transportTypeOther ? apt.transportTypeOther : apt.transportType;
      return type ? `${type} ${apt.transportCompany ? `(${apt.transportCompany})` : ''}` : "";
    },
    Status: "status",
    Origin: "origin" as any,
    "Room #": "roomNumber",
    Unit: "unit",
    Notes: "notes",
    Payer: "payerForRide",
    Weight: "weight",
    Height: "height",
  };

  const head = columns;
  const body = appointments.map((apt) => {
    return columns.map((col) => {
      const keyOrFn = columnMap[col];
      if (typeof keyOrFn === "function") {
         return keyOrFn(apt) || "—";
      }
      return keyOrFn ? (apt[keyOrFn as keyof Appointment] as string) || "—" : "—";
    });
  });

  autoTable(doc, {
    startY: 35,
    head: [head],
    body: body,
    theme: "striped",
    headStyles: { fillColor: [44, 62, 80], fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold" },
    },
  });

  doc.save(`Report_${new Date().getTime()}.pdf`);
};

export const generateTransportSchedulePDF = (
  appointments: Appointment[],
  startDate: string,
  endDate: string,
  facility?: Facility,
) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();

  // --- Page Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    "CALENDAR FOR RESIDENT APPOINTMENT & TRANSPORTATION SCHEDULE",
    width / 2,
    15,
    { align: "center" },
  );

  doc.setFontSize(10);
  const facilityLine = facility
    ? `${facility.name.toUpperCase()} ** ${facility.address?.toUpperCase() || ""} * ${facility.phone || ""}`
    : "[FACILITY NAME] ** [FACILITY ADDRESS] * [FACILITY NUMBER]";
  doc.text(facilityLine, width / 2, 22, { align: "center" });

  doc.setFontSize(11);
  doc.text("Weekly Medical Appointments", 15, 35);
  doc.text(`Printed on: ${new Date().toLocaleDateString()}`, 15, 42);

  // Nurse attention box area (Top Rightish)
  doc.setFontSize(10);
  doc.text("ATTN. NURSE:", 140, 35);
  const nurseNote =
    "PLEASE NOTIFY THE RESIDENTS AND FAMILIES\nABOUT RESIDENTS’ MEDICAL APPOINTMENTS";
  doc.text(nurseNote, 175, 35, { align: "left" });

  // Draw lines for "Printed on"
  doc.line(40, 42, 80, 42);

  // --- Table Configuration ---
  const tableHead = [
    [
      "Appt\nDate",
      "Unit\n/Rm\n#",
      "Name of Resident",
      "Appt\nTime",
      "Pick up\nTime",
      "Transportation",
      "Appointment details",
      "Escort Name &\nPhone #",
      "Comment",
    ],
  ];

  const tableBody = appointments.map((apt) => {
    const details = [
      apt.providerName,
      apt.location,
      apt.type,
      apt.reasonConsultation || apt.description,
    ]
      .filter(Boolean)
      .join("\n");
      
    return [
      apt.date,
      `${apt.unit || ""}\n${apt.roomNumber || ""}`,
      apt.residentName,
      apt.time,
      apt.pickUpTime || "—",
      `${apt.transportType === 'Others' && apt.transportTypeOther ? apt.transportTypeOther : (apt.transportType || "")}\n${apt.transportCompany || ""}`,
      details,
      apt.escort === "Yes" && apt.escortDetails ? `Yes: ${apt.escortDetails}` : (apt.escort || "—"),
      apt.notes || "",
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: tableHead,
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      valign: "middle",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: 15, halign: "center" },
      2: { cellWidth: 40 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 35 },
      6: { cellWidth: 65 },
      7: { cellWidth: 25 },
      8: { cellWidth: "auto" },
    },
    didDrawPage: (data) => {
      // Add page numbers if needed
    },
    margin: { left: 10, right: 10 },
  });

  doc.save(`Transport_Schedule_${startDate}_to_${endDate}.pdf`);
};

export const generateOutsideAppointmentChecklistPDF = (
  appointment: Appointment,
  resident?: Resident,
  facility?: Facility,
) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 36;
  let currY = 30;

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    ` ${facility?.name.toUpperCase() || "FACILITY NAME"} `,
    width / 2,
    currY,
    { align: "center" },
  );
  currY += 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const details = `${facility?.address || "Facility Address"} | ${facility?.phone || "Facility Number"}`;
  doc.text(details, width / 2, currY, { align: "center" });
  currY += 18;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CHECKLIST FOR OUTSIDE APPOINTMENT", width / 2, currY, {
    align: "center",
  });
  currY += 14;
  doc.setFontSize(9);
  doc.text("(Attach to consult form)", width / 2, currY, { align: "center" });
  currY += 18;

  // --- Resident Info ---
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  // Line 1: Name, Rm#, Weight, Height
  doc.text(`Resident's Name`, margin, currY);
  doc.setFont("helvetica", "bold");
  doc.text(appointment.residentName, margin + 85, currY);
  doc.line(margin + 80, currY + 2, margin + 280, currY + 2);

  doc.setFont("helvetica", "normal");
  doc.text("Rm. #", margin + 285, currY);
  doc.setFont("helvetica", "bold");
  doc.text(appointment.roomNumber, margin + 325, currY);
  doc.line(margin + 320, currY + 2, margin + 350, currY + 2);

  doc.setFont("helvetica", "normal");
  doc.text("Weight:", margin + 355, currY);
  if (appointment.weight) {
    doc.setFont("helvetica", "bold");
    doc.text(appointment.weight || "", margin + 395, currY);
    doc.setFont("helvetica", "normal");
  }
  doc.line(margin + 390, currY + 2, margin + 440, currY + 2);

  doc.text("Height:", margin + 445, currY);
  if (appointment.height) {
    doc.setFont("helvetica", "bold");
    doc.text(appointment.height || "", margin + 482, currY);
    doc.setFont("helvetica", "normal");
  }
  doc.line(margin + 480, currY + 2, width - margin, currY + 2);
  currY += 18;

  // Line 2: Consultant
  doc.text("Name & phone # of outside consultant:", margin, currY);
  doc.setFont("helvetica", "bold");
  const consultantDetails = `${appointment.providerName} / ${appointment.contactNumber}`;
  doc.text(consultantDetails, margin + 195, currY);
  doc.line(margin + 190, currY + 2, width - margin, currY + 2);
  currY += 18;

  // Line 3: Reason
  doc.text("Reason for consult request:", margin, currY);
  doc.setFont("helvetica", "bold");
  const reasonParts = [];
  if (appointment.description) reasonParts.push(appointment.description);
  if (appointment.reasonConsultation)
    reasonParts.push(appointment.reasonConsultation);
  if (appointment.reasonSendOut && !appointment.reasonConsultation)
    reasonParts.push(appointment.reasonSendOut);
  const reasonText = reasonParts.join(" - ") || "";
  doc.text(reasonText, margin + 135, currY);
  doc.line(margin + 130, currY + 2, width - margin, currY + 2);
  currY += 18;

  // Line 4: Nurse
  doc.text("Name of Nurse completing questions 1-6:", margin, currY);
  if (appointment.nurseCompleting) {
    doc.setFont("helvetica", "bold");
    doc.text(appointment.nurseCompleting || "", margin + 205, currY);
    doc.setFont("helvetica", "normal");
  }
  doc.line(margin + 200, currY + 2, width - margin, currY + 2);
  currY += 16;

  const getCb = (isTrue?: boolean | string) => isTrue && isTrue !== "No" ? "[X]" : "[ ]";
  
  const q1Sub = `${getCb(appointment.ambulating)} Ambulating  ${getCb(appointment.wheelchair)} Wheelchair  ${getCb(appointment.withLift)} With lift  ${getCb(appointment.recliner)} Recliner  ${getCb(appointment.escort === "Yes")} Escort  ${getCb(appointment.oxygen)} Oxygen  ${getCb(appointment.bariatric)} Bariatric`;

  // --- Questions Table ---
  const tableData = [
    {
      q: "1. Check all that apply:",
      sub: q1Sub,
    },
    {
      q: "2. Can the service or work-up be provided inside the facility?",
      sub: "(Check the list of services/consultants and work-up which can be provided in our nursing home). If the resident still wants to go to their personal provider, they have to make their own arrangement. Notify the Social Worker and RN Supervisor of the unit.",
    },
    {
      q: "3. Is the resident alert and oriented?",
      sub: "If confused or if able to wander, the resident will need an escort or family to accompany.",
    },
    {
      q: "4. Can the resident sit-up in a wheelchair?",
      sub: "(If the resident sits on a Geri chair or recliner, resident will need a stretcher. The ambulette can only accommodate wheelchairs. If stretcher is needed, the Ambulance company will need us to justify the need for a stretcher/ambulance).",
    },
    {
      q: '5. Is the resident "at risk for elopement"?',
      sub: "(Check the list. If so, the resident needs an Escort. Make certain that the Escort is aware of his/her job description. A signed one should be on file)",
    },
    {
      q: '6. Does resident have a "DNR" order?',
      sub: '(Please attach a copy of "Non-Hospital DNR Order" to be sent with the resident).',
    },
    {
      q: "7. If the resident has an involved family, inquire if they can accompany the resident to an outside appointment.",
      sub: "(This will relieve us of utilizing an escort for a resident that requires one).",
    },
    {
      q: "8. Are there several residents with the need for the same service?",
      sub: "(Try to get an appointment for several residents going to the same place to maximize the use of an escort)",
    },
    {
      q: "9. The envelope being sent with the resident has the following:",
      sub: "•  The name, phone # and address of the outside provider\n•  Resident's face sheet\n•  Consult request (reason for consult request should be documented)\n•  Print the resident's current MD orders (Medications/treatments)\n•  Include the Weight Bearing Request on all Ortho Consult\n•  Include letter requesting for preliminary results or impression of diagnostic work up (I.e., CAT scan, MRI, Ba Swallow, EGD, etc.)",
    },
  ];

  autoTable(doc, {
    startY: currY,
    head: [["QUESTIONS", "YES", "NO", "COMMENTS"]],
    body: tableData.map((item) => [
      { content: `${item.q}\n${item.sub}`, styles: { fontStyle: "normal" } },
      "",
      "",
      "",
    ]),
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      textColor: [0, 0, 0],
      valign: "top",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 350 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: "auto" },
    },
  });

  currY = (doc as any).lastAutoTable.finalY + 8;

  // --- Payment Note ---
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(
    "Note:  Medicaid pays for Ambulette. Ambulance (with justification).     Medicare only pays for Ambulance",
    margin,
    currY,
  );
  currY += 12;
  doc.text(
    "HMO will need a pre-approval for payment of transportation",
    margin + 35,
    currY,
  );
  currY += 12;

  // --- Footer Table ---
  autoTable(doc, {
    startY: currY,
    body: [
      [
        {
          content: `APPOINTMENT DATE:  ${appointment.date}`,
          styles: { halign: "left" },
        },
        {
          content: `APPOINTMENT TIME:  ${appointment.time}`,
          styles: { halign: "left" },
        },
        {
          content: `PICK-UP TIME:  ${appointment.pickUpTime || ""}`,
          styles: { halign: "left" },
        },
      ],
      [
        {
          content: `To be transported by: ${appointment.transportCompany || ""}\nPhone # of Ambulette: _____________________\nInvoice number of MAS (Medical Answering Services for Medicaid resident: ____________________`,
          colSpan: 3,
          styles: { halign: "left" },
        },
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      fontStyle: "bold",
    },
  });

  currY = (doc as any).lastAutoTable.finalY + 24;

  // --- Signature Line ---
  doc.setFontSize(10);
  doc.text(
    "Consult Coordinator's Signature: __________________________________",
    margin,
    currY,
  );
  doc.text(
    `Date: ${new Date().toLocaleDateString()}`,
    width - margin - 120,
    currY,
  );

  doc.save(
    `Checklist_${appointment.residentName.replace(/\s+/g, "_")}_${appointment.date}.pdf`,
  );
};

export const generateMedicalClearancePDF = (
  appointment: Appointment,
  type: "Ortho Visit" | "Regular Visit",
  resident?: Resident,
  facility?: Facility,
) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 50;
  let currY = 50;

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(facility?.name.toUpperCase() || "FACILITY NAME", width / 2, currY, { align: "center" });
  
  currY += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const addressLine = facility?.address || "Facility Address";
  doc.text(addressLine, width / 2, currY, { align: "center" });
  
  currY += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`MEDICAL CLEARANCE FOR ${type}`, width / 2, currY, { align: "center" });
  
  currY += 30;
  
  // Basic Info Line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Resident/Patient Name:", margin, currY);
  const resName = resident ? `${resident.firstName} ${resident.lastName}` : appointment.residentName || "";
  doc.text(resName, margin + 130, currY);
  doc.line(margin + 125, currY + 2, margin + 300, currY + 2); // underline name
  
  doc.text("Medical Record #", margin + 305, currY);
  const mrn = resident?.mrn || resident?.id || "";
  doc.text(mrn, margin + 400, currY);
  doc.line(margin + 395, currY + 2, width - margin, currY + 2); // underline MRN
  
  currY += 20;

  let dob = "";
  if (resident?.notes) {
    const dobMatch = resident.notes.match(/DOB:\s*([^\s|]+)/i);
    if (dobMatch) dob = dobMatch[1].trim();
  }
  const age = resident?.age && resident.age !== "—" ? resident.age : "___";
  const gender = resident?.sex && resident.sex !== "—" ? resident.sex : "___";
  
  doc.text(`Date of Birth: ${dob || "________________"}    Age: ${age}    Gender: ${gender}`, margin + 130, currY);
  
  currY += 20;
  
  const allergies = resident?.allergies && resident.allergies !== "—" ? resident.allergies : "";
  doc.text("Allergies:", margin, currY);
  doc.text(allergies, margin + 60, currY);
  doc.line(margin + 55, currY + 2, width - margin, currY + 2);
  
  currY += 25;
  
  // Proposed Procedure or Treatment
  doc.text("Proposed Procedure or Treatment:", margin, currY);
  currY += 20;
  
  const procedureText = appointment.reasonSendOut || appointment.description || appointment.reasonConsultation || "";
  const lines = doc.splitTextToSize(procedureText, width - margin * 2 - 10);
  
  doc.text(lines, margin + 5, currY);
  // Lines for procedure
  doc.line(margin, currY + 5, width - margin, currY + 5);
  doc.line(margin, currY + 25, width - margin, currY + 25);
  doc.line(margin, currY + 45, width - margin, currY + 45);
  doc.line(margin, currY + 65, width - margin, currY + 65);
  
  currY += 85;
  
  // Anticipated Date of Procedure
  doc.text("Anticipated Date of Procedure:", margin, currY);
  doc.text(appointment.date || "", margin + 165, currY);
  doc.line(margin + 160, currY + 2, margin + 400, currY + 2);
  
  currY += 30;
  
  // Premedication recommended?
  doc.text("If approved for procedure/treatment, is premedication recommended?", margin, currY);
  
  currY += 20;
  doc.text("Yes:", margin + 100, currY);
  doc.line(margin + 130, currY + 2, margin + 180, currY + 2);
  
  doc.text("No:", margin + 190, currY);
  doc.line(margin + 215, currY + 2, margin + 265, currY + 2);
  
  currY += 30;
  
  doc.text("If yes, please specify:", margin, currY);
  doc.line(margin, currY + 20, width - margin, currY + 20);
  
  currY += 40;
  
  // Additional Comments
  doc.text("Additional Comments:", margin, currY);
  doc.line(margin, currY + 20, width - margin, currY + 20);
  doc.line(margin, currY + 40, width - margin, currY + 40);
  
  currY += 60;
  
  // Consent
  doc.text("Resident/Patient is able to give informed consent:", margin, currY);
  doc.text("Yes:", width - margin - 150, currY);
  doc.line(width - margin - 120, currY + 2, width - margin - 80, currY + 2);
  
  doc.text("No:", width - margin - 60, currY);
  doc.line(width - margin - 40, currY + 2, width - margin, currY + 2);
  
  currY += 30;
  // Contraindication
  doc.text("There is no medical contraindication to the above procedure or treatment:", margin, currY);
  currY += 20;
  doc.text("Yes:", margin + 150, currY);
  doc.line(margin + 180, currY + 2, margin + 230, currY + 2);
  
  doc.text("No:", margin + 240, currY);
  doc.line(margin + 265, currY + 2, margin + 315, currY + 2);
  
  currY += 35;
  
  // Declaration
  const declarationText = "Resident/Patient is currently under my care. The medical benefits outweigh the risk of planned procedure/treatment. Resident/Patient is medically cleared for procedure.";
  const decLines = doc.splitTextToSize(declarationText, width - margin * 2);
  doc.text(decLines, margin, currY);
  
  currY += 45;
  doc.text("Print Name of Attending Physician/Medical Provider:", margin, currY);
  doc.line(margin + 280, currY + 2, width - margin, currY + 2);
  
  currY += 50;
  
  doc.line(margin, currY, margin + 200, currY);
  doc.text("Attending Physician/Medical Provider", margin + 10, currY + 12);
  
  doc.line(margin + 230, currY, margin + 350, currY);
  doc.text("State License Number", margin + 240, currY + 12);
  
  doc.line(margin + 380, currY, width - margin, currY);
  doc.text("Date", margin + 410, currY + 12);
  
  doc.save(`Medical_Clearance_${appointment.residentName.replace(/\s+/g, "_")}_${appointment.date}.pdf`);
};

