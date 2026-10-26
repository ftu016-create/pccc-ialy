import { ReportData, AttachedDocument } from '../types';
import { createNewReport, DEFAULT_STAFF_DIRECTORY } from '../data/defaultData';
import {
  idbGetAllReports,
  idbGetReport,
  idbSaveReport,
  idbSaveAllReports,
  idbDeleteReport,
} from './db';
import {
  fetchAllSharedReports,
  subscribeToSharedReports,
  saveReportToFirestore,
  deleteReportFromFirestore,
} from '../lib/firebase';

const REPORTS_KEY = 'pccc_ialy_reports_v1';
const STAFF_KEY = 'pccc_ialy_staff_directory_v1';

// In-memory cache to ensure full PDF and image binary data is never lost during session
const memoryReportsCache: Map<string, ReportData> = new Map();
const storageListeners: Set<() => void> = new Set();

function notifyListeners() {
  storageListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Storage listener error:', e);
    }
  });
}

function sanitizeReport(report: ReportData): ReportData {
  const r = { ...report };

  // 1. Remove unwanted row in escape: stt 2.1 or 'pháp ngăn' and clear old note text
  if (Array.isArray(r.escape)) {
    r.escape = r.escape
      .filter((esc) => esc.stt !== '2.1' && esc.name?.trim() !== 'pháp ngăn')
      .map((esc) => {
        if (esc.note && esc.note.includes('Hình ảnh minh chứng được lưu tại thư mục')) {
          return { ...esc, note: '' };
        }
        return esc;
      });
  }

  // 2. Remove unwanted row in fire: stt 3 or empty 3rd row
  if (Array.isArray(r.fire)) {
    r.fire = r.fire.filter((f) => {
      if (f.stt === '3') return false;
      if (f.id === 'f-3' && !f.name?.trim()) return false;
      return true;
    });
  }

  // 3. Clean up any other notes containing 'Hình ảnh minh chứng...'
  if (Array.isArray(r.equip)) {
    r.equip = r.equip.map((eq) => {
      if (eq.note && eq.note.includes('Hình ảnh minh chứng được lưu tại thư mục')) {
        return { ...eq, note: '' };
      }
      return eq;
    });
  }

  if (r.inspection_areas && (r.inspection_areas.includes('Cửa Nhận Nước') || r.inspection_areas.includes('Cửa Nhận nước'))) {
    r.inspection_areas = r.inspection_areas
      .replace(
        '- NMTĐ Ialy: Gian máy; Gian biến áp; Nhà PK; Trạm 500 kV Ialy; Cửa Nhận Nước.',
        '- NMTĐ Ialy: Gian máy, Gian biến áp, Nhà PK, Trạm 500 kV, Cửa nhận nước.'
      )
      .replace(
        '- NMTĐ Ialy: Gian máy; Gian biến áp; Nhà PK; Trạm 500 kV Ialy; Cửa Nhận nước.',
        '- NMTĐ Ialy: Gian máy, Gian biến áp, Nhà PK, Trạm 500 kV, Cửa nhận nước.'
      );
  }

  return r;
}

