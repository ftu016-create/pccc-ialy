import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Link2,
  ExternalLink,
  Download,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  RefreshCw,
  Table,
} from 'lucide-react';
import { ReportData } from '../types';
import { fetchGoogleSheetData, parseCsvOrTsv, parseGoogleSheetUrl } from '../services/googleSheetService';

interface GoogleSheetSyncCardProps {
  report: ReportData;
  onChange: (updated: ReportData) => void;
  onSave?: () => void;
}

export const GoogleSheetSyncCard: React.FC<GoogleSheetSyncCardProps> = ({
  report,
  onChange,
  onSave,
}) => {
  const [sheetUrl, setSheetUrl] = useState(report.google_sheet_url || '');
  const [sheetTitle, setSheetTitle] = useState(
    report.google_sheet_title || `Bảng kiểm tra chi tiết thiết bị PCCC tháng ${report.report_month}`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [showPreviewTable, setShowPreviewTable] = useState(false);

  const sheetData = report.google_sheet_data;

  const showStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  const handleUrlChange = (newUrl: string) => {
    setSheetUrl(newUrl);
    const updated: ReportData = {
      ...report,
      google_sheet_url: newUrl.trim(),
      google_sheet_title: sheetTitle.trim(),
    };
    onChange(updated);
  };

  const handleTitleChange = (newTitle: string) => {
    setSheetTitle(newTitle);
    const updated: ReportData = {
      ...report,
      google_sheet_title: newTitle.trim(),
    };
    onChange(updated);
  };

  // Sync / Fetch data from Google Sheets
  const handleFetchSheetData = async () => {
    if (!sheetUrl.trim()) {
      showStatus('Vui lòng nhập đường link Google Sheet trước khi tải dữ liệu.', 'error');
      return;
    }

    const parsed = parseGoogleSheetUrl(sheetUrl);
    if (!parsed.isValid) {
      showStatus('Đường link Google Sheet không đúng định dạng. (VD: https://docs.google.com/spreadsheets/d/...)', 'error');
      return;
    }

    setIsLoading(true);
    showStatus('Đang kết nối và tải dữ liệu từ Google Sheets...', 'info');

    try {
      const res = await fetchGoogleSheetData(sheetUrl);

      if (res.error) {
        showStatus(res.error, 'error');
        setIsLoading(false);
        return;
      }

      if (!res.headers || res.headers.length === 0 || !res.rows || res.rows.length === 0) {
        showStatus('Không tìm thấy dữ liệu dòng nào trong trang tính Google Sheets này.', 'error');
        setIsLoading(false);
        return;
      }

      const updatedData: ReportData = {
        ...report,
        google_sheet_url: sheetUrl.trim(),
        google_sheet_title: sheetTitle.trim(),
        google_sheet_data: {
          headers: res.headers,
          rows: res.rows,
          totalRows: res.rows.length,
          lastSyncedAt: new Date().toLocaleString('vi-VN'),
        },
      };

      onChange(updatedData);
      if (onSave) onSave();
      showStatus(`Đã tải thành công ${res.rows.length} dòng kiểm tra từ Google Sheet!`, 'success');
      setShowPreviewTable(true);
    } catch (err: any) {
      showStatus(err?.message || 'Có lỗi xảy ra khi nạp Google Sheet.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Paste table data directly from Google Sheets or Excel (Ctrl+V)
  const handleApplyPastedData = () => {
    if (!pasteContent.trim()) {
      showStatus('Vui lòng dán dữ liệu bảng từ Google Sheets vào ô trước khi bấm áp dụng.', 'error');
      return;
    }

    const parsed = parseCsvOrTsv(pasteContent);
    if (!parsed.headers || parsed.headers.length === 0 || !parsed.rows || parsed.rows.length === 0) {
      showStatus('Không thể nhận diện các cột dữ liệu. Hãy chọn các ô trong Google Sheet rồi nhấn Ctrl+C và dán lại.', 'error');
      return;
    }

    const updatedData: ReportData = {
      ...report,
      google_sheet_url: sheetUrl.trim(),
      google_sheet_title: sheetTitle.trim(),
      google_sheet_data: {
        headers: parsed.headers,
        rows: parsed.rows,
        totalRows: parsed.rows.length,
        lastSyncedAt: new Date().toLocaleString('vi-VN'),
      },
    };

    onChange(updatedData);
    if (onSave) onSave();
    setShowPasteModal(false);
    setPasteContent('');
    showStatus(`Đã áp dụng thành công ${parsed.rows.length} dòng dữ liệu từ Google Sheet!`, 'success');
    setShowPreviewTable(true);
  };

  const handleClearSheetData = () => {
    if (window.confirm('Bạn có chắc muốn xóa liên kết và dữ liệu Google Sheet khỏi biên bản này?')) {
      const updated: ReportData = {
        ...report,
        google_sheet_url: '',
        google_sheet_title: '',
        google_sheet_data: undefined,
      };
      setSheetUrl('');
      onChange(updated);
      if (onSave) onSave();
      showStatus('Đã xóa dữ liệu liên kết Google Sheet.', 'info');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-emerald-200/90 overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-800 px-5 py-4 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs text-white shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
              <span>Liên kết Bảng kiểm tra Google Sheets</span>
              {sheetData && (
                <span className="text-[11px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                  Đã đồng bộ {sheetData.totalRows || sheetData.rows.length} dòng
                </span>
              )}
            </h3>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Chèn đường dẫn Google Sheets kiểm tra thiết bị định kỳ. Khi xuất Word, nội dung bảng tính và hình ảnh minh chứng sẽ được tự động kết nối liền mạch.
            </p>
          </div>
        </div>

        {report.google_sheet_url && (
          <div className="flex items-center gap-2">
            <a
              href={report.google_sheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
              title="Mở bảng tính Google Sheets này trong tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở trang tính</span>
            </a>

            <button
              type="button"
              onClick={handleClearSheetData}
              className="p-1.5 text-rose-200 hover:text-white hover:bg-rose-600/40 rounded-lg transition"
              title="Xóa liên kết Google Sheet"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Body Controls */}
      <div className="p-5 space-y-4">
        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border border-rose-300'
                : 'bg-blue-50 text-blue-900 border border-blue-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            <div className="flex-1">{statusMessage.text}</div>
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          {/* URL Input */}
          <div className="md:col-span-8">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Đường link Google Sheets (Trang tính kiểm tra PCCC)
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Dán link Google Sheets tại đây (VD: https://docs.google.com/spreadsheets/d/.../edit#gid=0)"
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Sheet Title */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên / Tiêu đề bảng kiểm tra
            </label>
            <input
              type="text"
              value={sheetTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="VD: Bảng II - Kiểm tra PCCC tháng 08/2026"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Fetch Online Button */}
            <button
              type="button"
              onClick={handleFetchSheetData}
              disabled={isLoading || !sheetUrl.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="Tự động kết nối và tải các dòng kiểm tra từ Google Sheet về máy"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Nạp dữ liệu từ Google Sheets</span>
                </>
              )}
            </button>

            {/* Direct Paste Button */}
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Sao chép các dòng trong Google Sheet (Ctrl+C) rồi dán nhanh (Ctrl+V) vào đây"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-slate-600" />
              <span>Dán trực tiếp (Ctrl+V)</span>
            </button>

            {sheetData && (
              <button
                type="button"
                onClick={() => setShowPreviewTable((p) => !p)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                <span>{showPreviewTable ? 'Thu gọn bảng xem trước' : `Xem bảng dữ liệu (${sheetData.rows.length} dòng)`}</span>
              </button>
            )}
          </div>

          {sheetData?.lastSyncedAt && (
            <div className="text-[11px] text-slate-500 italic">
              Đồng bộ lúc: {sheetData.lastSyncedAt}
            </div>
          )}
        </div>

        {/* Preview Table */}
        {showPreviewTable && sheetData && (
          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <span className="font-bold">
                {sheetTitle || 'Bảng dữ liệu kiểm tra chi tiết'} ({sheetData.rows.length} hàng)
              </span>
              <span className="text-[11px] text-slate-500">
                Hiển thị tối đa 20 dòng đầu tiên
              </span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-200/80 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-2 px-3 w-12 text-center">STT</th>
                    {sheetData.headers.slice(0, 7).map((h, i) => (
                      <th key={`th-${i}`} className="py-2 px-3 border-l border-slate-300">
                        {h || `Cột ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {sheetData.rows.slice(0, 20).map((row, rIdx) => (
                    <tr key={`r-${rIdx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {rIdx + 1}
                      </td>
                      {row.slice(0, 7).map((cell, cIdx) => (
                        <td key={`c-${rIdx}-${cIdx}`} className="py-2 px-3 text-slate-800 border-l border-slate-200">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <ClipboardPaste className="w-5 h-5 text-emerald-600" />
                <span>Dán dữ liệu trực tiếp từ Google Sheet / Excel</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Cách làm: Mở file Google Sheet hoặc Excel của anh, bôi đen toàn bộ các ô kiểm tra (bao gồm cả dòng tiêu đề), nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">Ctrl+C</kbd>, sau đó nhấn vào khung bên dưới và bấm <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">Ctrl+V</kbd>.
            </p>

            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              rows={9}
              placeholder="Dán nội dung bảng từ Google Sheet / Excel tại đây (nhấn Ctrl+V)..."
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyPastedData}
                disabled={!pasteContent.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition"
              >
                Áp dụng dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
