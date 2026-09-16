import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import saveAs from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import { ReportData } from '../types';

/**
 * Exports an HTML element as an A4 PDF document with multi-page support,
 * and automatically merges any attached PDF documents (e.g. Sổ theo dõi Bảng I, II)
 * into a single unified PDF file.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename = 'Bien-ban-kiem-tra-PCCC.pdf',
  report?: ReportData
): Promise<void> {
  // Hide HTML-rendered PDF page previews during html2canvas capture to avoid duplicate pages
  // because attached PDFs will be merged as pristine vector PDF pages via pdf-lib
  const attachedPreviewPages = element.querySelectorAll('.pdf-attached-page-preview');
  attachedPreviewPages.forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  let canvas: HTMLCanvasElement;
  try {
    // Capture canvas with 2x scale for sharp text and signature rendering
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
    });
  } finally {
    // Always restore preview pages for UI view
    attachedPreviewPages.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
  }

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

  // Check if there are attached PDFs to merge
  const attachedPdfsToMerge = (report?.attachedPdfs || []).filter(
    (item) => item.pdfData && item.includedInExport !== false
  );

  if (attachedPdfsToMerge.length === 0) {
    pdf.save(filename);
    return;
  }

  try {
    // Merge base report PDF with attached PDFs
    const basePdfArrayBuffer = pdf.output('arraybuffer');
    const mergedDoc = await PDFDocument.load(basePdfArrayBuffer, { ignoreEncryption: true });

    let anyMerged = false;
    for (const att of attachedPdfsToMerge) {
      if (!att.pdfData) continue;
      try {
        const base64Part = att.pdfData.includes(',') ? att.pdfData.split(',')[1] : att.pdfData;
        let cleanBase64 = base64Part.replace(/[\s\r\n]+/g, '');
        while (cleanBase64.length % 4 !== 0) {
          cleanBase64 += '=';
        }
        const binary = atob(cleanBase64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const donorDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pageCount = donorDoc.getPageCount();
        if (pageCount > 0) {
          const A4_LANDSCAPE: [number, number] = [841.89, 595.28];

          for (let pIndex = 0; pIndex < pageCount; pIndex++) {
            const donorPage = donorDoc.getPage(pIndex);
            const { width, height } = donorPage.getSize();
            const rotation = donorPage.getRotation().angle;

            // Check if visually landscape (taking rotation into account)
            const isVisuallyLandscape =
              rotation === 90 || rotation === 270 ? width < height : width >= height;

            if (isVisuallyLandscape) {
              // Already landscape: copy directly preserving vector fidelity
              const [copiedPage] = await mergedDoc.copyPages(donorDoc, [pIndex]);
              mergedDoc.addPage(copiedPage);
            } else {
              // If source page is portrait (e.g. vertical scan of wide logbook):
              // Embed onto an A4 Landscape page (297mm x 210mm) centered and scaled
              // to ensure uniform landscape presentation for management submission
              try {
                const [embeddedPage] = await mergedDoc.embedPages([donorPage]);
                const newPage = mergedDoc.addPage(A4_LANDSCAPE);

                const marginX = 40;
                const marginY = 30;
                const maxWidth = 841.89 - marginX * 2;
                const maxHeight = 595.28 - marginY * 2;

                const scale = Math.min(maxWidth / width, maxHeight / height);
                const targetW = width * scale;
                const targetH = height * scale;

                const x = (841.89 - targetW) / 2;
                const y = (595.28 - targetH) / 2;

                newPage.drawPage(embeddedPage, {
                  x,
                  y,
                  width: targetW,
                  height: targetH,
                });
              } catch {
                // Fallback: copy directly if embedPages cannot process contents
                const [copiedPage] = await mergedDoc.copyPages(donorDoc, [pIndex]);
                mergedDoc.addPage(copiedPage);
              }
            }
          }
          anyMerged = true;
        }
      } catch (err) {
        console.error(`Không thể ghép trang từ file đính kèm: ${att.name}`, err);

        // Fallback: embed rendered pageImages if present on A4 Landscape
        if (att.pageImages && att.pageImages.length > 0) {
          const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
          for (const pageImg of att.pageImages) {
            try {
              const isPng = pageImg.startsWith('data:image/png');
              const base64Part = pageImg.includes(',') ? pageImg.split(',')[1] : pageImg;
              const binary = atob(base64Part.replace(/[\s\r\n]+/g, ''));
              const imgBytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                imgBytes[i] = binary.charCodeAt(i);
              }

              const image = isPng ? await mergedDoc.embedPng(imgBytes) : await mergedDoc.embedJpg(imgBytes);
              const newPage = mergedDoc.addPage(A4_LANDSCAPE);

              const imgDims = image.scale(1);
              const maxWidth = 841.89 - 80;
              const maxHeight = 595.28 - 60;
              const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height);
              const targetW = imgDims.width * scale;
              const targetH = imgDims.height * scale;

              const x = (841.89 - targetW) / 2;
              const y = (595.28 - targetH) / 2;

              newPage.drawImage(image, {
                x,
                y,
                width: targetW,
                height: targetH,
              });
              anyMerged = true;
            } catch (imgErr) {
              console.error('Lỗi khi fallback embed page image:', imgErr);
            }
          }
        }
      }
    }

    if (!anyMerged) {
      pdf.save(filename);
      return;
    }

    const mergedBytes = await mergedDoc.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    try {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 10000);
    } catch {
      saveAs(blob, filename);
    }
  } catch (error) {
    console.warn('Lỗi khi merge PDF, fallback xuất PDF cơ bản:', error);
    pdf.save(filename);
  }
}

export function generatePdfFilename(report: ReportData): string {
  const monthStr = (report.report_month || '07-2026').replace(/[\/\\]/g, '-').trim();
  const soStr = (report.so || '1209').replace(/[\/\\]/g, '-').trim();
  return `Bien-ban-PCCC-Thang-${monthStr}-So-${soStr}.pdf`;
}
