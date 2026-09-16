import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { ReportData } from '../types';

export const firebaseConfig = {
  projectId: "disco-velocity-91ttq",
  appId: "1:1023774001112:web:2809f9ddec418d22e494ad",
  apiKey: "AIzaSyACeL2wmOoH5BFN0QPNOa-LU2Vur36pMrc",
  authDomain: "disco-velocity-91ttq.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-remixatvsldrepor-188c401c-590d-4e3f-928d-af22e1660072",
  storageBucket: "disco-velocity-91ttq.firebasestorage.app",
  messagingSenderId: "1023774001112",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 1. Tự động tải tất cả biên bản từ Đám mây về khi mở web
export async function fetchAllSharedPcccReports(): Promise<ReportData[] | null> {
  try {
    const colRef = collection(db, 'pccc_reports');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const reports: ReportData[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.dataJson) {
          try {
            const r = JSON.parse(data.dataJson);
            reports.push(r);
          } catch (_) {}
        }
      });
      if (reports.length > 0) {
        return reports;
      }
    }
  } catch (err) {
    console.warn('Lỗi lấy danh sách báo cáo PCCC từ Firestore:', err);
  }
  return null;
}

// 2. Tự động lưu biên bản lên Đám mây để máy khác thấy ngay
export async function savePcccReportToFirestore(report: ReportData): Promise<void> {
  try {
    const docRef = doc(db, 'pccc_reports', report.id);
    await setDoc(
      docRef,
      {
        id: report.id,
        report_month: report.report_month,
        dataJson: JSON.stringify(report),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Lỗi đồng bộ báo cáo PCCC lên Firestore:', err);
  }
}

// 3. Xóa biên bản trên Đám mây
export async function deletePcccReportFromFirestore(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, 'pccc_reports', reportId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Lỗi xóa báo cáo PCCC trên Firestore:', err);
  }
}
