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
  FileSpreadsheet,
  Upload,
  AlertCircle,
  Eye,
  Edit,
  Lock,
  Shield,
  UploadCloud,
  CheckCircle2,
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
    setDeleteConfirmId(null);
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

          <div className="flex items-center flex-wrap gap-2.5">
            {userRole === 'admin' ? (
              <>
                <button
                  onClick={onNewReport}
                  title="Tạo biên bản cho tháng mới"
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-emerald-600/25"
                >
                  <PlusCircle className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>+ Tạo báo cáo mới</span>
                </button>

                <button
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                  title="Tải về file sao lưu toàn bộ biên bản"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sao lưu JSON</span>
                </button>

                <label className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nhập sao lưu</span>
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
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                title="Đăng nhập tài khoản Quản trị viên để chỉnh sửa dữ liệu"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
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
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(item.updated_at || item.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Sửa báo cáo: Chỉ hiển thị khi đã đăng nhập quyền admin */}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => onSelectReport(item)}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Sửa nội dung biên bản tháng này"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                          )}

                          {/* Xem chi tiết văn bản chuẩn A4 */}
                          <button
                            onClick={() => onViewReportDetail(item)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Xem chi tiết văn bản Mẫu PC02 định dạng chuẩn A4 (có Phụ lục I và Phụ lục II)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem</span>
                          </button>

                          {/* Tải Word */}
                          <button
                            onClick={() => exportReportToDocx(item)}
                            className="px-2.5 py-1.5 bg-[#218838] hover:bg-[#1e7e34] text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Tải văn bản Word .docx (kèm Phụ lục II giấy ngang)"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Word</span>
                          </button>

                          <button
                            onClick={() => onPreviewPrint(item)}
                            className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Xem trước định dạng chuẩn A4 & In"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>In / PDF</span>
                          </button>

                          {/* Tạo bản sao: Chỉ hiển thị cho Admin */}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDuplicate(item.id)}
                              className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-semibold cursor-pointer"
                              title="Tạo bản sao biên bản này"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Xóa báo cáo: Chỉ cho Admin */}
                          {userRole === 'admin' && (
                            deleteConfirmId === item.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 p-1 rounded">
                                <span className="text-[11px] text-rose-700 font-bold">Xóa?</span>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="px-2 py-0.5 bg-rose-600 text-white text-xs rounded hover:bg-rose-700 font-bold cursor-pointer"
                                >
                                  Có
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-0.5 bg-slate-300 text-slate-800 text-xs rounded hover:bg-slate-400 cursor-pointer"
                                >
                                  Không
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="px-2 py-1.5 bg-[#dc4c4c] hover:bg-[#c62828] text-white rounded text-xs font-semibold shadow-2xs cursor-pointer"
                                title="Xóa báo cáo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
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