// Background initialization from IndexedDB and Server
let hasInitializedAsync = false;
async function initAsyncStorage() {
  if (hasInitializedAsync || typeof window === 'undefined') return;
  hasInitializedAsync = true;

  try {
    // 1. Try loading from IndexedDB first (fast local database, supports 500MB+)
    const idbReports = await idbGetAllReports();
    let hasNewData = false;

    if (idbReports && idbReports.length > 0) {
      idbReports.forEach((rep) => {
        const existing = memoryReportsCache.get(rep.id);
        const existingPhotosCount = (existing?.photos || []).length;
        const idbPhotosCount = (rep.photos || []).length;
        const existingPdfsCount = (existing?.attachedPdfs || []).length;
        const idbPdfsCount = (rep.attachedPdfs || []).length;

        const merged: ReportData = {
          ...(existing || {}),
          ...rep,
          photos: idbPhotosCount >= existingPhotosCount ? rep.photos : existing?.photos,
          attachedPdfs: idbPdfsCount >= existingPdfsCount ? rep.attachedPdfs : existing?.attachedPdfs,
        };
        memoryReportsCache.set(rep.id, sanitizeReport(merged));
        hasNewData = true;
      });
    }

    // 2. Try syncing from server API (/api/reports)
    try {
      const serverRes = await fetch('/api/reports', { cache: 'no-store' });
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData && Array.isArray(serverData.reports) && serverData.reports.length > 0) {
          serverData.reports.forEach((rep: ReportData) => {
            const existing = memoryReportsCache.get(rep.id);
            const existingPdfsCount = (existing?.attachedPdfs || []).length;
            const serverPdfsCount = (rep.attachedPdfs || []).length;

            if (!existing || serverPdfsCount >= existingPdfsCount) {
              memoryReportsCache.set(rep.id, sanitizeReport(rep));
              idbSaveReport(rep);
              hasNewData = true;
            }
          });
        }
      }
    } catch (apiErr) {
      // Server might be offline, ignore
    }

    // 3. Sync from Firebase Firestore (Cloud persistence across all browsers, machines & Vercel)
    try {
      const remoteReports = await fetchAllSharedReports();
      if (remoteReports && remoteReports.length > 0) {
        remoteReports.forEach((rep: ReportData) => {
          const existing = memoryReportsCache.get(rep.id);
          const existingPhotosCount = (existing?.photos || []).length;
          const remotePhotosCount = (rep.photos || []).length;
          const existingPdfsCount = (existing?.attachedPdfs || []).length;
          const remotePdfsCount = (rep.attachedPdfs || []).length;

          const merged: ReportData = {
            ...(existing || {}),
            ...rep,
            photos: existingPhotosCount > remotePhotosCount ? existing?.photos : rep.photos,
            attachedPdfs: existingPdfsCount > remotePdfsCount ? existing?.attachedPdfs : rep.attachedPdfs,
          };

          if (!existing || rep.updated_at >= existing.updated_at) {
            memoryReportsCache.set(rep.id, sanitizeReport(merged));
            idbSaveReport(merged).catch(() => {});
            hasNewData = true;
          }
        });
      } else if (memoryReportsCache.size > 0) {
        // If Firestore is newly initialized, seed local reports into Firestore
        Array.from(memoryReportsCache.values()).forEach((rep) => {
          saveReportToFirestore(rep).catch(() => {});
        });
      }
    } catch (fsErr) {
      console.warn('Firestore initial fetch error:', fsErr);
    }

    // 4. Subscribe to real-time Firestore updates across all browsers & tabs
    try {
      subscribeToSharedReports((remoteReports) => {
        if (Array.isArray(remoteReports) && remoteReports.length > 0) {
          let hasUpdated = false;
          remoteReports.forEach((remoteRep) => {
            const existing = memoryReportsCache.get(remoteRep.id);
            if (!existing || (remoteRep.updated_at && remoteRep.updated_at > existing.updated_at)) {
              const existingPhotosCount = (existing?.photos || []).length;
              const remotePhotosCount = (remoteRep.photos || []).length;
              const existingPdfsCount = (existing?.attachedPdfs || []).length;
              const remotePdfsCount = (remoteRep.attachedPdfs || []).length;

              const merged: ReportData = {
                ...(existing || {}),
                ...remoteRep,
                photos: existingPhotosCount > remotePhotosCount ? existing?.photos : remoteRep.photos,
                attachedPdfs: existingPdfsCount > remotePdfsCount ? existing?.attachedPdfs : remoteRep.attachedPdfs,
              };

              memoryReportsCache.set(remoteRep.id, sanitizeReport(merged));
              idbSaveReport(merged).catch(() => {});
              hasUpdated = true;
            }
          });
          if (hasUpdated) {
            notifyListeners();
          }
        }
      });
    } catch (subErr) {
      console.warn('Firestore subscribe error:', subErr);
    }

    if (hasNewData) {
      notifyListeners();
    }
  } catch (err) {
    console.warn('Async storage init error:', err);
  }
}

