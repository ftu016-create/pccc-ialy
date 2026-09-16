import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AttachedDocument } from '../types';
import { renderPdfPagesToDataUrls } from './pdfRenderUtils';

/**
 * Creates an authentic sample PDF file of "Bảng 02: Sổ theo dõi phương tiện PCCC&CNCH"
 * for Nhà máy Thủy điện Ialy, complete with table layout and data rows.
 */
export async function createSampleBang02Pdf(
  reportMonth = '08/2026',
  soBienBan = '1395/VHIALY'
): Promise<AttachedDocument> {
  const pdfDoc = await PDFDocument.create();

  // A4 Landscape: 841.89 x 595.28 points
  const page = pdfDoc.addPage([841.89, 595.28]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();

  // Draw Header
  page.drawText('CONG TY THUY DIEN IALY', {
    x: 40,
    y: height - 40,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('PHAN XUONG VAN HANH IALY', {
    x: 40,
    y: height - 55,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('CONG HOA XA HOI CHU NGHIA VIET NAM', {
    x: width - 280,
    y: height - 40,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('Doc lap - Tu do - Hanh phuc', {
    x: width - 250,
    y: height - 55,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Title
  const title = `BANG 02: SO THEO DOI PHUONG TIEN PCCC & CNCH - THANG ${reportMonth}`;
  page.drawText(title, {
    x: 160,
    y: height - 90,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.45),
  });

  page.drawText(`(Dinh kem theo Bien ban tu kiem tra PCCC so: ${soBienBan} - Cong ty Thuy dien Ialy)`, {
    x: 210,
    y: height - 108,
    size: 10,
    font: fontItalic,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Draw Table Header
  const startY = height - 130;
  const tableX = 40;
  const tableW = width - 80; // 761.89
  const rowH = 22;

  // Header background
  page.drawRectangle({
    x: tableX,
    y: startY - rowH,
    width: tableW,
    height: rowH,
    color: rgb(0.9, 0.93, 0.96),
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 1,
  });

  // Column definitions
  const cols = [
    { name: 'STT', w: 35, x: tableX },
    { name: 'Ky hieu / Ma phuong tien', w: 170, x: tableX + 35 },
    { name: 'Loai PT', w: 65, x: tableX + 205 },
    { name: 'SL', w: 35, x: tableX + 270 },
    { name: 'Ngay KT', w: 75, x: tableX + 305 },
    { name: 'Tinh trang kiem tra thuc te & Danh gia', w: 265, x: tableX + 380 },
    { name: 'Nguoi kiem tra', w: 116, x: tableX + 645 },
  ];

  cols.forEach((col) => {
    page.drawText(col.name, {
      x: col.x + 4,
      y: startY - rowH + 6,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
  });

  // Sample Rows matching user's actual document
  const rows = [
    ['1', 'BOT-288,3-001IMR-PX1', 'Binh', '1', '23/08/2026', 'Loa voi tot khong bi tac, vo khong ri set, ap luc vung xanh/Dat', 'Nguyen Quang Minh'],
    ['2', 'BOT-288,3-002IMR-PX1', 'Binh', '1', '23/08/2026', 'Loa voi tot khong bi tac, vo khong ri set, ap luc vung xanh/Dat', 'Nguyen Quang Minh'],
    ['3', 'CO2-288,3-001IMR-PX1', 'Binh', '1', '23/08/2026', 'Can du trong luong 15,3kg, loa voi tot, nguyen niem phong/Dat', 'Nguyen Quang Minh'],
    ['4', 'CO2-288,3-002IMR-PX1', 'Binh', '1', '23/08/2026', 'Can du trong luong 15,4kg, loa voi tot, nguyen niem phong/Dat', 'Nguyen Quang Minh'],
    ['5', 'BOT-332-GBA-001-PX1', 'Binh', '1', '25/08/2026', 'Kiem tra loa voi tot khong bi tac, vo khong ri set, ap luc xanh/Dat', 'Vo Quang Minh'],
    ['6', 'BOT-332-GBA-002-PX1', 'Binh', '1', '25/08/2026', 'Kiem tra loa voi tot khong bi tac, vo khong ri set, ap luc xanh/Dat', 'Vo Quang Minh'],
    ['7', 'BOT-332-GBA-003-PX1', 'Binh', '1', '25/08/2026', 'Kiem tra loa voi tot khong bi tac, vo khong ri set, ap luc xanh/Dat', 'Vo Quang Minh'],
    ['8', 'BOT-332-GBA-004-PX1', 'Binh', '1', '25/08/2026', 'Kiem tra loa voi tot khong bi tac, vo khong ri set, ap luc xanh/Dat', 'Vo Quang Minh'],
    ['9', 'Den chi dan thoat nan (EXIT)', 'Cai', '10', '25/08/2026', 'Quan sat bang mat, cat nguon AC kiem tra den sang tot', 'Vo Quang Minh'],
    ['10', 'Be nuoc chua chay 350m3', 'Be', '1', '25/08/2026', 'Quan sat bang mat, muc nuoc day, van khoa dam bao', 'Thai Tran Hoang Vu'],
    ['11', 'Hong nuoc chua chay vach tuong', 'Hong', '21', '25/08/2026', 'Quan sat bang mat, 21 hong hoat dong binh thuong', 'Thai Tran Hoang Vu'],
    ['12', 'Voi phun chua chay D65', 'Cuon', '21', '25/08/2026', 'Kiem tra tinh trang ben ngoai binh thuong, khong muc rach', 'Thai Tran Hoang Vu'],
    ['13', 'Lang phun chua chay D65', 'Cai', '21', '25/08/2026', 'Kiem tra tinh trang ben ngoai binh thuong, ren khit', 'Thai Tran Hoang Vu'],
    ['14', 'He thong chua chay cap dau 500kV', 'HT', '1', '25/08/2026', 'Tuy nen cap dau so 1 tinh trang tot, san sang hoat dong', 'A Ran'],
    ['15', 'Lang chua chay Cao trinh 348m', 'Cai', '4', '23/08/2026', 'Co 01 lang bi vo da bao don vi, cho bo sung thay the', 'Nguyen Khanh Toan'],
    ['16', 'Binh OXY Cao trinh 309m', 'Bo', '2', '26/08/2026', 'Kiem tra 02 binh ap suat ngoai vung xanh, can nap khi / hieu chuan', 'Pham Dinh Duc'],
  ];

  let currentY = startY - rowH;
  rows.forEach((row, rIdx) => {
    currentY -= rowH;
    // Row background zebra
    page.drawRectangle({
      x: tableX,
      y: currentY,
      width: tableW,
      height: rowH,
      color: rIdx % 2 === 1 ? rgb(0.97, 0.98, 0.99) : rgb(1, 1, 1),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 0.5,
    });

    row.forEach((cell, cIdx) => {
      const col = cols[cIdx];
      const isDefect = cell.includes('bi vo') || cell.includes('ngoai vung xanh');
      page.drawText(cell, {
        x: col.x + 4,
        y: currentY + 6,
        size: 8.5,
        font: isDefect ? fontBold : fontRegular,
        color: isDefect ? rgb(0.8, 0.1, 0.1) : rgb(0.15, 0.15, 0.15),
      });
    });
  });

  // Footer notes & signature
  page.drawText('Ghi chu: Tinh trang phuong tien duoc kiem tra thuc te va cap nhat vao So theo doi dinh ky cua Phan xuong.', {
    x: 40,
    y: currentY - 20,
    size: 9,
    font: fontItalic,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('NGUOI LAP BANG', {
    x: 100,
    y: currentY - 45,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('(Ky va ghi ro ho ten)', {
    x: 88,
    y: currentY - 58,
    size: 8.5,
    font: fontItalic,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText('Tran Thanh Chuong', {
    x: 85,
    y: currentY - 95,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('KT. QUAN DOC', {
    x: width - 200,
    y: currentY - 45,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('PHO QUAN DOC', {
    x: width - 203,
    y: currentY - 58,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('Nguyen Hoang Phi', {
    x: width - 210,
    y: currentY - 95,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const pdfBytes = await pdfDoc.save();

  // Convert to base64 data URL
  let binary = '';
  const len = pdfBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(pdfBytes[i]);
  }
  const base64 = btoa(binary);
  const dataUrl = `data:application/pdf;base64,${base64}`;

  // Render PNG page images
  let pageImages: string[] = [];
  try {
    pageImages = await renderPdfPagesToDataUrls(dataUrl, 5, 1.8);
  } catch (e) {
    console.warn('Cannot render sample PDF pages:', e);
  }

  const filename = `Bang 02 so theo doi phuong tien PCCC&CNCH Ialy T${reportMonth.replace(/\//g, '_')}.pdf`;

  return {
    id: `sample-pdf-${Date.now()}`,
    name: filename,
    type: 'pdf',
    sizeBytes: pdfBytes.length,
    pdfData: dataUrl,
    pageCount: 1,
    pageImages,
    uploadedAt: new Date().toLocaleDateString('vi-VN'),
    includedInExport: true,
    note: 'Sổ theo dõi phương tiện PCCC&CNCH mẫu chuẩn EVN',
  };
}
