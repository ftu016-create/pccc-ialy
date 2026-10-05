import React, { useState, useRef } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  Download,
  Printer,
  Trash2,
  Copy,
  Search,
  PlusCircle,
  Upload,
  AlertCircle,
  Eye,
  Edit,
  Lock,
  Shield,
  UploadCloud,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { ReportData, UserRole } from '../types';
import { storageService } from '../services/storage';
import { exportReportToDocx } from '../services/exportDocx';

interface ReportHistoryProps {
  reports: ReportData[];
  onSelectReport: (report: ReportData) => void;
  onViewReportDetail: (report: ReportData) => void;
  onNewReport: () => void;
  onPreviewPrint: (report: ReportData) => void;
  onRefresh: () => void;
  userRole: UserRole;
  onOpenAdminLogin: () => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  reports,
  onSelectReport,
  onViewReportDetail,
  onNewReport,
  onPreviewPrint,
  onRefresh,
  userRole,
  onOpenAdminLogin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      (r.report_month || '').toLowerCase().includes(q) ||
      (r.so || '').toLowerCase().includes(q) ||
      (r.manager || '').toLowerCase().includes(q) ||
      (r.place || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string) => {
    storageService.deleteReport(id);
    onRefresh();
  };

  const handleDuplicate = (id: string) => {
    const copy = storageService.duplicateReport(id);
    if (copy) {
      onRefresh();
      onSelectReport(copy);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pccc_ialy_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = storageService.importBackupJson(content);
        if (ok) {
          alert('Khôi phục dữ liệu sao lưu thành công!');
          onRefresh();
        } else {
          alert('Tệp sao lưu không hợp lệ.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-[calc(100%-32px)] max-w-[1600px] mx-auto my-7 font-sans">
      {/* Container card */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-6 sm:p-8">
        {/* Header Title & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📚</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Báo cáo các tháng đã lưu
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý danh sách biên bản tự kiểm tra PCCC & CNCH định kỳ của Phân xưởng Vận hành Ialy.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {userRole === 'admin' ? (
              <>
                <button
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                  title="Tải về file sao lưu toàn bộ biên bản"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sao lưu</span>
                </button>

                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Khôi phục</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </label>
              </>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
                title="Đăng nhập Quản trị viên"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Đăng nhập Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="my-5 flex items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tháng (VD: 08/2026), số hiệu, người ký..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tìm thấy <strong className="text-slate-800">{filtered.length}</strong> báo cáo
          </div>
        </div>

        {/* Table or Empty */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">Chưa có báo cáo nào</h3>
            <p className="text-sm text-slate-500 mt-1">
              Bắt đầu tạo biên bản tự kiểm tra PCCC cho tháng đầu tiên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-[12%]">Tháng</th>
                  <th className="py-3 px-4 w-[16%]">Thời điểm kiểm tra</th>
                  <th className="py-3 px-4 w-[40%]">Tên báo cáo & Số hiệu</th>
                  <th className="py-3 px-4 w-[14%]">Ngày cập nhật</th>
                  <th className="py-3 px-4 w-[18%] text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-blue-900">
                        Tháng {item.report_month}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {item.start_day}/{item.start_month}/{item.start_year} ({item.start_h}:{item.start_p})
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          Biên bản tự kiểm tra PCCC&CNCH tháng {item.report_month}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Số: <span className="font-mono text-slate-700">{item.so || 'Chưa đặt số'}</span> • Người ký:{' '}
                          <span className="font-medium text-slate-700">{item.manager}</span>
                        </div>
                        {/* Attachments badges: Photos, PDF, Google Sheet */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {item.photos && item.photos.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <Camera className="w-3 h-3 text-emerald-600" />
                              <span>{item.photos.length} hình ảnh</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Chưa có ảnh
                            </span>
                          )}

                          {item.attachedPdfs && item.attachedPdfs.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>{item.attachedPdfs.length} file PDF</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(item.updated_at || item.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {/* Sửa báo cáo */}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => {
                                const full = storageService.getReportById(item.id) || item;
                                onSelectReport(full);
                              }}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                              title="Sửa biên bản"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                          )}

                          {/* Xem A4 */}
                          <button
                            onClick={() => {
                              const full = storageService.getReportById(item.id) || item;
                              onViewReportDetail(full);
                            }}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="Xem trước A4"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem</span>
                          </button>

                          {/* Tải Word */}
                          <button
                            onClick={() => {
                              const full = storageService.getReportById(item.id) || item;
                              exportReportToDocx(full);
                            }}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Xuất file Word"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Word</span>
                          </button>

                          {/* In ấn */}
                          <button
                            onClick={() => {
                              const full = storageService.getReportById(item.id) || item;
                              onPreviewPrint(full);
                            }}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="In văn bản"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>In</span>
                          </button>

                          {/* Tạo bản sao: Chỉ cho Admin */}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDuplicate(item.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Nhân bản biên bản"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Xóa báo cáo: Chỉ cho Admin */}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Xóa biên bản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
