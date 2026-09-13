import React from 'react';
import {
  FileText,
  Plus,
  History,
  Printer,
  Download,
  Save,
  Users,
  Eye,
  CheckCircle2,
  Edit3,
  Flame,
  ChevronDown,
  Loader2,
  Globe,
} from 'lucide-react';
import { ReportData } from '../types';

interface TopbarProps {
  currentView: 'form' | 'preview' | 'history';
  onNavigate: (view: 'form' | 'preview' | 'history') => void;
  currentReport: ReportData;
  reportsList: ReportData[];
  onSelectReport: (report: ReportData) => void;
  onNewReport: () => void;
  onSaveReport: () => void;
  onPreviewPrint: () => void;
  onExportWord: () => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
  onOpenStaffModal: () => void;
  onOpenDeployModal?: () => void;
  isDirty?: boolean;
  isSaving?: boolean;
  saveMessage?: string | null;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentView,
  onNavigate,
  currentReport,
  reportsList,
  onSelectReport,
  onNewReport,
  onSaveReport,
  onPreviewPrint,
  onExportWord,
  onExportPdf,
  isExportingPdf,
  onOpenStaffModal,
  onOpenDeployModal,
  isDirty,
  isSaving,
  saveMessage,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tier 1: Brand Info & Primary Actions (Save, Print, Export Word) */}
        <div className="flex items-center justify-between py-2.5 gap-3 border-b border-slate-100">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                  Biên Bản PCCC & CNCH
                </h1>
                {currentView !== 'history' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Tháng {currentReport.report_month}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-tight">
                VHIALY • Công ty Thủy điện Ialy
              </p>
            </div>
          </div>

          {/* Primary Actions: Save, Print PDF, Export Word */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status indicator on desktop */}
            <div className="hidden lg:flex items-center text-xs mr-1 font-medium text-slate-500">
              {isSaving ? (
                <span className="inline-flex items-center gap-1 text-blue-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang lưu...
                </span>
              ) : isDirty ? (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Chưa lưu thay đổi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã lưu an toàn
                </span>
              )}
            </div>

            {/* Save Button (when in form mode) */}
            {currentView === 'form' && (
              <button
                type="button"
                id="btn-save-report"
                onClick={onSaveReport}
                disabled={isSaving}
                title="Lưu dữ liệu biên bản hiện tại vào bộ nhớ"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition whitespace-nowrap border cursor-pointer ${
                  isDirty
                    ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                    : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <Save className={`w-3.5 h-3.5 ${isDirty ? 'text-blue-600' : 'text-slate-600'}`} />
                )}
                <span>{isSaving ? 'Đang lưu...' : isDirty ? 'Lưu ngay*' : 'Lưu'}</span>
              </button>
            )}

            {/* Tải file PDF trực tiếp */}
            {onExportPdf && (
              <button
                type="button"
                id="btn-download-pdf"
                onClick={onExportPdf}
                disabled={isExportingPdf}
                title={`Tải trực tiếp file PDF (khổ A4) cho biên bản Tháng ${currentReport.report_month}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Tải file PDF'}</span>
              </button>
            )}

            {/* Xuất Word (.docx) */}
            <button
              type="button"
              id="btn-export-word"
              onClick={onExportWord}
              title={`Xuất file Word (.docx) chuẩn Nghị định 30 cho Tháng ${currentReport.report_month}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm shadow-blue-500/25 transition whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Word</span>
            </button>

            {/* In / Xem trước A4 */}
            <button
              type="button"
              id="btn-print-pdf"
              onClick={onPreviewPrint}
              title={`In hoặc xem trước văn bản khổ A4 Tháng ${currentReport.report_month}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>In ấn</span>
            </button>
          </div>
        </div>

        {/* Tier 2: View Switcher (Tabs) & Supporting Tools */}
        <div className="flex items-center justify-between py-2 gap-3 flex-wrap">
          {/* Navigation Tabs (Soạn thảo | Xem văn bản | Lịch sử) */}
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              id="tab-view-form"
              onClick={() => onNavigate('form')}
              title="Vào giao diện soạn thảo & chỉnh sửa chi tiết biểu mẫu"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'form'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Soạn thảo biểu mẫu</span>
            </button>

            <button
              type="button"
              id="tab-view-preview"
              onClick={() => onNavigate('preview')}
              title="Xem trước văn bản thể thức hành chính A4 chi tiết"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'preview'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem văn bản chi tiết</span>
            </button>

            <button
              type="button"
              id="tab-view-history"
              onClick={() => onNavigate('history')}
              title="Xem danh sách tất cả các biên bản theo từng tháng"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'history'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử các tháng</span>
            </button>
          </div>

          {/* Supporting Tools & Quick Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 shrink-0">
            {/* Quick Month Switcher Dropdown */}
            {reportsList.length > 1 && (
              <div className="relative">
                <select
                  value={currentReport.id}
                  onChange={(e) => {
                    const found = reportsList.find((r) => r.id === e.target.value);
                    if (found) onSelectReport(found);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl outline-hidden cursor-pointer"
                  title="Chuyển nhanh giữa các tháng đã lập biên bản"
                >
                  {reportsList.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      Tháng {rep.report_month} {rep.id === currentReport.id ? '✓' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Delegation Directory Button */}
            <button
              type="button"
              id="btn-staff-directory"
              onClick={onOpenStaffModal}
              title="Quản lý danh bạ nhân sự đoàn kiểm tra tham gia"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition whitespace-nowrap cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span>Danh sách đoàn</span>
            </button>

            {/* New Report Button */}
            <button
              type="button"
              id="btn-new-report"
              onClick={onNewReport}
              title="Tạo biên bản cho tháng mới"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>Tạo mới</span>
            </button>

            {/* GitHub & Vercel Auto Link */}
            {onOpenDeployModal && (
              <button
                type="button"
                id="btn-deploy-vercel"
                onClick={onOpenDeployModal}
                title="Hướng dẫn liên kết GitHub và Vercel để đưa ứng dụng lên mạng miễn phí"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition whitespace-nowrap shadow-2xs cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Vercel & GitHub</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
