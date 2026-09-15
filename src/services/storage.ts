import { ReportData } from '../types';
import { createNewReport, DEFAULT_STAFF_DIRECTORY } from '../data/defaultData';

const REPORTS_KEY = 'pccc_ialy_reports_v1';
const STAFF_KEY = 'pccc_ialy_staff_directory_v1';

// In-memory cache to ensure full PDF and image binary data is never lost during session
const memoryReportsCache: Map<string, ReportData> = new Map();

export const storageService = {
  getAllReports(): ReportData[] {
    try {
      const data = localStorage.getItem(REPORTS_KEY);
      let parsed: ReportData[] = [];
      if (!data) {
        // Seed with initial report from PDF
        const initial = createNewReport();
        this.saveReport(initial);
        return [initial];
      }
      parsed = JSON.parse(data);

      // Merge with in-memory cache to restore any large binary payloads (e.g. attached PDFs)
      return parsed.map((r) => {
        const cached = memoryReportsCache.get(r.id);
        const merged = cached ? { ...r, ...cached } : r;
        if (merged.inspection_areas && (merged.inspection_areas.includes('Cửa Nhận Nước') || merged.inspection_areas.includes('Cửa Nhận nước'))) {
          return {
            ...merged,
            inspection_areas: merged.inspection_areas
              .replace(
                '- NMTĐ Ialy: Gian máy; Gian biến áp; Nhà PK; Trạm 500 kV Ialy; Cửa Nhận Nước.',
                '- NMTĐ Ialy: Gian máy, Gian biến áp, Nhà PK, Trạm 500 kV, Cửa nhận nước.'
              )
              .replace(
                '- NMTĐ Ialy: Gian máy; Gian biến áp; Nhà PK; Trạm 500 kV Ialy; Cửa Nhận nước.',
                '- NMTĐ Ialy: Gian máy, Gian biến áp, Nhà PK, Trạm 500 kV, Cửa nhận nước.'
              ),
          };
        }
        return merged;
      });
    } catch (e) {
      console.error('Failed to load reports from localStorage', e);
      if (memoryReportsCache.size > 0) {
        return Array.from(memoryReportsCache.values());
      }
      return [createNewReport()];
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
    // 1. Update in-memory cache with full fidelity
    memoryReportsCache.set(report.id, report);

    // 2. Persist to localStorage safely with quota fallback
    try {
      const all = this.getAllReports();
      const existingIndex = all.findIndex((r) => r.id === report.id);
      const now = new Date().toISOString();
      const updated = {
        ...report,
        updated_at: now,
      };

      if (existingIndex >= 0) {
        all[existingIndex] = updated;
      } else {
        all.unshift(updated);
      }

      localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
    } catch (quotaError) {
      console.warn('LocalStorage quota limit reached. Saving lightweight representation:', quotaError);
      try {
        // Fallback: save current report, but strip bulky pageImages from other reports
        const all = Array.from(memoryReportsCache.values());
        const lightweight = all.map((r) => {
          if (r.id !== report.id && r.attachedPdfs) {
            return {
              ...r,
              attachedPdfs: r.attachedPdfs.map((p) => ({
                ...p,
                pageImages: [],
              })),
            };
          }
          return r;
        });
        localStorage.setItem(REPORTS_KEY, JSON.stringify(lightweight));
      } catch (innerErr) {
        console.warn('LocalStorage save skipped to prevent crash, active session remains cached in memory:', innerErr);
      }
    }
  },

  deleteReport(id: string): void {
    const all = this.getAllReports();
    const filtered = all.filter((r) => r.id !== id);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
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
        localStorage.setItem(REPORTS_KEY, JSON.stringify(parsed.reports));
      }
      if (Array.isArray(parsed.staff)) {
        localStorage.setItem(STAFF_KEY, JSON.stringify(parsed.staff));
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },
};
