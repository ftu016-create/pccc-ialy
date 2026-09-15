import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeightRule,
  TableBorders,
  ITableCellBorders,
  IBorderOptions,
  ImageRun,
  PageOrientation,
} from 'docx';
import saveAs from 'file-saver';
import { ReportData } from '../types';
import { getSignatureForPerson } from '../data/sampleSignatures';
import { signatureToPngBytes } from '../utils/signatureUtils';
import { imageToPngBytes, getImageDimensionsAndBytes, getReportMonthDisplay } from '../utils/photoUtils';
import { renderPdfPagesToDataUrls } from '../utils/pdfRenderUtils';

const FONT_NAME = 'Times New Roman';
const SIZE_MAIN = 26; // 13pt in half-points
const SIZE_SUB = 22; // 11pt
const SIZE_TITLE = 28; // 14pt

// Vietnamese Administrative Standard (Nghị định 30/2020/NĐ-CP):
// Margin: Left 3.0cm (1701 dxa), Top/Bottom/Right 2.0cm (1134 dxa)
// First-line indent: 1.2cm (680 dxa)
const MARGIN_LEFT = 1701;
const MARGIN_RIGHT = 1134;
const MARGIN_TOP = 1134;
const MARGIN_BOTTOM = 1134;
const INDENT_FIRST_LINE = 680;

const formatPersonName = (rawName: string) => {
  const clean = rawName.trim().replace(/^-\s*/, '');
  if (clean.toLowerCase().startsWith('ông')) {
    return `- ${clean}`;
  }
  return `- Ông: ${clean}`;
};

const formatPersonRole = (rawRole: string) => {
  const clean = rawRole.trim();
  if (clean.toLowerCase().startsWith('chức vụ:')) {
    return clean;
  }
  return `Chức vụ: ${clean}`;
};

const tableCellPadding = {
  top: 100,
  bottom: 100,
  left: 120,
  right: 120,
};

const borderThin: IBorderOptions = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000',
};

const borderNone: IBorderOptions = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const cellAllBorders: ITableCellBorders = {
  top: borderThin,
  bottom: borderThin,
  left: borderThin,
  right: borderThin,
};

const cellNoBorders: ITableCellBorders = {
  top: borderNone,
  bottom: borderNone,
  left: borderNone,
  right: borderNone,
};

