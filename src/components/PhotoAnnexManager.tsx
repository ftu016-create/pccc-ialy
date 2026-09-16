import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  FileText,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FilePlus,
  Eye,
  Info,
  Layers,
  MapPin,
  Check,
  X,
  FileCheck2,
} from 'lucide-react';
import { ReportData, InspectionPhoto, AttachedDocument } from '../types';
import { autoClassifyPhoto, DEFAULT_IALY_SAMPLE_PHOTOS, getReportMonthDisplay } from '../utils/photoUtils';
import { renderPdfPagesToDataUrls } from '../utils/pdfRenderUtils';
import { PDFDocument } from 'pdf-lib';

interface PhotoAnnexManagerProps {
  report: ReportData;
  onChange: (updated: ReportData) => void;
}

export const PhotoAnnexManager: React.FC<PhotoAnnexManagerProps> = ({
  report,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<InspectionPhoto | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Synchronize latest report reference to prevent stale closure data loss
  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  const photos = report.photos || [];
  const attachedPdfs = report.attachedPdfs || [];

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => {
      setStatusNotification(null);
    }, 4000);
  };

  // Update photos in report
  const setPhotos = (newPhotos: InspectionPhoto[]) => {
    onChange({
      ...reportRef.current,
      photos: newPhotos,
    });
  };

  // Update attached PDFs in report
  const setAttachedPdfs = (newPdfs: AttachedDocument[]) => {
    onChange({
      ...reportRef.current,
      attachedPdfs: newPdfs,
    });
  };

  // Process uploaded files (images or PDFs)
  const processFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    let newPhotosCount = 0;
    let newPdfCount = 0;

    const newPhotosList: InspectionPhoto[] = [...(reportRef.current.photos || [])];
    const newPdfList: AttachedDocument[] = [...(reportRef.current.attachedPdfs || [])];

    const hasPdf = fileArr.some((f) => f.name.split('.').pop()?.toLowerCase() === 'pdf');
    if (hasPdf) {
      setIsProcessingPdf(true);
      showNotification('Đang nạp và xử lý các trang tài liệu PDF đính kèm...');
    }

    try {
      for (const file of fileArr) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
          // Process image
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          const classified = autoClassifyPhoto(file.name, dataUrl);
          newPhotosList.push(classified);
          newPhotosCount++;
        } else if (ext === 'pdf') {
          // Process PDF
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          // Fast & robust page counting via pdf-lib in memory
          let pageCount = 1;
          try {
            const base64Clean = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            let clean = base64Clean.replace(/[\s\r\n]+/g, '');
            while (clean.length % 4 !== 0) clean += '=';
            const binary = atob(clean);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
            pageCount = pdfDoc.getPageCount();
          } catch (cntErr) {
            console.warn('Cannot parse page count via pdf-lib:', cntErr);
          }

          // Pre-render page images synchronously for Word and print preview insertion
          let pageImages: string[] = [];
          try {
            pageImages = await renderPdfPagesToDataUrls(dataUrl, 20, 1.8);
            if (pageImages && pageImages.length > 0) {
              pageCount = pageImages.length;
            }
          } catch (renderErr) {
            console.warn('Cannot pre-render page images:', renderErr);
          }

          const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          newPdfList.push({
            id: pdfId,
            name: file.name,
            type: 'pdf',
            sizeBytes: file.size,
            pdfData: dataUrl,
            pageCount,
            pageImages,
            uploadedAt: new Date().toLocaleDateString('vi-VN'),
            includedInExport: true,
          });
          newPdfCount++;
        }
      }

      if (newPhotosCount > 0 || newPdfCount > 0) {
        onChange({
          ...reportRef.current,
          photos: newPhotosList,
          attachedPdfs: newPdfList,
        });

        const messages: string[] = [];
        if (newPhotosCount > 0) messages.push(`Đã tải lên & tự động phân loại ${newPhotosCount} ảnh`);
        if (newPdfCount > 0) messages.push(`Đã kết nối ${newPdfCount} tài liệu PDF vào biên bản`);
        showNotification(messages.join(' và '));
      }
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Update a specific photo field
  const updatePhoto = (id: string, field: keyof InspectionPhoto, value: any) => {
    const updated = photos.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setPhotos(updated);
  };

  // Move photo up/down
  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setPhotos(next);
  };

  // Delete photo
  const deletePhoto = (id: string) => {
    const next = photos.filter((p) => p.id !== id);
    setPhotos(next);
    showNotification('Đã xóa 1 ảnh khỏi phụ lục');
  };

  // Toggle PDF export inclusion
  const togglePdfInclusion = (id: string) => {
    const next = attachedPdfs.map((pdf) => {
      if (pdf.id === id) {
        return { ...pdf, includedInExport: !pdf.includedInExport };
      }
      return pdf;
    });
    setAttachedPdfs(next);
  };

  // Delete attached PDF
  const deletePdf = (id: string) => {
    const next = attachedPdfs.filter((pdf) => pdf.id !== id);
    setAttachedPdfs(next);
    showNotification('Đã xóa 1 file PDF khỏi danh sách đính kèm');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl shadow-xs p-5 sm:p-6 transition-all border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
            6. hình ảnh kiểm tra & Hồ sơ đính kèm
          </h2>
          <span className="ml-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {photos.length} hình ảnh
          </span>
          {attachedPdfs.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {attachedPdfs.length} file PDF kèm
            </span>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Toast Notification */}
      {statusNotification && (
        <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotification(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Clean Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-6 border-2 border-dashed rounded-xl p-5 text-center transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/60 scale-[1.005]'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-slate-800">
            Kéo thả ảnh hiện trường (.jpg, .png) hoặc file PDF sổ theo dõi vào đây
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Tự động lấy tên file ảnh làm tiêu đề minh chứng, tự động nhận diện vị trí và điền đánh giá chuẩn xác.
          </p>
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-emerald-700 shadow-2xs transition"
            >
              Chọn ảnh từ máy
            </button>
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-blue-700 shadow-2xs transition"
            >
              Chọn file PDF sổ theo dõi
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: PHOTO ANNEX LIST */}
      {(() => {
        const displayMonth = getReportMonthDisplay(report.report_month, report.header_month);

        return (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                PHỤ LỤC I: Hình ảnh thoát nạn Tháng {displayMonth} ({photos.length} hình • 4 hình / 1 trang)
              </h3>
              <span className="text-xs text-slate-500 italic">
                Hiển thị sau phần chữ ký trong Biên bản & chia đều 4 hình/trang khi xuất Word/PDF
              </span>
            </div>

            {photos.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                <p className="font-medium text-slate-700 mb-1">Chưa có hình ảnh kiểm tra hiện trường nào được tải lên.</p>
                <p className="text-xs text-slate-400">
                  Hãy kéo thả ảnh hiện trường (.jpg, .png) vào ô phía trên hoặc bấm &apos;Chọn ảnh từ máy tính&apos; để hệ thống tự động nhận diện vị trí và phân loại.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo, index) => {
              const statusColors =
                photo.status === 'passed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : photo.status === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200';

              const plantLabel =
                photo.plant === 'ialy_mr'
                  ? 'Ialy Mở rộng'
                  : photo.plant === 'pk'
                  ? 'Nhà PK'
                  : photo.plant === 'trạm_500kv'
                  ? 'Trạm 500kV'
                  : 'NMTĐ Ialy';

              return (
                <div
                  key={photo.id}
                  className="border border-slate-200 rounded-xl bg-slate-50/40 p-3.5 hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                >
                  {/* Photo Thumbnail & Top Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-800 text-white rounded">
                          Hình {index + 1}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                          {plantLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => movePhoto(index, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Di chuyển lên trên"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === photos.length - 1}
                          onClick={() => movePhoto(index, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Di chuyển xuống dưới"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePhoto(photo.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 ml-1"
                          title="Xóa hình ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview Box */}
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-black/5 aspect-[16/10] mb-2.5">
                      <img
                        src={photo.imageData}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewModalPhoto(photo)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        Xem ảnh kích thước lớn
                      </button>
                    </div>

                    {/* Form fields for photo */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-0.5">
                          Tiêu đề minh chứng
                        </label>
                        <input
                          type="text"
                          value={photo.title}
                          onChange={(e) => updatePhoto(photo.id, 'title', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Ví dụ: Lối thoát nạn Cao trình 309m..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-0.5">
                            Vị trí / Cao trình
                          </label>
                          <input
                            type="text"
                            value={photo.location}
                            onChange={(e) => updatePhoto(photo.id, 'location', e.target.value)}
                            className="w-full px-2 py-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500"
                            placeholder="Ví dụ: Cao trình 309m"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-0.5">
                            Đánh giá an toàn
                          </label>
                          <select
                            value={photo.status}
                            onChange={(e) => updatePhoto(photo.id, 'status', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="passed">Đạt / Đảm bảo</option>
                            <option value="warning">Cần lưu ý theo dõi</option>
                            <option value="failed">Không đạt / Cần khắc phục</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-0.5">
                          Ghi chú hiện trường
                        </label>
                        <textarea
                          rows={2}
                          value={photo.description}
                          onChange={(e) => updatePhoto(photo.id, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 resize-none"
                          placeholder="Mô tả hiện trạng lối thoát, đèn exit, bề mặt sàn..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-200/60 pt-2 mt-1">
                    <span>{photo.filename || 'Ảnh chụp hiện trường'}</span>
                    <span>{photo.capturedAt || '27/08/2026'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  })()}

      {/* SECTION 2: ATTACHED PDF DOCUMENTS FOR MERGING */}
      <div className="pt-4 border-t border-slate-200">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            PHỤ LỤC II: HỒ SƠ, SỔ THEO DÕI ĐÍNH KÈM (PDF)
            {attachedPdfs.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {attachedPdfs.length} file
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động nối nguyên vẹn tất cả các trang PDF vào cuối biên bản Word (.docx) và file PDF khi xuất.
          </p>
        </div>

        {attachedPdfs.length === 0 ? (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Chưa có file PDF nào. Bạn có thể kéo thả file scan <strong>Sổ theo dõi Bảng I</strong> hoặc <strong>Bảng II</strong> vào ô tải lên ở trên để tự động nối vào biên bản.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {attachedPdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition shadow-2xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span>{pdf.name}</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          ({formatFileSize(pdf.sizeBytes)} • {pdf.pageCount || 1} trang)
                        </span>
                        {pdf.pageImages && pdf.pageImages.length > 0 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                            Đã nạp {pdf.pageImages.length} trang
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tải lên lúc: {pdf.uploadedAt} • Tự động xuất hiện tại Phụ lục II
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      <input
                        type="checkbox"
                        checked={pdf.includedInExport !== false}
                        onChange={() => togglePdfInclusion(pdf.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Chèn vào Word & PDF khi xuất</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => deletePdf(pdf.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                      title="Xóa tài liệu này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Page Thumbnails preview if pageImages exist */}
                {pdf.pageImages && pdf.pageImages.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-[11px] font-semibold text-slate-500 shrink-0">Trang:</span>
                    {pdf.pageImages.map((pageImg, pIdx) => (
                      <div
                        key={`thumb-${pdf.id}-${pIdx}`}
                        className="relative group shrink-0 border border-slate-200 rounded overflow-hidden shadow-2xs bg-slate-50"
                        title={`${pdf.name} - Trang ${pIdx + 1}`}
                      >
                        <img
                          src={pageImg}
                          alt={`Trang ${pIdx + 1}`}
                          className="h-16 w-12 object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5 font-medium">
                          Trang {pIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Large Image Preview Modal */}
      {previewModalPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scaleUp">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {previewModalPhoto.title}
                </h4>
                <p className="text-xs text-slate-500">
                  Vị trí: {previewModalPhoto.location} • {previewModalPhoto.capturedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-900 flex items-center justify-center overflow-auto max-h-[65vh]">
              <img
                src={previewModalPhoto.imageData}
                alt={previewModalPhoto.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 text-xs text-slate-700">
              <span className="font-bold">Mô tả ghi nhận kiểm tra:</span> {previewModalPhoto.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
