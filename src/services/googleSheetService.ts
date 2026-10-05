/**
 * Google Sheet Integration Service for PCCC Ialy
 * Handles parsing Google Sheet links, fetching data via CSV/gviz, and parsing tabular data.
 */

export interface GoogleSheetParseResult {
  sheetId: string | null;
  gid: string | null;
  isValid: boolean;
  exportCsvUrl: string | null;
}

export function parseGoogleSheetUrl(url: string): GoogleSheetParseResult {
  if (!url || typeof url !== 'string') {
    return { sheetId: null, gid: null, isValid: false, exportCsvUrl: null };
  }

  const clean = url.trim();

  // Pattern 1: https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID}
  const idMatch = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch || !idMatch[1]) {
    return { sheetId: null, gid: null, isValid: false, exportCsvUrl: null };
  }

  const sheetId = idMatch[1];

  // Extract GID
  let gid: string | null = null;
  const gidParamMatch = clean.match(/[?&#]gid=([0-9]+)/);
  if (gidParamMatch && gidParamMatch[1]) {
    gid = gidParamMatch[1];
  }

  const gidParam = gid ? `&gid=${gid}` : '';
  const exportCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;

  return {
    sheetId,
    gid,
    isValid: true,
    exportCsvUrl,
  };
}

/**
 * Robust CSV/TSV Parser that handles quoted multi-line fields, commas, tabs, and semicolons.
 */
export function parseCsvOrTsv(text: string): { headers: string[]; rows: string[][] } {
  if (!text || !text.trim()) {
    return { headers: [], rows: [] };
  }

  const cleanText = text.replace(/^\uFEFF/, '').trim(); // Remove BOM if present

  // Detect delimiter: Tab (\t), Semicolon (;), or Comma (,)
  const firstLine = cleanText.split('\n')[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  }

  const resultRows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((c) => c.length > 0)) {
        resultRows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c.length > 0)) {
      resultRows.push(currentRow);
    }
  }

  if (resultRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = resultRows[0];
  const rows = resultRows.slice(1).filter((r) => r.some((c) => c.length > 0));

  return { headers, rows };
}

/**
 * Fetches Google Sheet data using backend proxy first, falling back to direct browser fetch.
 */
export async function fetchGoogleSheetData(
  sheetUrl: string
): Promise<{ headers: string[]; rows: string[][]; rawCsv?: string; error?: string }> {
  const parsed = parseGoogleSheetUrl(sheetUrl);
  if (!parsed.isValid || !parsed.exportCsvUrl) {
    return {
      headers: [],
      rows: [],
      error: 'Đường dẫn Google Sheets không đúng định dạng. Vui lòng kiểm tra lại link.',
    };
  }

  // 1. Try server proxy endpoint first (/api/fetch-sheet)
  try {
    const proxyRes = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(sheetUrl)}`);
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.csvText) {
        const parsedTable = parseCsvOrTsv(data.csvText);
        return { ...parsedTable, rawCsv: data.csvText };
      }
    }
  } catch (proxyErr) {
    console.warn('Backend proxy fetch failed, trying direct browser fetch:', proxyErr);
  }

  // 2. Direct browser fetch with fallback to gviz
  const urlsToTry = [
    parsed.exportCsvUrl,
    `https://docs.google.com/spreadsheets/d/${parsed.sheetId}/gviz/tq?tqx=out:csv${parsed.gid ? `&gid=${parsed.gid}` : ''}`,
  ];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 10 && !text.includes('<!DOCTYPE html>')) {
          const parsedTable = parseCsvOrTsv(text);
          return { ...parsedTable, rawCsv: text };
        }
      }
    } catch (e) {
      // Ignored, try next
    }
  }

  return {
    headers: [],
    rows: [],
    error:
      'Không thể tự động tải file từ Google Sheets (có thể do bảng tính đang đặt chế độ Riêng tư). Bạn có thể bấm "Chia sẻ" trên Google Sheet chọn "Bất kỳ ai có đường liên kết", hoặc dùng tính năng "Dán từ Google Sheet (Ctrl+V)".',
  };
}
