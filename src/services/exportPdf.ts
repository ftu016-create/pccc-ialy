import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportData } from '../types';

/**
 * Exports an HTML element as an A4 PDF document with multi-page support.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename = 'Bien-ban-kiem-tra-PCCC.pdf'
): Promise<void> {
  // Capture canvas with 2x scale for sharp text and signature rendering
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Page 1
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  // Subsequent pages if content overflows A4 height
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

export function generatePdfFilename(report: ReportData): string {
  const monthStr = (report.report_month || '07-2026').replace(/[\/\\]/g, '-').trim();
  const soStr = (report.so || '1209').replace(/[\/\\]/g, '-').trim();
  return `Bien-ban-PCCC-Thang-${monthStr}-So-${soStr}.pdf`;
}
