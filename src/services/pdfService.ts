import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Appointment, Resident, Facility } from '../types';

export const generateAppointmentPDF = (appointment: Appointment, resident?: Resident, facility?: Facility) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  
  // --- Header Section ---
  doc.setFillColor(11, 42, 111); // Brand Blue
  doc.rect(0, 0, width, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSULTATION & VISIT FORM', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(facility?.name || 'Facility Coordinator', 15, 28);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 34);

  if (facility) {
    doc.setFontSize(8);
    doc.text(`${facility.address || ''} | ${facility.phone || ''}`, 15, 38);
  }

  // --- Resident Information Box ---
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 248, 255);
  doc.rect(10, 45, width - 20, 35, 'F');
  doc.rect(10, 45, width - 20, 35, 'S');

  doc.setTextColor(11, 42, 111);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT IDENTIFICATION', 15, 52);

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Column 1
  doc.text(`Name: ${appointment.residentName}`, 15, 60);
  doc.text(`MRN: ${resident?.mrn || 'N/A'}`, 15, 66);
  doc.text(`DOB/Age: ${resident?.age || 'N/A'}`, 15, 72);

  // Column 2
  doc.text(`Unit/Floor: ${appointment.unit}`, 80, 60);
  doc.text(`Room/Bed: ${appointment.roomNumber}`, 80, 66);
  doc.text(`Sex: ${resident?.sex || 'N/A'}`, 80, 72);

  // Column 3
  doc.text(`Admission Date: ${resident?.admissionDate || 'N/A'}`, 140, 60);
  doc.text(`Primary MD: ${resident?.doctor || 'N/A'}`, 140, 66);

  // --- Appointment Details ---
  doc.setTextColor(11, 42, 111);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('APPOINTMENT & PROVIDER DETAILS', 15, 90);

  autoTable(doc, {
    startY: 95,
    head: [['Field', 'Information']],
    body: [
      ['Service Type', appointment.type],
      ['Provider/Center', appointment.providerName],
      ['Location', appointment.location],
      ['Date & Time', `${appointment.date} at ${appointment.time}`],
      ['Transport', `${appointment.transportType} (${appointment.transportCompany})`],
      ['Reason for Visit', appointment.reasonSendOut || appointment.description || 'Routine Checkup'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80] },
    styles: { fontSize: 9 }
  });

  // --- Clinical Section (The "Flat" Template Part) ---
  const clinicalStartY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setTextColor(11, 42, 111);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINICAL ENCOUNTER SUMMARY', 15, clinicalStartY);

  // Diagnosis & Allergies Boxes
  doc.setDrawColor(220, 220, 220);
  doc.rect(10, clinicalStartY + 5, width - 20, 15);
  doc.setFontSize(8);
  doc.text('PRIMARY DIAGNOSIS:', 12, clinicalStartY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(resident?.diagnosis || 'See Chart', 45, clinicalStartY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('ALLERGIES:', 12, clinicalStartY + 16);
  doc.setTextColor(resident?.allergies.toLowerCase().includes('no known') ? 0 : 200, 0, 0);
  doc.text(resident?.allergies || 'N/A', 45, clinicalStartY + 16);

  // Notes Area
  doc.setTextColor(11, 42, 111);
  doc.rect(10, clinicalStartY + 25, width - 20, 50);
  doc.setFontSize(8);
  doc.text('FOLLOW-UP NOTES & RECOMMENDATIONS:', 12, clinicalStartY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const splitNotes = doc.splitTextToSize(appointment.notes || 'No specific notes provided for this visit.', width - 30);
  doc.text(splitNotes, 15, clinicalStartY + 38);

  // --- Signature Line ---
  const footerY = 270;
  doc.setDrawColor(150, 150, 150);
  doc.line(10, footerY, 80, footerY);
  doc.line(120, footerY, 190, footerY);
  
  doc.setFontSize(7);
  doc.text('Facility Coordinator Signature', 10, footerY + 5);
  doc.text('Date', 70, footerY + 5);
  
  doc.text('Authorizing Physician/Provider Signature', 120, footerY + 5);
  doc.text('Date', 180, footerY + 5);

  // Footer
  doc.setFontSize(8);
  doc.text('CONFIDENTIAL MEDICAL RECORD - HIPAA PROTECTED', width / 2, 285, { align: 'center' });

  doc.save(`Visit_Form_${appointment.residentName.replace(/\s+/g, '_')}_${appointment.date}.pdf`);
};

export const generateFullReport = (appointments: Appointment[], columns: string[], title: string = 'Appointment Summary Report', facility?: Facility) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const width = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(11, 42, 111);
  doc.rect(0, 0, width, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const displayTitle = facility ? `${facility.name} - ${title}` : title;
  doc.text(displayTitle.toUpperCase(), 15, 16);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()} | Total Records: ${appointments.length}`, width - 15, 16, { align: 'right' });

  // Map column names to appointment keys
  const columnMap: Record<string, keyof Appointment> = {
    'Resident Name': 'residentName',
    'Date': 'date',
    'Time': 'time',
    'Provider': 'providerName',
    'Specialty': 'type',
    'Transport': 'transportType',
    'Status': 'status',
    'Origin': 'origin' as any,
    'Room #': 'roomNumber',
    'Unit': 'unit',
    'Notes': 'notes',
    'Payer': 'payerForRide'
  };

  const head = columns;
  const body = appointments.map(apt => {
    return columns.map(col => {
      const key = columnMap[col];
      return key ? (apt[key] || '—') : '—';
    });
  });

  autoTable(doc, {
    startY: 35,
    head: [head],
    body: body,
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  });

  doc.save(`Report_${new Date().getTime()}.pdf`);
};

export const generateTransportSchedulePDF = (appointments: Appointment[], startDate: string, endDate: string, facility?: Facility) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  
  // --- Page Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CALENDAR FOR RESIDENT APPOINTMENT & TRANSPORTATION SCHEDULE', width / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  const facilityLine = facility 
    ? `${facility.name.toUpperCase()} ** ${facility.address?.toUpperCase() || ''} * ${facility.phone || ''}`
    : '[FACILITY NAME] ** [FACILITY ADDRESS] * [FACILITY NUMBER]';
  doc.text(facilityLine, width / 2, 22, { align: 'center' });

  doc.setFontSize(11);
  doc.text('Weekly Medical Appointments', 15, 35);
  doc.text(`Printed on: ${new Date().toLocaleDateString()}`, 15, 42);
  
  // Nurse attention box area (Top Rightish)
  doc.setFontSize(10);
  doc.text('ATTN. NURSE:', 140, 35);
  const nurseNote = 'PLEASE NOTIFY THE RESIDENTS AND FAMILIES\nABOUT RESIDENTS’ MEDICAL APPOINTMENTS';
  doc.text(nurseNote, 175, 35, { align: 'left' });

  // Draw lines for "Printed on"
  doc.line(40, 42, 80, 42);

  // --- Table Configuration ---
  const tableHead = [[
    'Appt\nDate',
    'Unit\n/Rm\n#',
    'Name of Resident',
    'Appt\nTime',
    'Pick up\nTime',
    'Transportation',
    'Appointment details',
    'Escort Name &\nPhone #',
    'Comment'
  ]];

  const tableBody = appointments.map(apt => [
    apt.date,
    `${apt.unit || ''}\n${apt.roomNumber || ''}`,
    apt.residentName,
    apt.time,
    apt.pickUpTime || '—',
    `${apt.transportType || ''}\n${apt.transportCompany || ''}`,
    `${apt.providerName || ''}\n${apt.location || ''}\n${apt.type || ''}`,
    apt.escort || '—',
    apt.notes || ''
  ]);

  autoTable(doc, {
    startY: 50,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      valign: 'middle'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 40 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 40 },
      6: { cellWidth: 50 },
      7: { cellWidth: 40 },
      8: { cellWidth: 'auto' }
    },
    didDrawPage: (data) => {
      // Add page numbers if needed
    },
    margin: { left: 10, right: 10 }
  });

  doc.save(`Transport_Schedule_${startDate}_to_${endDate}.pdf`);
};

export const generateOutsideAppointmentChecklistPDF = (appointment: Appointment, resident?: Resident, facility?: Facility) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const width = doc.internal.pageSize.getWidth();
  const margin = 36;
  let currY = 30;

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`[ ${facility?.name.toUpperCase() || 'FACILITY NAME'} ]`, width / 2, currY, { align: 'center' });
  currY += 12;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const details = `${facility?.address || 'Facility Address'} | ${facility?.phone || 'Facility Number'}`;
  doc.text(`[ ${details} ]`, width / 2, currY, { align: 'center' });
  currY += 18;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECKLIST FOR OUTSIDE APPOINTMENT', width / 2, currY, { align: 'center' });
  currY += 14;
  doc.setFontSize(9);
  doc.text('(Attach to consult form)', width / 2, currY, { align: 'center' });
  currY += 18;

  // --- Resident Info ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Line 1: Name, Rm#, Weight, Height
  doc.text('Resident\'s Name', margin, currY);
  doc.setFont('helvetica', 'bold');
  doc.text(appointment.residentName, margin + 75, currY);
  doc.line(margin + 72, currY + 2, margin + 280, currY + 2);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Rm. #', margin + 285, currY);
  doc.setFont('helvetica', 'bold');
  doc.text(appointment.roomNumber, margin + 315, currY);
  doc.line(margin + 312, currY + 2, margin + 350, currY + 2);

  doc.setFont('helvetica', 'normal');
  doc.text('Weight:', margin + 355, currY);
  doc.line(margin + 390, currY + 2, margin + 440, currY + 2);

  doc.text('Height:', margin + 445, currY);
  doc.line(margin + 480, currY + 2, width - margin, currY + 2);
  currY += 16;

  // Line 2: Consultant
  doc.text('Name & phone # of outside consultant:', margin, currY);
  doc.setFont('helvetica', 'bold');
  const consultantDetails = `${appointment.providerName} / ${appointment.contactNumber}`;
  doc.text(consultantDetails, margin + 175, currY);
  doc.line(margin + 170, currY + 2, width - margin, currY + 2);
  currY += 16;

  // Line 3: Reason
  doc.text('Reason for consult request:', margin, currY);
  doc.setFont('helvetica', 'bold');
  const reasonText = appointment.reasonSendOut || appointment.description || '';
  doc.text(reasonText, margin + 115, currY);
  doc.line(margin + 110, currY + 2, width - margin, currY + 2);
  currY += 16;

  // Line 4: Nurse
  doc.text('Name of Nurse completing questions 1-6:', margin, currY);
  doc.line(margin + 180, currY + 2, width - margin, currY + 2);
  currY += 20;

  // --- Questions Table ---
  const tableData = [
    { 
      q: '1. Check all that apply:', 
      sub: '[] Ambulating  [] Wheelchair  [] With lift  [] Recliner  [] Escort  [] Oxygen  [] Bariatric'
    },
    { 
      q: '2. Can the service or work-up be provided inside the facility?', 
      sub: '(Check the list of services/consultants and work-up which can be provided in our nursing home). If the resident still wants to go to their personal provider, they have to make their own arrangement. Notify the Social Worker and RN Supervisor of the unit.'
    },
    { 
      q: '3. Is the resident alert and oriented?', 
      sub: 'If confused or if able to wander, the resident will need an escort or family to accompany.'
    },
    { 
      q: '4. Can the resident sit-up in a wheelchair?', 
      sub: '(If the resident sits on a Geri chair or recliner, resident will need a stretcher. The ambulette can only accommodate wheelchairs. If stretcher is needed, the Ambulance company will need us to justify the need for a stretcher/ambulance).'
    },
    { 
      q: '5. Is the resident "at risk for elopement"?', 
      sub: '(Check the list. If so, the resident needs an Escort. Make certain that the Escort is aware of his/her job description. A signed one should be on file)'
    },
    { 
      q: '6. Does resident have a "DNR" order?', 
      sub: '(Please attach a copy of "Non-Hospital DNR Order" to be sent with the resident).'
    },
    { 
      q: '7. If the resident has an involved family, inquire if they can accompany the resident to an outside appointment.', 
      sub: '(This will relieve us of utilizing an escort for a resident that requires one).'
    },
    { 
      q: '8. Are there several residents with the need for the same service?', 
      sub: '(Try to get an appointment for several residents going to the same place to maximize the use of an escort)'
    },
    { 
      q: '9. The envelope being sent with the resident has the following:', 
      sub: '•  The name, phone # and address of the outside provider\n•  Resident\'s face sheet\n•  Consult request (reason for consult request should be documented)\n•  Print the resident\'s current MD orders (Medications/treatments)\n•  Include the Weight Bearing Request on all Ortho Consult\n•  Include letter requesting for preliminary results or impression of diagnostic work up (I.e., CAT scan, MRI, Ba Swallow, EGD, etc.)'
    }
  ];

  autoTable(doc, {
    startY: currY,
    head: [['QUESTIONS', 'YES', 'NO', 'COMMENTS']],
    body: tableData.map(item => [
      { content: `${item.q}\n${item.sub}`, styles: { fontStyle: 'normal' } },
      '',
      '',
      ''
    ]),
    theme: 'grid',
    styles: { 
      fontSize: 7.5, 
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      textColor: [0, 0, 0],
      valign: 'top'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 380 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto' }
    }
  });

  currY = (doc as any).lastAutoTable.finalY + 8;

  // --- Payment Note ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Note:  Medicaid pays for Ambulette. Ambulance (with justification).     Medicare only pays for Ambulance', margin, currY);
  currY += 10;
  doc.text('HMO will need a pre-approval for payment of transportation', margin + 35, currY);
  currY += 12;

  // --- Footer Table ---
  autoTable(doc, {
    startY: currY,
    body: [
      [
        { content: `APPOINTMENT DATE:  ${appointment.date}`, styles: { halign: 'left' } },
        { content: `APPOINTMENT TIME:  ${appointment.time}`, styles: { halign: 'left' } },
        { content: `PICK-UP TIME:  ${appointment.pickUpTime || ''}`, styles: { halign: 'left' } }
      ],
      [
        { 
          content: `To be transported by: ${appointment.transportCompany}\nPhone # of Ambulette: _____________________\nInvoice number of MAS (Medical Answering Services for Medicaid resident: ____________________`,
          colSpan: 3,
          styles: { halign: 'left' }
        }
      ]
    ],
    theme: 'grid',
    styles: { 
      fontSize: 8, 
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      fontStyle: 'bold'
    }
  });

  currY = (doc as any).lastAutoTable.finalY + 20;

  // --- Signature Line ---
  doc.setFontSize(9);
  doc.text('Consult Coordinator\'s Signature: __________________________________', margin, currY);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, width - margin - 100, currY);

  doc.save(`Checklist_${appointment.residentName.replace(/\s+/g, '_')}_${appointment.date}.pdf`);
};
