import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PIN_FILE = path.join(DATA_DIR, 'pin.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const DEFAULT_PIN = 'ialy2026';

// Backup cloud endpoints
const CLOUD_PIN_ENDPOINTS = [
  'https://api.restful-api.dev/objects/ff808181a067127101a09a4df5a50866',
  'https://api.restful-api.dev/objects/ff808181a067127101a09a4e6f830869',
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getCurrentPin(): { pin: string; updated_at: string } {
  try {
    ensureDataDir();
    if (fs.existsSync(PIN_FILE)) {
      const data = JSON.parse(fs.readFileSync(PIN_FILE, 'utf-8'));
      if (data && data.pin && typeof data.pin === 'string' && data.pin.trim().length >= 4) {
        return { pin: data.pin.trim(), updated_at: data.updated_at || new Date().toISOString() };
      }
    }
  } catch (err) {
    console.error('Error reading PIN file:', err);
  }
  return { pin: DEFAULT_PIN, updated_at: new Date().toISOString() };
}

export function savePin(newPin: string): { pin: string; updated_at: string } {
  ensureDataDir();
  const payload = {
    pin: newPin.trim(),
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(PIN_FILE, JSON.stringify(payload, null, 2), 'utf-8');

  // Background sync to cloud backup
  CLOUD_PIN_ENDPOINTS.forEach(async (url) => {
    try {
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'pccc_ialy_pin_config',
          data: payload,
        }),
      });
    } catch (e) {
      // Ignored
    }
  });

  return payload;
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): Promise<void> {
  const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  if (!pathname.startsWith('/api/')) {
    return next();
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma',
    });
    res.end();
    return;
  }

  // 1. GET /api/admin/pin
  if (pathname === '/api/admin/pin' && req.method === 'GET') {
    const current = getCurrentPin();
    sendJson(res, 200, { success: true, ...current });
    return;
  }

  // 2. POST /api/admin/verify
  if (pathname === '/api/admin/verify' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const inputPin = typeof body.pin === 'string' ? body.pin.trim() : '';
    const current = getCurrentPin();
    const isValid = inputPin === current.pin;
    sendJson(res, 200, { success: true, valid: isValid });
    return;
  }

  // 3. POST /api/admin/pin (Change PIN)
  if (pathname === '/api/admin/pin' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const oldPin = typeof body.oldPin === 'string' ? body.oldPin.trim() : '';
    const newPin = typeof body.newPin === 'string' ? body.newPin.trim() : '';

    const current = getCurrentPin();

    if (oldPin !== current.pin) {
      sendJson(res, 400, {
        success: false,
        message: 'Mã PIN cũ không chính xác. Bạn không có quyền đổi mã PIN.',
      });
      return;
    }

    if (newPin.length < 4) {
      sendJson(res, 400, {
        success: false,
        message: 'Mã PIN mới phải từ 4 ký tự trở lên.',
      });
      return;
    }

    if (newPin === current.pin) {
      sendJson(res, 400, {
        success: false,
        message: 'Mã PIN mới không được trùng với mã PIN hiện tại.',
      });
      return;
    }

    const saved = savePin(newPin);
    sendJson(res, 200, {
      success: true,
      message: 'Đã đổi mã PIN Admin thành công và đồng bộ tới tất cả máy tính!',
      ...saved,
    });
    return;
  }

  // 4. GET /api/reports
  if (pathname === '/api/reports' && req.method === 'GET') {
    try {
      ensureDataDir();
      if (fs.existsSync(REPORTS_FILE)) {
        const data = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
        sendJson(res, 200, { success: true, ...data });
        return;
      }
    } catch (e) {
      // Ignored
    }
    sendJson(res, 200, { success: true, reports: null });
    return;
  }

  // 5. POST /api/reports
  if (pathname === '/api/reports' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    ensureDataDir();
    const payload = {
      reports: body.reports || [],
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    sendJson(res, 200, { success: true, updated_at: payload.updated_at });
    return;
  }

  // 6. GET /api/fetch-sheet?url=...
  if (pathname === '/api/fetch-sheet' && req.method === 'GET') {
    const sheetUrl = urlObj.searchParams.get('url');
    if (!sheetUrl) {
      sendJson(res, 400, { success: false, message: 'Missing url parameter' });
      return;
    }

    try {
      const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!idMatch || !idMatch[1]) {
        sendJson(res, 400, { success: false, message: 'Invalid Google Sheet URL' });
        return;
      }
      const sheetId = idMatch[1];
      const gidMatch = sheetUrl.match(/[?&#]gid=([0-9]+)/);
      const gid = gidMatch && gidMatch[1] ? gidMatch[1] : null;
      const gidParam = gid ? `&gid=${gid}` : '';

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
      const response = await fetch(csvUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
      });

      if (!response.ok) {
        // Fallback to gviz
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;
        const gvizRes = await fetch(gvizUrl);
        if (gvizRes.ok) {
          const gvizText = await gvizRes.text();
          sendJson(res, 200, { success: true, csvText: gvizText });
          return;
        }
        sendJson(res, response.status, {
          success: false,
          message: 'Google Sheet returned status ' + response.status + '. Sheet may be private.',
        });
        return;
      }

      const csvText = await response.text();
      sendJson(res, 200, { success: true, csvText });
      return;
    } catch (err: any) {
      sendJson(res, 500, { success: false, message: err?.message || 'Error fetching sheet' });
      return;
    }
  }

  // Fallback for unmatched /api
  sendJson(res, 404, { success: false, message: 'Endpoint not found' });
}
