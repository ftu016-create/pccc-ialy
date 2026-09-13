export type UserRole = 'admin' | 'viewer';

export interface Person {
  id: string;
  name: string;
  role: string;
  signatureImage?: string; // base64 or preset
}

export interface EquipItem {
  id: string;
  stt: string;
  name: string;
  qty: string;
  ok: string;
  bad: string;
  note: string;
  isHeader?: boolean;
}

export interface FireSafetyItem {
  id: string;
  stt: string;
  name: string;
  qty: string;
  ok: string;
  bad: string;
  note: string;
}

export interface EscapeItem {
  id: string;
  stt: string;
  name: string;
  status: string;
  note: string;
}

export interface ReportData {
  id: string;
  // Số hiệu & địa danh
  so: string;
  place: string;
  header_day: string;
  header_month: string;
  header_year: string;
  
  // Tiêu đề & thời gian bắt đầu
  report_month: string;
  start_h: string;
  start_p: string;
  start_day: string;
  start_month: string;
  start_year: string;
  
  // Địa điểm kiểm tra
  inspection_areas: string;
  
  // 1. Thành phần tham gia
  people: Person[];
  
  // 2. Phương tiện, hệ thống PCCC
  equip: EquipItem[];
  equip_note: string;
  
  // 3. Nguồn lửa, nguồn nhiệt
  fire: FireSafetyItem[];
  
  // 4. Thoát nạn, ngăn cháy
  escape: EscapeItem[];
  
  // 5. Chấp hành nội quy
  compliance: string;
  
  // 6. Kiến nghị
  recommendations: string[];
  
  // Kết thúc & người ký
  end_h: string;
  end_p: string;
  signer_title: string;
  signer_role: string;
  manager: string;
  manager_signature?: string;
  
  // Meta
  created_at: string;
  updated_at: string;
}

export interface SavedReportMeta {
  id: string;
  month: string;
  report_date: string;
  title: string;
  created_at: string;
  updated_at: string;
  data: ReportData;
}
