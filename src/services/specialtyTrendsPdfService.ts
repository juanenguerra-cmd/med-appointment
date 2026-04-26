import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Appointment, Facility } from '../types';
import { buildSpecialtyTrends, SpecialtyTrendFilters } from './specialtyTrendsService';

function formatFilterSummary(filters: SpecialtyTrendFilters = {}) {
  const parts = [];
  if (filters.status && filters.status !== 'All') parts.push(`Status: ${filters.status}`);
  else parts.push('Status: All');

  if (filters.startDate || filters.endDate) {
    parts.push(`Date Range: ${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`);
  } else {
    parts.push('Date Range: All Dates');
  }

  return parts.join(' | ');
}

export function generateSpecialtyTrendsPDF(
  appointments: Appointment[],
  filters: SpecialtyTrendFilters = {},
  facility?: Facility,
) {
  const trends = buildSpecialtyTrends(appointments, filters);
  const doc = new jsPDF({ orientation: 'landscape' });
  const width = doc.internal.pageSize.getWidth();
  const generatedAt = new Date().toLocaleString();

  doc.setFillColor(11, 42, 111);
  doc.rect(0, 0, width, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SPECIALTY UTILIZATION REVIEW', 14, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedAt}`, width - 14, 11, { align: 'right' });
  doc.text(facility?.name || 'Facility: Not specified', width - 14, 18, { align: 'right' });

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(facility?.name || 'Facility', 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(formatFilterSummary(filters), 14, 47);

  const topSpecialty = trends.topSpecialty
    ? `${trends.topSpecialty.specialty} (${trends.topSpecialty.count} visits / ${trends.topSpecialty.percentage}%)`
    : 'No specialty data available';

  autoTable(doc, {
    startY: 55,
    head: [['Metric', 'Value']],
    body: [
      ['Total Reviewed Appointments', String(trends.totalIncluded)],
      ['Highest Utilization Specialty', topSpecialty],
      ['Missing Specialty Excluded', String(trends.excludedMissingSpecialty)],
      ['Missing/Invalid Date Excluded', String(trends.excludedMissingDate)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 190 },
    },
    margin: { left: 14, right: 14 },
  });

  const summaryEndY = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: summaryEndY,
    head: [['Rank', 'Specialty', 'Visits', '% of Reviewed Appointments', 'Utilization Flag']],
    body: trends.specialtyRows.map((row, index) => [
      String(index + 1),
      row.specialty,
      String(row.count),
      `${row.percentage}%`,
      index === 0 ? 'Highest Utilization' : row.count >= Math.max(2, (trends.topSpecialty?.count || 1) * 0.5) ? 'High Use' : '',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [11, 42, 111], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 90, fontStyle: 'bold' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 45, halign: 'center' },
      4: { cellWidth: 55 },
    },
    margin: { left: 14, right: 14 },
  });

  const tableEndY = (doc as any).lastAutoTable.finalY + 8;

  const monthlyRows = trends.monthlyRows.slice(-30).map((row) => [row.month, row.specialty, String(row.count)]);
  if (monthlyRows.length > 0) {
    autoTable(doc, {
      startY: tableEndY,
      head: [['Month', 'Specialty', 'Visits']],
      body: monthlyRows,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 110 },
        2: { cellWidth: 25, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Purpose: Review high appointment utilization by specialty for operational planning, scheduling, and referral pattern review.',
    14,
    pageHeight - 10,
  );

  doc.save(`Specialty_Utilization_Review_${new Date().toISOString().slice(0, 10)}.pdf`);
}
