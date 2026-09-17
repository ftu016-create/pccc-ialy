import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
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

// 1. Tải toàn bộ danh sách biên bản từ đám mây Firebase
export async function fetchAllSharedPcccReports(): Promise<ReportData[] | null> {
  try {
    const colRef = collection(db, 'pccc_reports');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const reports: ReportData[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.dataJson) {
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
    console.warn('Lỗi lấy báo cáo PCCC từ Firestore:', err);
  }
  return null;
}

// 2. Tự động lưu và phát đồng bộ lên đám mây Firebase
export async function savePcccReportToFirestore(report: ReportData): Promise<void> {
  try {
    const docRef = doc(db, 'pccc_reports', report.id);
    await setDoc(
      docRef,
      {
        id: report.id,
        report_month: report.report_month || '',
        dataJson: JSON.stringify(report),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Lỗi lưu báo cáo PCCC lên Firestore:', err);
  }
}

// 3. Xóa biên bản trên đám mây
export async function deletePcccReportFromFirestore(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, 'pccc_reports', reportId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Lỗi xóa báo cáo PCCC trên Firestore:', err);
  }
}

// 4. Lắng nghe thay đổi trực tiếp (Real-time Listener) để Máy 2 tự nhảy số khi Máy 1 bấm Lưu
export function subscribePcccReportsFromFirestore(onUpdate: (reports: ReportData[]) => void): () => void {
  try {
    const colRef = collection(db, 'pccc_reports');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const reports: ReportData[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && data.dataJson) {
            try {
              reports.push(JSON.parse(data.dataJson));
            } catch (_) {}
          }
        });
        if (reports.length > 0) {
          onUpdate(reports);
        }
      },
      (err) => {
        console.warn('Lỗi lắng nghe thời gian thực Firestore:', err);
      }
    );
  } catch (e) {
    return () => {};
  }
}