// Kick off async init immediately
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initAsyncStorage();
  }, 10);
}

export const storageService = {
  subscribe(listener: () => void): () => void {
    storageListeners.add(listener);
    return () => storageListeners.delete(listener);
  },

  getAllReports(): ReportData[] {
    try {
      // If in-memory cache has reports, return them (full fidelity)
      if (memoryReportsCache.size > 0) {
        return Array.from(memoryReportsCache.values()).map(sanitizeReport);
      }

      const data = localStorage.getItem(REPORTS_KEY);
      let parsed: ReportData[] = [];
      if (!data) {
        // Seed with initial report
        const initial = sanitizeReport(createNewReport());
        this.saveReport(initial);
        return [initial];
      }
      parsed = JSON.parse(data);

      parsed.forEach((r) => {
        memoryReportsCache.set(r.id, sanitizeReport(r));
      });

      return parsed.map(sanitizeReport);
    } catch (e) {
      console.error('Failed to load reports from localStorage', e);
      if (memoryReportsCache.size > 0) {
        return Array.from(memoryReportsCache.values()).map(sanitizeReport);
      }
      return [sanitizeReport(createNewReport())];
    }
  },

  getReportById(id: string): ReportData | null {
    if (memoryReportsCache.has(id)) {
      return memoryReportsCache.get(id)!;
    }
    const all = this.getAllReports();
    return all.find((r) => r.id === id) || null;
  },

  async syncFromCloud(): Promise<number> {
    try {
      const remoteReports = await fetchAllSharedReports();
      if (remoteReports && remoteReports.length > 0) {
        remoteReports.forEach((rep) => {
          memoryReportsCache.set(rep.id, sanitizeReport(rep));
          idbSaveReport(rep).catch(() => {});
        });
        notifyListeners();
        return remoteReports.length;
      }
    } catch (e) {
      console.warn('Sync from cloud error:', e);
    }
    return 0;
  },

  saveReport(report: ReportData): void {
    const sanitized = sanitizeReport(report);

    // 1. Update in-memory cache with 100% full fidelity
    memoryReportsCache.set(sanitized.id, sanitized);

    // 2. Persist to IndexedDB (No 5MB limit, supports large PDFs & multi-megabyte base64)
    idbSaveReport(sanitized).catch((e) => console.warn('Failed to save to IndexedDB:', e));

    // 3. Real-time Cloud Sync to Firebase Firestore (Cross-browser, cross-device, works on Vercel)
    saveReportToFirestore(sanitized).catch((e) => console.warn('Failed to save to Firestore:', e));

    // 4. Persist to backend server (/api/reports) for cross-session and cross-tab storage
    this.syncToServer();

    // 4. Persist to localStorage safely with quota protection
    try {
      const all = Array.from(memoryReportsCache.values());
      const now = new Date().toISOString();
      const updated = {
        ...sanitized,
        updated_at: now,
      };

      const existingIndex = all.findIndex((r) => r.id === sanitized.id);
      if (existingIndex >= 0) {
        all[existingIndex] = updated;
      } else {
        all.unshift(updated);
      }

      // Check approximate size before storing to avoid unhandled exceptions
      const jsonStr = JSON.stringify(all);
      if (jsonStr.length < 3.5 * 1024 * 1024) {
        localStorage.setItem(REPORTS_KEY, jsonStr);
      } else {
        // Strip heavy base64 strings only for localStorage, while IndexedDB keeps full bytes
        const lightweight = all.map((r) => ({
          ...r,
          attachedPdfs: (r.attachedPdfs || []).map((p) => ({
            ...p,
            // Keep preview info, page count and name, strip massive raw base64 from localStorage
            pdfData: p.pdfData && p.pdfData.length > 200000 ? '' : p.pdfData,
            pageImages: (p.pageImages || []).slice(0, 2),
          })),
        }));
        localStorage.setItem(REPORTS_KEY, JSON.stringify(lightweight));
      }
    } catch (quotaError) {
      console.warn('LocalStorage quota limit reached. Data safely preserved in IndexedDB & Memory:', quotaError);
      try {
        const all = Array.from(memoryReportsCache.values());
        const minimal = all.map((r) => ({
          ...r,
          attachedPdfs: (r.attachedPdfs || []).map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            pageCount: p.pageCount || 1,
            uploadedAt: p.uploadedAt,
            includedInExport: p.includedInExport,
          })),
        }));
        localStorage.setItem(REPORTS_KEY, JSON.stringify(minimal));
      } catch (innerErr) {
        // Ignored, IndexedDB and server maintain complete data
      }
    }

    notifyListeners();
  },

  async syncToServer(): Promise<void> {
    try {
      const all = Array.from(memoryReportsCache.values());
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: all }),
      });
    } catch (e) {
      // Ignored
    }
  },

  attachPdfToReport(reportId: string, attachedPdf: AttachedDocument): ReportData | null {
    const report = this.getReportById(reportId);
    if (!report) return null;

    const existingPdfs = report.attachedPdfs || [];
    // Remove if duplicate id/name
    const filtered = existingPdfs.filter((p) => p.id !== attachedPdf.id && p.name !== attachedPdf.name);
    const updatedPdfs = [...filtered, attachedPdf];

    const updatedReport: ReportData = {
      ...report,
      attachedPdfs: updatedPdfs,
      updated_at: new Date().toISOString(),
    };

    this.saveReport(updatedReport);
    return updatedReport;
  },

  deleteReport(id: string): void {
    memoryReportsCache.delete(id);
    idbDeleteReport(id).catch(() => {});
    deleteReportFromFirestore(id).catch((e) => console.warn('Failed to delete from Firestore:', e));

    const all = this.getAllReports().filter((r) => r.id !== id);
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
    } catch (e) {
      // Ignore
    }

    this.syncToServer();
    notifyListeners();
  },

  duplicateReport(id: string): ReportData | null {
    const target = this.getReportById(id);
    if (!target) return null;

    const copy: ReportData = {
      ...JSON.parse(JSON.stringify(target)),
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      report_month: target.report_month + ' (Bản sao)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.saveReport(copy);
    return copy;
  },

  getStaffDirectory(): { name: string; role: string }[] {
    try {
      const data = localStorage.getItem(STAFF_KEY);
      if (!data) {
        localStorage.setItem(STAFF_KEY, JSON.stringify(DEFAULT_STAFF_DIRECTORY));
        return DEFAULT_STAFF_DIRECTORY;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_STAFF_DIRECTORY;
    }
  },

  saveStaffDirectory(staff: { name: string; role: string }[]): void {
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
  },

  exportBackupJson(): string {
    const reports = this.getAllReports();
    const staff = this.getStaffDirectory();
    return JSON.stringify({ reports, staff, exported_at: new Date().toISOString() }, null, 2);
  },

  importBackupJson(jsonStr: string): { success: boolean; reports?: ReportData[]; message?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      let importedReports: ReportData[] = [];
      if (Array.isArray(parsed.reports)) {
        importedReports = parsed.reports;
        parsed.reports.forEach((rep: ReportData) => {
          memoryReportsCache.set(rep.id, sanitizeReport(rep));
          saveReportToFirestore(rep).catch(() => {});
        });
        idbSaveAllReports(parsed.reports).catch(() => {});
        try {
          localStorage.setItem(REPORTS_KEY, JSON.stringify(parsed.reports));
        } catch (e) {
          // Ignore
        }
      }
      if (Array.isArray(parsed.staff)) {
        localStorage.setItem(STAFF_KEY, JSON.stringify(parsed.staff));
      }
      this.syncToServer();
      notifyListeners();
      return {
        success: true,
        reports: importedReports,
        message: `Đã khôi phục thành công ${importedReports.length} biên bản và đồng bộ lên đám mây!`,
      };
    } catch (e) {
      console.error('Import failed', e);
      return { success: false, message: 'Tệp sao lưu không hợp lệ hoặc bị lỗi định dạng JSON.' };
    }
  },
};