export async function exportReportToDocx(report: ReportData) {
  // Build header table
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            margins: tableCellPadding,
            borders: cellNoBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CÔNG TY THỦY ĐIỆN IALY', bold: true, font: FONT_NAME, size: SIZE_SUB }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'PX VẬN HÀNH IALY', bold: true, font: FONT_NAME, size: SIZE_SUB }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [
                  new TextRun({ text: `Số: ${report.so || '.../VHIALY'}`, font: FONT_NAME, size: SIZE_MAIN }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            margins: tableCellPadding,
            borders: cellNoBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, font: FONT_NAME, size: SIZE_SUB }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, font: FONT_NAME, size: SIZE_SUB, underline: {} }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: `${report.place || 'Gia Lai'}, ngày ${report.header_day} tháng ${report.header_month} năm ${report.header_year}`,
                    italics: true,
                    font: FONT_NAME,
                    size: SIZE_MAIN,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // People 2-column borderless table (Tên và Chức vụ)
  // Name 40%, Role 60% at 12pt (size 24) so that all names and long roles comfortably fit on a SINGLE line
  const peopleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: report.people.map(
      (p) =>
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: cellNoBorders,
              margins: { top: 25, bottom: 25, left: 340, right: 30 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: formatPersonName(p.name),
                      font: FONT_NAME,
                      size: 24, // 12pt (chuẩn NĐ 30/2020 cho danh sách)
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              borders: cellNoBorders,
              margins: { top: 25, bottom: 25, left: 30, right: 30 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: formatPersonRole(p.role),
                      font: FONT_NAME,
                      size: 24, // 12pt
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  });

  // Inspection areas paragraphs with 0.6cm indent so text stays cleanly on 1 line
  const areaLines = (report.inspection_areas || '').split('\n').filter(Boolean);
  const areaParagraphs = areaLines.map(
    (line) =>
      new Paragraph({
        indent: { firstLine: 360 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: line, font: FONT_NAME, size: SIZE_MAIN })],
      })
  );

  // Table 1: Equipments
  const equipHeaderRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          rowSpan: 2,
          width: { size: 7, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tên trang bị phương tiện, hệ thống', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Số lượng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          columnSpan: 2,
          width: { size: 22, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tình trạng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 14, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ghi chú', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đạt', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không đạt', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
      ],
    }),
  ];

  const equipDataRows = report.equip.map((item) => {
    if (item.isHeader || ['I', 'II', 'III', 'IV', 'V'].includes(item.stt.trim())) {
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 7, type: WidthType.PERCENTAGE },
            borders: cellAllBorders,
            margins: tableCellPadding,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, bold: true, font: FONT_NAME, size: SIZE_MAIN })] })],
          }),
          new TableCell({
            columnSpan: 5,
            borders: cellAllBorders,
            margins: tableCellPadding,
            children: [new Paragraph({ children: [new TextRun({ text: item.name, bold: true, font: FONT_NAME, size: SIZE_MAIN })] })],
          }),
        ],
      });
    }

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 7, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.name, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.qty, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.ok, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.bad, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.note || '', font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
      ],
    });
  });

  const equipTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...equipHeaderRows, ...equipDataRows],
  });

  // Table 2: Fire
  const fireHeaderRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          rowSpan: 2,
          width: { size: 7, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nội dung duy trì', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Số lượng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          columnSpan: 2,
          width: { size: 16, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tình trạng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ghi chú', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đảm bảo', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không đảm bảo', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
      ],
    }),
  ];

  const fireDataRows = report.fire.map((item) => {
    const qtyParagraphs = (item.qty || '').split('\n').map((l) => new Paragraph({ children: [new TextRun({ text: l, font: FONT_NAME, size: SIZE_MAIN })] }));
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 7, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.name, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: qtyParagraphs.length ? qtyParagraphs : [new Paragraph({ text: '' })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.ok, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.bad, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.note || '', font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
      ],
    });
  });

  const fireTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...fireHeaderRows, ...fireDataRows],
  });

  // Table 3: Escape
  const escapeHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        borders: cellAllBorders,
        margins: tableCellPadding,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        borders: cellAllBorders,
        margins: tableCellPadding,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nội dung duy trì', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
      }),
      new TableCell({
        width: { size: 17, type: WidthType.PERCENTAGE },
        borders: cellAllBorders,
        margins: tableCellPadding,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tình trạng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
      }),
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: cellAllBorders,
        margins: tableCellPadding,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ghi chú', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
      }),
    ],
  });

  const escapeDataRows = report.escape.map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.name, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 17, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.status, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.note || '', font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
      ],
    });
  });

  const escapeTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [escapeHeaderRow, ...escapeDataRows],
  });

  // Signature Table (2 columns)
  const memberSigners = report.people.filter((p) => p.name.trim() && p.name.trim() !== report.manager.trim());
  const numRows = Math.ceil(memberSigners.length / 2);

  // Pre-load / convert signatures to PNG byte arrays for Word
  const memberSigBytesList = await Promise.all(
    memberSigners.map(async (p) => {
      const sigUrl = getSignatureForPerson(p.name, p.signatureImage);
      return sigUrl ? await signatureToPngBytes(sigUrl, 170, 60) : null;
    })
  );

  const managerSigUrl = getSignatureForPerson(report.manager, report.manager_signature);
  const managerSigBytes = managerSigUrl ? await signatureToPngBytes(managerSigUrl, 220, 80) : null;

  const signatureRows: TableRow[] = [];

  for (let i = 0; i < numRows; i++) {
    const p1 = memberSigners[i * 2];
    const p2 = memberSigners[i * 2 + 1];
    const sigBytes1 = memberSigBytesList[i * 2];
    const sigBytes2 = memberSigBytesList[i * 2 + 1];

    const p1Children: Paragraph[] = [];
    if (p1) {
      p1Children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: p1.name.startsWith('Ông') ? p1.name : `- Ông: ${p1.name}`,
              font: FONT_NAME,
              size: SIZE_MAIN,
            }),
          ],
        })
      );

      if (sigBytes1) {
        p1Children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
            children: [
              new ImageRun({
                data: sigBytes1,
                transformation: { width: 140, height: 46 },
                type: 'png',
              }),
            ],
          })
        );
      } else {
        p1Children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: '(Đã ký)',
                italics: true,
                color: '888888',
                font: FONT_NAME,
                size: 20,
              }),
            ],
          })
        );
      }
    } else {
      p1Children.push(new Paragraph({ text: '' }));
    }

    const p2Children: Paragraph[] = [];
    if (p2) {
      p2Children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: p2.name.startsWith('Ông') ? p2.name : `- Ông: ${p2.name}`,
              font: FONT_NAME,
              size: SIZE_MAIN,
            }),
          ],
        })
      );

      if (sigBytes2) {
        p2Children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
            children: [
              new ImageRun({
                data: sigBytes2,
                transformation: { width: 140, height: 46 },
                type: 'png',
              }),
            ],
          })
        );
      } else {
        p2Children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: '(Đã ký)',
                italics: true,
                color: '888888',
                font: FONT_NAME,
                size: 20,
              }),
            ],
          })
        );
      }
    } else {
      p2Children.push(new Paragraph({ text: '' }));
    }

    signatureRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
            children: p1Children,
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
            children: p2Children,
          }),
        ],
      })
    );
  }

  // Manager cell children with embedded signature image
  const managerCellChildren: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: report.signer_title || 'KT. QUẢN ĐỐC',
          bold: true,
          font: FONT_NAME,
          size: SIZE_MAIN,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: report.signer_role || 'PHÓ QUẢN ĐỐC',
          bold: true,
          font: FONT_NAME,
          size: SIZE_MAIN,
        }),
      ],
    }),
  ];

  if (managerSigBytes) {
    managerCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [
          new ImageRun({
            data: managerSigBytes,
            transformation: { width: 170, height: 56 },
            type: 'png',
          }),
        ],
      })
    );
  } else {
    managerCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun({
            text: '(Chữ ký)',
            italics: true,
            color: '888888',
            font: FONT_NAME,
            size: 20,
          }),
        ],
      })
    );
  }

  managerCellChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: report.manager || 'Nguyễn Hoàng Phi',
          bold: true,
          font: FONT_NAME,
          size: SIZE_MAIN,
        }),
      ],
    })
  );

  // Bottom final signature row: Nơi nhận on left, KT. QUẢN ĐỐC on right
  const finalSignRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: cellNoBorders,
        margins: { top: 60, bottom: 40, left: 40, right: 40 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Nơi nhận:', bold: true, italics: true, font: FONT_NAME, size: SIZE_SUB })],
          }),
          new Paragraph({
            children: [new TextRun({ text: '- HCLĐ (để phối hợp);', font: FONT_NAME, size: SIZE_SUB })],
          }),
          new Paragraph({
            children: [new TextRun({ text: '- Lưu: VHIALY.', font: FONT_NAME, size: SIZE_SUB })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: cellNoBorders,
        margins: { top: 60, bottom: 40, left: 40, right: 40 },
        children: managerCellChildren,
      }),
    ],
  });

  const fullSignTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: [...signatureRows, finalSignRow],
  });

  // Photo Annex & Attached Document Pages
  const photoAppendixElements: (Paragraph | Table)[] = [];
  const displayMonth = getReportMonthDisplay(report.report_month, report.header_month);

  // --- PHỤ LỤC I: HÌNH ẢNH THOÁT NẠN THÁNG ... (4 HÌNH / TRANG) ---
  if (report.photos && report.photos.length > 0) {
    const totalPhotos = report.photos.length;

    // Process photos in chunks of 4 (strictly 4 photos per page)
    for (let c = 0; c < totalPhotos; c += 4) {
      const pageIndex = Math.floor(c / 4) + 1;
      const chunk = report.photos.slice(c, c + 4);

      // Page Header for each 4-photo page
      photoAppendixElements.push(
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.CENTER,
          spacing: { before: 180, after: 40 },
          children: [
            new TextRun({
              text: `PHỤ LỤC I: HÌNH ẢNH THOÁT NẠN THÁNG ${displayMonth}`,
              bold: true,
              font: FONT_NAME,
              size: SIZE_TITLE,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 20, after: 120 },
          children: [
            new TextRun({
              text: `(Kèm theo Biên bản tự kiểm tra số: ${report.so || '.../VHIALY'} ngày ${report.header_day} tháng ${report.header_month} năm ${report.header_year} của PX Vận hành Ialy)`,
              italics: true,
              font: FONT_NAME,
              size: SIZE_MAIN,
            }),
          ],
        })
      );

      // Build 2 rows of 2 columns for this page
      const pageRows: TableRow[] = [];
      for (let r = 0; r < chunk.length; r += 2) {
        const p1 = chunk[r];
        const p2 = chunk[r + 1];
        const globalIdx1 = c + r;
        const globalIdx2 = c + r + 1;

        const p1Bytes = await imageToPngBytes(p1.imageData, 320, 200);
        const p1Status =
          p1.status === 'passed'
            ? 'Đạt - Đảm bảo'
            : p1.status === 'warning'
            ? 'Cần lưu ý'
            : 'Không đạt';

        const p1Children: Paragraph[] = [];
        if (p1Bytes) {
          p1Children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 40 },
              children: [
                new ImageRun({
                  data: p1Bytes,
                  transformation: { width: 255, height: 160 },
                  type: 'png',
                }),
              ],
            })
          );
        }
        p1Children.push(
          new Paragraph({
            spacing: { before: 20, after: 15 },
            children: [
              new TextRun({
                text: `Hình ${globalIdx1 + 1}: ${p1.title}`,
                bold: true,
                font: FONT_NAME,
                size: SIZE_SUB,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 15, after: 15 },
            children: [
              new TextRun({ text: 'Vị trí: ', bold: true, font: FONT_NAME, size: SIZE_SUB }),
              new TextRun({ text: p1.location, font: FONT_NAME, size: SIZE_SUB }),
            ],
          }),
          new Paragraph({
            spacing: { before: 15, after: 15 },
            children: [
              new TextRun({ text: 'Đánh giá: ', bold: true, font: FONT_NAME, size: SIZE_SUB }),
              new TextRun({ text: p1Status, font: FONT_NAME, size: SIZE_SUB }),
            ],
          }),
          new Paragraph({
            spacing: { before: 15, after: 30 },
            children: [
              new TextRun({ text: 'Ghi nhận: ', italics: true, font: FONT_NAME, size: SIZE_SUB }),
              new TextRun({ text: p1.description, font: FONT_NAME, size: SIZE_SUB }),
            ],
          })
        );

        const cells: TableCell[] = [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellAllBorders,
            margins: tableCellPadding,
            children: p1Children,
          }),
        ];

        if (p2) {
          const p2Bytes = await imageToPngBytes(p2.imageData, 320, 200);
          const p2Status =
            p2.status === 'passed'
              ? 'Đạt - Đảm bảo'
              : p2.status === 'warning'
              ? 'Cần lưu ý'
              : 'Không đạt';

          const p2Children: Paragraph[] = [];
          if (p2Bytes) {
            p2Children.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 30, after: 40 },
                children: [
                  new ImageRun({
                    data: p2Bytes,
                    transformation: { width: 255, height: 160 },
                    type: 'png',
                  }),
                ],
              })
            );
          }
          p2Children.push(
            new Paragraph({
              spacing: { before: 20, after: 15 },
              children: [
                new TextRun({
                  text: `Hình ${globalIdx2 + 1}: ${p2.title}`,
                  bold: true,
                  font: FONT_NAME,
                  size: SIZE_SUB,
                }),
              ],
            }),
            new Paragraph({
              spacing: { before: 15, after: 15 },
              children: [
                new TextRun({ text: 'Vị trí: ', bold: true, font: FONT_NAME, size: SIZE_SUB }),
                new TextRun({ text: p2.location, font: FONT_NAME, size: SIZE_SUB }),
              ],
            }),
            new Paragraph({
              spacing: { before: 15, after: 15 },
              children: [
                new TextRun({ text: 'Đánh giá: ', bold: true, font: FONT_NAME, size: SIZE_SUB }),
                new TextRun({ text: p2Status, font: FONT_NAME, size: SIZE_SUB }),
              ],
            }),
            new Paragraph({
              spacing: { before: 15, after: 30 },
              children: [
                new TextRun({ text: 'Ghi nhận: ', italics: true, font: FONT_NAME, size: SIZE_SUB }),
                new TextRun({ text: p2.description, font: FONT_NAME, size: SIZE_SUB }),
              ],
            })
          );

          cells.push(
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cellAllBorders,
              margins: tableCellPadding,
              children: p2Children,
            })
          );
        } else {
          cells.push(
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cellAllBorders,
              margins: tableCellPadding,
              children: [new Paragraph({ children: [] })],
            })
          );
        }

        pageRows.push(new TableRow({ cantSplit: true, children: cells }));
      }

      photoAppendixElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          rows: pageRows,
        })
      );
    }

    if (report.attachedPdfs && report.attachedPdfs.length > 0) {
      photoAppendixElements.push(
        new Paragraph({
          spacing: { before: 100, after: 50 },
          children: [
            new TextRun({
              text: 'Hồ sơ, sổ theo dõi kèm theo: ',
              bold: true,
              font: FONT_NAME,
              size: SIZE_MAIN,
            }),
            new TextRun({
              text: report.attachedPdfs.map((pdf) => pdf.name).join('; ') + '.',
              italics: true,
              font: FONT_NAME,
              size: SIZE_MAIN,
            }),
          ],
        })
      );
    }
  }

  // --- PHỤ LỤC II: CHÈN CÁC FILE PDF ĐÍNH KÈM VÀO PHÂN ĐOẠN NẰM NGANG (.DOCX LANDSCAPE) ---
  const pdfAppendixElements: (Paragraph | Table)[] = [];

  if (report.attachedPdfs && report.attachedPdfs.length > 0) {
    const pdfsToInsert = report.attachedPdfs.filter((p) => p.includedInExport !== false);

    for (let pdfIndex = 0; pdfIndex < pdfsToInsert.length; pdfIndex++) {
      const pdfItem = pdfsToInsert[pdfIndex];
      let pageImages = pdfItem.pageImages || [];
      // If pageImages not yet generated, render them now
      if (pageImages.length === 0 && pdfItem.pdfData) {
        try {
          pageImages = await renderPdfPagesToDataUrls(pdfItem.pdfData, 20, 1.3);
        } catch (err) {
          console.error(`Lỗi render trang PDF cho Word: ${pdfItem.name}`, err);
        }
      }

      if (pageImages && pageImages.length > 0) {
        for (let pageIdx = 0; pageIdx < pageImages.length; pageIdx++) {
          const pageImg = pageImages[pageIdx];
          const imgInfo = await getImageDimensionsAndBytes(pageImg);

          if (imgInfo && imgInfo.bytes) {
            // A4 Landscape available area: width ~750 px, height ~465 px
            const maxWidth = 750;
            const maxHeight = 465;
            const srcRatio = imgInfo.aspectRatio || 1.414;

            let targetW: number;
            let targetH: number;

            if (srcRatio >= 1.0) {
              if (maxWidth / srcRatio <= maxHeight) {
                targetW = maxWidth;
                targetH = Math.round(maxWidth / srcRatio);
              } else {
                targetH = maxHeight;
                targetW = Math.round(maxHeight * srcRatio);
              }
            } else {
              targetH = maxHeight;
              targetW = Math.round(maxHeight * srcRatio);
            }

            const isFirstElement = pdfIndex === 0 && pageIdx === 0;

            pdfAppendixElements.push(
              new Paragraph({
                pageBreakBefore: !isFirstElement,
                alignment: AlignmentType.CENTER,
                spacing: { before: isFirstElement ? 40 : 60, after: 20 },
                children: [
                  new TextRun({
                    text: 'PHỤ LỤC II: HỒ SƠ, TÀI LIỆU ĐÍNH KÈM',
                    bold: true,
                    font: FONT_NAME,
                    size: SIZE_TITLE,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 10, after: 40 },
                children: [
                  new TextRun({
                    text: pdfItem.name,
                    bold: true,
                    font: FONT_NAME,
                    size: SIZE_MAIN,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 10, after: 30 },
                children: [
                  new ImageRun({
                    data: imgInfo.bytes,
                    transformation: { width: targetW, height: targetH },
                    type: 'png',
                  }),
                ],
              })
            );
          }
        }
      } else {
        const isFirstElement = pdfIndex === 0;
        pdfAppendixElements.push(
          new Paragraph({
            pageBreakBefore: !isFirstElement,
            alignment: AlignmentType.CENTER,
            spacing: { before: isFirstElement ? 60 : 100, after: 30 },
            children: [
              new TextRun({
                text: 'PHỤ LỤC II: HỒ SƠ, TÀI LIỆU ĐÍNH KÈM',
                bold: true,
                font: FONT_NAME,
                size: SIZE_TITLE,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20, after: 60 },
            children: [
              new TextRun({
                text: pdfItem.name,
                bold: true,
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20, after: 100 },
            children: [
              new TextRun({
                text: '(Tài liệu định dạng PDF được lưu kèm theo Biên bản kiểm tra PCCC)',
                italics: true,
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          })
        );
      }
    }
  }

  // Build sections
  const sections: any[] = [
    {
      properties: {
        page: {
          margin: {
            top: MARGIN_TOP, // 2.0 cm (1134 dxa)
            bottom: MARGIN_BOTTOM, // 2.0 cm (1134 dxa)
            left: MARGIN_LEFT, // 3.0 cm (1701 dxa)
            right: MARGIN_RIGHT, // 2.0 cm (1134 dxa)
          },
        },
      },
      children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Mẫu số PC02', italics: true, font: FONT_NAME, size: SIZE_SUB })],
          }),
          headerTable,
          new Paragraph({ text: '', spacing: { before: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'BIÊN BẢN TỰ KIỂM TRA',
                bold: true,
                font: FONT_NAME,
                size: SIZE_TITLE,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: `Về phòng cháy, chữa cháy tháng ${report.report_month}`,
                bold: true,
                font: FONT_NAME,
                size: SIZE_TITLE,
              }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: `Hồi ${report.start_h} giờ ${report.start_p} phút, ngày ${report.start_day} tháng ${report.start_month} năm ${report.start_year}`,
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: 'Chúng tôi gồm:', bold: true, font: FONT_NAME, size: SIZE_MAIN })],
          }),
          peopleTable,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 40 },
            children: [new TextRun({ text: 'Đã tiến hành kiểm tra công tác PCCC&CNCH tại các khu vực sau:', font: FONT_NAME, size: SIZE_MAIN })],
          }),
          ...areaParagraphs,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 120, after: 60 },
            children: [new TextRun({ text: 'I. Nội dung và kết quả kiểm tra như sau', bold: true, font: FONT_NAME, size: SIZE_MAIN })],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: '1. Duy trì hoạt động các phương tiện, hệ thống phòng cháy, chữa cháy, cứu nạn, cứu hộ, hệ thống điện phục vụ phòng cháy và chữa cháy; nguồn nước chữa cháy.',
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          equipTable,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 120 },
            children: [
              new TextRun({
                text: `Ghi chú: ${report.equip_note || 'Thống kê chi tiết trang bị và duy trì các phương tiện, dụng cụ, hệ thống nêu trên như Phụ lục kèm theo biên bản này.'}`,
                italics: true,
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: '2. Duy trì điều kiện an toàn phòng cháy trong sử dụng nguồn lửa, nguồn nhiệt, thiết bị, dụng cụ sinh lửa, sinh nhiệt, chất dễ cháy, nổ.',
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          fireTable,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: '3. Duy trì giải pháp thoát nạn, ngăn cháy, chống cháy lan, chống khói.',
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          escapeTable,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: '4. Chấp hành nội quy phòng cháy, chữa cháy, cứu hộ, cứu nạn',
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 40, after: 80 },
            children: [new TextRun({ text: report.compliance, font: FONT_NAME, size: SIZE_MAIN })],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: 'II. Kiến nghị: ', bold: true, font: FONT_NAME, size: SIZE_MAIN }),
              new TextRun({ text: report.recommendations.join(' '), font: FONT_NAME, size: SIZE_MAIN }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 120 },
            children: [
              new TextRun({
                text: `Biên bản kết thúc lúc ${report.end_h} giờ ${report.end_p} phút cùng ngày./.`,
                italics: true,
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [new TextRun({ text: 'Các thành viên kiểm tra:', bold: true, font: FONT_NAME, size: SIZE_MAIN })],
          }),
          fullSignTable,
          ...photoAppendixElements,
        ],
      },
    ];

    if (pdfAppendixElements.length > 0) {
      sections.push({
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838, // A4 Landscape width (29.7 cm)
              height: 11906, // A4 Landscape height (21.0 cm)
            },
            margin: {
              top: 720,    // ~1.27 cm (0.5 in)
              bottom: 720, // ~1.27 cm (0.5 in)
              left: 850,   // ~1.5 cm
              right: 850,  // ~1.5 cm
            },
          },
        },
        children: pdfAppendixElements,
      });
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: FONT_NAME,
              size: SIZE_MAIN,
            },
          },
        },
      },
      sections,
    });

  const blob = await Packer.toBlob(doc);
  const safeMonth = (report.report_month || 'T_').replace(/[^0-9A-Za-z_-]/g, '_');
  const filename = `VHIALY_Bien_ban_tu_kiem_tra_PCCC_CNCH_${safeMonth}.docx`;
  saveAs(blob, filename);
}
