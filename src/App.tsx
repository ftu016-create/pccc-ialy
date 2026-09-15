import React, { useState, useEffect } from 'react';
import { ReportData, UserRole } from './types';
import { storageService } from './services/storage';
import { adminAuthService } from './services/adminAuth';
import { createNewReport } from './data/defaultData';
import { exportReportToDocx } from './services/exportDocx';
import { exportElementToPdf, generatePdfFilename } from './services/exportPdf';
import { Topbar } from './components/Topbar';
import { ReportForm } from './components/ReportForm';
import { ReportDetailView } from './components/ReportDetailView';
import { ReportHistory } from './components/ReportHistory';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { StaffManagerModal } from './components/StaffManagerModal';
import { AdminPinModal } from './components/AdminPinModal';
import { DocumentA4Content } from './components/DocumentA4Content';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [reports, setReports] = useState<ReportData[]>(() => storageService.getAllReports());
  const [currentReport, setCurrentReport] = useState<ReportData>(() => {
    const list = storageService.getAllReports();
    return list.length > 0 ? list[0] : createNewReport();
  });
  const [userRole, setUserRole] = useState<UserRole>(() => adminAuthService.getUserRole());
  const [currentView, setCurrentView] = useState<'form' | 'preview' | 'history'>(() => {
    return adminAuthService.getUserRole() === 'admin' ? 'form' : 'history';
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'login' | 'change_pin'>('login');
  const [staffDirectory, setStaffDirectory] = useState(() => storageService.getStaffDirectory());

  useEffect(() => {
    const unsubscribe = adminAuthService.subscribe((role) => {
      setUserRole(role);
      if (role === 'viewer' && currentView === 'form') {
        setCurrentView('history');
      }
    });
    return unsubscribe;
  }, [currentView]);

  const refreshReports = () => {
    const updated = storageService.getAllReports();
    setReports(updated);
  };

  const handleOpenAdminLogin = () => {
    setPinModalMode('login');
    setShowPinModal(true);
  };

  const handleChangePin = () => {
    setPinModalMode('change_pin');
    setShowPinModal(true);
  };

  const handleAdminLogout = () => {
    adminAuthService.logout();
    setSaveMessage('Đã chuyển về chế độ Đồng nghiệp (Chỉ xem)');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReportChange = (updated: ReportData) => {
    setCurrentReport(updated);
    setIsDirty(true);
  };

  const handleSaveReport = () => {
    if (userRole !== 'admin') {
      handleOpenAdminLogin();
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      storageService.saveReport(currentReport);
      setIsDirty(false);
      setIsSaving(false);
      refreshReports();
      setSaveMessage(`Đã lưu biên bản tháng ${currentReport.report_month}!`);
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    }, 150);
  };

  const handleNewReport = () => {
    if (userRole !== 'admin') {
      handleOpenAdminLogin();
      return;
    }

    if (isDirty) {
      const confirmLeave = window.confirm(
        'Bạn có thay đổi chưa lưu. Bạn có chắc muốn tạo báo cáo mới?'
      );
      if (!confirmLeave) return;
    }

    const newRep = createNewReport({
      report_month: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
    });
    setCurrentReport(newRep);
    setIsDirty(false);
    setCurrentView('form');
  };

  const handleSelectReport = (report: ReportData) => {
    if (isDirty && report.id !== currentReport.id) {
      const confirmLeave = window.confirm(
        'Bạn có thay đổi chưa lưu trên báo cáo hiện tại. Tiếp tục mở báo cáo này?'
      );
      if (!confirmLeave) return;
    }
    setCurrentReport(report);
    setIsDirty(false);
  };

  const handleExportWord = async () => {
    // Auto-save before export to ensure persistence
    if (userRole === 'admin') {
      storageService.saveReport(currentReport);
      setIsDirty(false);
      refreshReports();
    }
    setSaveMessage('Đang tải file Word (.docx)...');
    setTimeout(() => setSaveMessage(null), 2500);
    await exportReportToDocx(currentReport);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setSaveMessage('Đang tạo file PDF...');
    try {
      if (userRole === 'admin') {
        storageService.saveReport(currentReport);
        setIsDirty(false);
        refreshReports();
      }

      const docEl = document.getElementById('detail-document-canvas') ||
                    document.getElementById('print-document') ||
                    document.getElementById('global-pdf-document');

      if (docEl) {
        const filename = generatePdfFilename(currentReport);
        await exportElementToPdf(docEl, filename, currentReport);
        setSaveMessage('Đã tải xong file PDF!');
      } else {
        handlePreviewPrint();
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      handlePreviewPrint();
    } finally {
      setIsExportingPdf(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handlePreviewPrint = (report?: ReportData) => {
    if (report) {
      setCurrentReport(report);
    }
    setShowPrintPreview(true);
  };

  const handleStaffUpdated = () => {
    setStaffDirectory(storageService.getStaffDirectory());
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Navigation Topbar with atvsld-ialy layout */}
      <Topbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'form' && userRole !== 'admin') {
            handleOpenAdminLogin();
            return;
          }
          setCurrentView(view);
        }}
        currentReport={currentReport}
        reportsList={reports}
        onSelectReport={handleSelectReport}
        onNewReport={handleNewReport}
        onSaveReport={handleSaveReport}
        onPreviewPrint={() => handlePreviewPrint()}
        onExportWord={handleExportWord}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
        onOpenStaffModal={() => setShowStaffModal(true)}
        userRole={userRole}
        onOpenAdminLogin={handleOpenAdminLogin}
        onAdminLogout={handleAdminLogout}
        onChangePin={handleChangePin}
        isDirty={isDirty}
        isSaving={isSaving}
        saveMessage={saveMessage}
      />

      {/* Floating Toast Notification */}
      {saveMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentView === 'form' && (
          <ReportForm
            data={currentReport}
            onChange={handleReportChange}
            onSave={handleSaveReport}
            onViewDetail={() => setCurrentView('preview')}
            onExportWord={handleExportWord}
            onPreviewPrint={() => handlePreviewPrint()}
            staffDirectory={staffDirectory}
            userRole={userRole}
            onOpenAdminLogin={handleOpenAdminLogin}
          />
        )}

        {currentView === 'preview' && (
          <ReportDetailView
            report={currentReport}
            onBackToHistory={() => setCurrentView('history')}
            onEdit={() => {
              if (userRole === 'admin') {
                setCurrentView('form');
              } else {
                handleOpenAdminLogin();
              }
            }}
            onExportWord={handleExportWord}
            onPrint={() => handlePreviewPrint()}
            userRole={userRole}
            onOpenAdminLogin={handleOpenAdminLogin}
          />
        )}

        {currentView === 'history' && (
          <ReportHistory
            reports={reports}
            onSelectReport={(rep) => {
              handleSelectReport(rep);
              if (userRole === 'admin') {
                setCurrentView('form');
              } else {
                setCurrentView('preview');
              }
            }}
            onViewReportDetail={(rep) => {
              handleSelectReport(rep);
              setCurrentView('preview');
            }}
            onNewReport={handleNewReport}
            onPreviewPrint={(rep) => handlePreviewPrint(rep)}
            onRefresh={refreshReports}
            userRole={userRole}
            onOpenAdminLogin={handleOpenAdminLogin}
          />
        )}
      </main>

      {/* Off-screen A4 Document for instant 1-click PDF download */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <DocumentA4Content report={currentReport} id="global-pdf-document" />
      </div>

      {/* Print Preview & PDF Modal */}
      {showPrintPreview && (
        <PrintPreviewModal
          report={currentReport}
          onClose={() => setShowPrintPreview(false)}
        />
      )}

      {/* Personnel Directory Modal */}
      {showStaffModal && (
        <StaffManagerModal
          onClose={() => setShowStaffModal(false)}
          onUpdate={handleStaffUpdated}
        />
      )}

      {/* Admin PIN Authentication & Change PIN Modal */}
      {showPinModal && (
        <AdminPinModal
          isOpen={true}
          mode={pinModalMode}
          initialMode={pinModalMode}
          onClose={() => setShowPinModal(false)}
          onSuccess={() => {
            setShowPinModal(false);
            if (pinModalMode === 'login') {
              setSaveMessage('Đăng nhập Quản trị viên thành công!');
              // Automatically switch to form editing if user logged in
              setCurrentView('form');
            } else {
              setSaveMessage('Đổi mã PIN Quản trị viên thành công (Đã đồng bộ sang máy khác)!');
            }
            setTimeout(() => setSaveMessage(null), 3000);
          }}
          onChangePinClick={() => setPinModalMode('change_pin')}
        />
      )}
    </div>
  );
}
