import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Appointment, Resident } from '../types';

export const generateAppointmentPDF = (appointment: Appointment, resident?: Resident) => {
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
  doc.text('Long Beach Nursing & Rehabilitation Center', 15, 28);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 34);

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

export const generateFullReport = (appointments: Appointment[], columns: string[], title: string = 'Appointment Summary Report') => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const width = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(11, 42, 111);
  doc.rect(0, 0, width, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 15, 16);
  
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
