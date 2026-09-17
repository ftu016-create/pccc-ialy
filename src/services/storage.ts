import { ReportData, AttachedDocument } from '../types';
import { createNewReport, DEFAULT_STAFF_DIRECTORY } from '../data/defaultData';
import {
  idbGetAllReports,
  idbSaveReport,
  idbSaveAllReports,
  idbDeleteReport,
} from './db';
import {
  fetchAllSharedPcccReports,
  savePcccReportToFirestore,
  deletePcccReportFromFirestore,
  subscribePcccReportsFromFirestore,
} from '../lib/firebase';

const REPORTS_KEY = 'pccc_ialy_reports_v1';
const STAFF_KEY = 'pccc_ialy_staff_directory_v1';

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
  return { ...report };
}

// Khởi động đồng bộ: Tải dữ liệu từ Google Firebase Firestore
let hasInitializedAsync = false;
async function initAsyncStorage() {
  if (hasInitializedAsync || typeof window === 'undefined') return;
  hasInitializedAsync = true;

  try {
    // 1. Tải trước từ bộ nhớ máy để hiển thị siêu nhanh
    const idbReports = await idbGetAllReports();
    let hasNewData = false;
    if (idbReports && idbReports.length > 0) {
      idbReports.forEach((rep) => {
        memoryReportsCache.set(rep.id, sanitizeReport(rep));
        hasNewData = true;
      });
    }

    // 2. ĐỒNG BỘ ĐÁM MÂY GOOGLE FIREBASE
    try {
      const cloudReports = await fetchAllSharedPcccReports();
      if (cloudReports && cloudReports.length > 0) {
        cloudReports.forEach((rep) => {
          memoryReportsCache.set(rep.id, sanitizeReport(rep));
          idbSaveReport(rep).catch(() => {});
        });
        hasNewData = true;
      }
    } catch (cloudErr) {
      console.warn('Chưa kết nối được Firestore đám mây:', cloudErr);
    }

    if (hasNewData) {
      notifyListeners();
    }

    // 3. LẮNG NGHE THỜI GIAN THỰC (Real-time listener giữa các máy)
    subscribePcccReportsFromFirestore((cloudReports) => {
      if (cloudReports && cloudReports.length > 0) {
        let changed = false;
        cloudReports.forEach((rep) => {
          const current = memoryReportsCache.get(rep.id);
          if (!current || JSON.stringify(current) !== JSON.stringify(rep)) {
            memoryReportsCache.set(rep.id, sanitizeReport(rep));
            idbSaveReport(rep).catch(() => {});
            changed = true;
          }
        });
        if (changed) {
          notifyListeners();
        }
      }
    });
  } catch (err) {
    console.warn('Lỗi khởi động storage:', err);
  }
}

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
      if (memoryReportsCache.size > 0) {
        return Array.from(memoryReportsCache.values()).map(sanitizeReport);
      }

      const data = localStorage.getItem(REPORTS_KEY);
      if (!data) {
        const initial = sanitizeReport(createNewReport());
        this.saveReport(initial);
        return [initial];
      }
      const parsed: ReportData[] = JSON.parse(data);
      parsed.forEach((r) => {
        memoryReportsCache.set(r.id, sanitizeReport(r));
      });
      return parsed.map(sanitizeReport);
    } catch (e) {
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

  saveReport(report: ReportData): void {
    const sanitized = sanitizeReport(report);

    // 1. Lưu vào bộ nhớ nhanh
    memoryReportsCache.set(sanitized.id, sanitized);
    idbSaveReport(sanitized).catch(() => {});

    // 2. BẮN TỰ ĐỘNG LÊN ĐÁM MÂY GOOGLE FIREBASE (Đồng bộ mọi máy tính & điện thoại)
    savePcccReportToFirestore(sanitized).catch((e) => {
      console.warn('Lỗi đồng bộ Firebase:', e);
    });

    // 3. Lưu vào localStorage dự phòng
    try {
      const all = Array.from(memoryReportsCache.values());
      localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
    } catch (e) {}

    notifyListeners();
  },

  deleteReport(id: string): void {
    memoryReportsCache.delete(id);
    idbDeleteReport(id).catch(() => {});
    deletePcccReportFromFirestore(id).catch(() => {});

    const all = this.getAllReports().filter((r) => r.id !== id);
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
    } catch (e) {}

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

  importBackupJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.reports)) {
        parsed.reports.forEach((rep: ReportData) => {
          this.saveReport(rep);
        });
      }
      if (Array.isArray(parsed.staff)) {
        localStorage.setItem(STAFF_KEY, JSON.stringify(parsed.staff));
      }
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  },
};
