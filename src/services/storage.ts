import { ReportData } from '../types';
import { createNewReport, DEFAULT_STAFF_DIRECTORY } from '../data/defaultData';

const REPORTS_KEY = 'pccc_ialy_reports_v1';
const STAFF_KEY = 'pccc_ialy_staff_directory_v1';

export const storageService = {
  getAllReports(): ReportData[] {
    try {
      const data = localStorage.getItem(REPORTS_KEY);
      if (!data) {
        // Seed with initial report from PDF
        const initial = createNewReport();
        localStorage.setItem(REPORTS_KEY, JSON.stringify([initial]));
        return [initial];
      }
      const parsed: ReportData[] = JSON.parse(data);
      // Ensure clean 1-line inspection_areas if legacy text exists
      return parsed.map((r) => {
        if (r.inspection_areas && (r.inspection_areas.includes('Cửa Nhận Nước') || r.inspection_areas.includes('Cửa Nhận nước'))) {
          return {
            ...r,
            inspection_areas: r.inspection_areas
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
        return r;
      });
    } catch (e) {
      console.error('Failed to load reports from localStorage', e);
      return [createNewReport()];
    }
  },

  getReportById(id: string): ReportData | null {
    const all = this.getAllReports();
    return all.find((r) => r.id === id) || null;
  },

  saveReport(report: ReportData): void {
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
