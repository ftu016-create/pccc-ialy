import React, { useState } from 'react';
import { ReportData } from './types';
import { storageService } from './services/storage';
import { createNewReport } from './data/defaultData';
import { exportReportToDocx } from './services/exportDocx';
import { exportElementToPdf, generatePdfFilename } from './services/exportPdf';
import { Topbar } from './components/Topbar';
import { ReportForm } from './components/ReportForm';
import { ReportDetailView } from './components/ReportDetailView';
import { ReportHistory } from './components/ReportHistory';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { StaffManagerModal } from './components/StaffManagerModal';
import { DeployVercelModal } from './components/DeployVercelModal';
import { DocumentA4Content } from './components/DocumentA4Content';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [reports, setReports] = useState<ReportData[]>(() => storageService.getAllReports());
  const [currentReport, setCurrentReport] = useState<ReportData>(() => {
    const list = storageService.getAllReports();
    return list.length > 0 ? list[0] : createNewReport();
  });
  const [currentView, setCurrentView] = useState<'form' | 'preview' | 'history'>('form');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [staffDirectory, setStaffDirectory] = useState(() => storageService.getStaffDirectory());

  const refreshReports = () => {
    const updated = storageService.getAllReports();
    setReports(updated);
  };

  const handleReportChange = (updated: ReportData) => {
    setCurrentReport(updated);
    setIsDirty(true);
  };

  const handleSaveReport = () => {
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
    storageService.saveReport(currentReport);
    setIsDirty(false);
    refreshReports();
    setSaveMessage('Đang tải file Word (.docx)...');
    setTimeout(() => setSaveMessage(null), 2500);
    await exportReportToDocx(currentReport);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setSaveMessage('Đang tạo file PDF...');
    try {
      storageService.saveReport(currentReport);
      setIsDirty(false);
      refreshReports();

      let docEl = document.getElementById('detail-document-canvas') ||
                  document.getElementById('print-document') ||
                  document.getElementById('global-pdf-document');

      if (docEl) {
        const filename = generatePdfFilename(currentReport);
        await exportElementToPdf(docEl, filename);
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
        onNavigate={(view) => setCurrentView(view)}
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
        onOpenDeployModal={() => setShowDeployModal(true)}
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
          />
        )}

        {currentView === 'preview' && (
          <ReportDetailView
            report={currentReport}
            onEdit={() => setCurrentView('form')}
            onExportWord={handleExportWord}
            onPrint={() => handlePreviewPrint()}
          />
        )}

        {currentView === 'history' && (
          <ReportHistory
            reports={reports}
            onSelectReport={(rep) => {
              handleSelectReport(rep);
              setCurrentView('form');
            }}
            onNewReport={handleNewReport}
            onPreviewPrint={(rep) => handlePreviewPrint(rep)}
            onRefresh={refreshReports}
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

      {/* GitHub & Vercel Auto Link Modal */}
      {showDeployModal && (
        <DeployVercelModal
          onClose={() => setShowDeployModal(false)}
        />
      )}
    </div>
  );
}
