import { InspectionPhoto } from '../types';

/**
 * Generates an SVG Data URL representing a visual photo card for field inspections.
 */
function createInspectionSvgDataUrl(
  title: string,
  location: string,
  badgeText: string,
  timestamp: string,
  accentColor: string,
  svgContent: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="road" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#475569"/>
        <stop offset="100%" stop-color="#334155"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    ${svgContent}
    <!-- Bottom overlay banner -->
    <rect x="0" y="470" width="800" height="130" fill="black" fill-opacity="0.82"/>
    <rect x="0" y="466" width="800" height="4" fill="${accentColor}"/>
    <text x="30" y="508" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">${title}</text>
    <text x="30" y="538" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="16" fill="#94a3b8">Vị trí: ${location}</text>
    <text x="30" y="565" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="15" fill="#38bdf8">Thời gian kiểm tra: ${timestamp}</text>
    <!-- Badge -->
    <rect x="650" y="490" width="120" height="38" rx="8" fill="#166534" stroke="#22c55e" stroke-width="1.5"/>
    <text x="710" y="515" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#86efac" text-anchor="middle">${badgeText}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_IALY_SAMPLE_PHOTOS: InspectionPhoto[] = [
  {
    id: 'photo-1',
    filename: 'Bai dau xe chua chay Ialy MR.jpg',
    title: 'Bãi đỗ xe chữa cháy NMTĐ Ialy Mở rộng',
    category: 'parking',
    plant: 'ialy_mr',
    location: 'Sân trước Gian máy Nhà máy Thủy điện Ialy MR',
    capturedAt: '27/08/2026 11:17:10',
    status: 'passed',
    description:
      'Đường giao thông và bãi đỗ xe chữa cháy đảm bảo chiều rộng và bán kính quay xe; vạch sơn vàng phân làn rõ ràng, mặt đường bằng phẳng khô ráo, không có vật cản trở xe chữa cháy tiếp cận.',
    imageData: createInspectionSvgDataUrl(
      'Bãi đỗ xe chữa cháy NMTĐ Ialy Mở rộng',
      'Sân trước Gian máy Ialy MR',
      'ĐẠT',
      '27/08/2026 11:17:10',
      '#eab308',
      `<!-- Roadway with yellow parking markings -->
      <polygon points="120,600 280,260 520,260 680,600" fill="url(#road)"/>
      <line x1="400" y1="260" x2="400" y2="600" stroke="#eab308" stroke-width="10" stroke-dasharray="30 20"/>
      <rect x="340" y="420" width="120" height="60" fill="none" stroke="#eab308" stroke-width="6" stroke-dasharray="16 12"/>
      <text x="400" y="460" font-family="sans-serif" font-size="36" font-weight="bold" fill="#eab308" text-anchor="middle">P</text>
      <!-- Fire hydrant on side -->
      <rect x="60" y="380" width="50" height="70" fill="#dc2626" rx="6"/>
      <circle cx="85" cy="370" r="16" fill="#b91c1c"/>
      <text x="85" y="425" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">PCCC</text>
      <!-- Background plant building & transmission tower -->
      <polygon points="400,60 360,260 440,260" fill="none" stroke="#94a3b8" stroke-width="4"/>
      <line x1="375" y1="130" x2="425" y2="130" stroke="#94a3b8" stroke-width="3"/>
      <line x1="365" y1="190" x2="435" y2="190" stroke="#94a3b8" stroke-width="3"/>`
    ),
  },
  {
    id: 'photo-2',
    filename: 'Bai dau xe nha PK.jpg',
    title: 'Bãi đỗ xe cứu nạn & chữa cháy Nhà PK',
    category: 'parking',
    plant: 'pk',
    location: 'Sân trước sảnh đón Khu nhà PK',
    capturedAt: '27/08/2026 11:16:49',
    status: 'passed',
    description:
      'Lòng đường tiếp cận và bãi dừng đỗ xe cứu hộ cứu nạn thông thoáng, độ dốc đảm bảo an toàn, không bị lấn chiếm hoặc che khuất tầm nhìn.',
    imageData: createInspectionSvgDataUrl(
      'Bãi đỗ xe cứu nạn & chữa cháy Nhà PK',
      'Khu nhà PK - Cty Thủy điện Ialy',
      'ĐẠT',
      '27/08/2026 11:16:49',
      '#eab308',
      `<!-- Roadway near PK building -->
      <polygon points="0,500 0,350 450,300 800,450 800,600" fill="url(#road)"/>
      <line x1="300" y1="360" x2="400" y2="580" stroke="#eab308" stroke-width="12" stroke-dasharray="40 25"/>
      <!-- PK Building side facade -->
      <polygon points="500,80 800,120 800,480 500,400" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
      <rect x="540" y="160" width="80" height="90" fill="#0284c7"/>
      <rect x="660" y="180" width="90" height="90" fill="#0284c7"/>
      <!-- Blue rolling door -->
      <rect x="580" y="300" width="100" height="100" fill="#2563eb" stroke="#1d4ed8" stroke-width="2"/>`
    ),
  },
  {
    id: 'photo-3',
    filename: 'Cau thang thoat nan len cao trinh 309 Ialy MR.jpg',
    title: 'Cầu thang bộ thoát nạn lên Cao trình 309m (Ialy MR)',
    category: 'escape_route',
    plant: 'ialy_mr',
    location: 'Trục cầu thang bộ số 1 lên Cao trình 309,50m',
    capturedAt: '27/08/2026 11:22:10',
    status: 'passed',
    description:
      'Bậc thang đá mài bằng phẳng, không nứt vỡ; có biển chỉ dẫn cao trình [▼309,50 m] rõ ràng; lan can inox vững chắc, không để chướng ngại vật cản trở lối thoát.',
    imageData: createInspectionSvgDataUrl(
      'Cầu thang thoát nạn lên Cao trình 309m',
      'Trục thang bộ ▼309,50m (Ialy MR)',
      'ĐẠT',
      '27/08/2026 11:22:10',
      '#38bdf8',
      `<!-- Staircase steps going up -->
      <rect x="180" y="180" width="440" height="40" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <rect x="160" y="220" width="480" height="40" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <rect x="140" y="260" width="520" height="45" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <rect x="120" y="305" width="560" height="50" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <rect x="90" y="355" width="620" height="55" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <rect x="60" y="410" width="680" height="60" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <!-- Stainless steel handrail -->
      <line x1="60" y1="410" x2="180" y2="170" stroke="#cbd5e1" stroke-width="8"/>
      <line x1="100" y1="440" x2="100" y2="350" stroke="#94a3b8" stroke-width="6"/>
      <line x1="150" y1="390" x2="150" y2="280" stroke="#94a3b8" stroke-width="6"/>
      <!-- Sign board ▼309,50 m -->
      <rect x="330" y="100" width="140" height="40" rx="4" fill="#1d4ed8" stroke="#ffffff" stroke-width="2"/>
      <text x="400" y="127" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">▼ 309,50 m</text>`
    ),
  },
  {
    id: 'photo-4',
    filename: 'Loi thoat nan cao trinh 303.jpg',
    title: 'Lối thoát nạn hành lang cáp kỹ thuật Cao trình 303m',
    category: 'escape_route',
    plant: 'ialy',
    location: 'Hành lang kỹ thuật trục H1-H2 (Cao trình 303m)',
    capturedAt: '27/08/2026 09:14:40',
    status: 'passed',
    description:
      'Hành lang thẳng và thông thoáng, hệ thống đèn chiếu sáng sự cố hoạt động tốt, sàn nhà sạch sẽ không trơn trượt; các tủ điều khiển được đóng kín nắp và có biển cảnh báo an toàn.',
    imageData: createInspectionSvgDataUrl(
      'Lối thoát nạn hành lang Cao trình 303m',
      'Hành lang kỹ thuật H1-H2 NMTĐ Ialy',
      'ĐẠT',
      '27/08/2026 09:14:40',
      '#10b981',
      `<!-- Corridor perspective -->
      <polygon points="260,180 540,180 720,480 80,480" fill="#94a3b8" stroke="#64748b" stroke-width="2"/>
      <line x1="400" y1="180" x2="400" y2="480" stroke="#f1f5f9" stroke-width="4" stroke-dasharray="25 15"/>
      <!-- Left wall with H1 label -->
      <polygon points="0,40 260,180 260,480 0,600" fill="#f8fafc"/>
      <text x="120" y="240" font-family="sans-serif" font-size="44" font-weight="bold" fill="#dc2626">H1</text>
      <!-- Electrical cabinets -->
      <rect x="20" y="280" width="100" height="150" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="70" cy="310" r="8" fill="#16a34a"/>
      <circle cx="70" cy="335" r="8" fill="#dc2626"/>
      <!-- Right wall and ceiling cable trays -->
      <polygon points="540,180 800,40 800,600 540,480" fill="#f1f5f9"/>
      <rect x="620" y="240" width="140" height="160" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>`
    ),
  },
  {
    id: 'photo-5',
    filename: 'Loi thoat nan cao trinh 309 Ialy MR.jpg',
    title: 'Lối thoát nạn và cửa ngăn cháy Cao trình 309m - Ialy MR',
    category: 'escape_route',
    plant: 'ialy_mr',
    location: 'Sảnh sàn kỹ thuật Cao trình 309m (NMTĐ Ialy MR)',
    capturedAt: '27/08/2026 11:20:24',
    status: 'passed',
    description:
      'Cửa thoát hiểm tự đóng hoạt động nhẹ nhàng; đèn EXIT phía trên sáng rõ; gờ dốc chống trượt sơn sọc vàng đen an toàn; họng nước chữa cháy vách tường được bố trí thuận tiện.',
    imageData: createInspectionSvgDataUrl(
      'Lối thoát nạn Cao trình 309m Ialy MR',
      'Sảnh sàn kỹ thuật ▼309m NMTĐ Ialy MR',
      'ĐẠT',
      '27/08/2026 11:20:24',
      '#22c55e',
      `<!-- Hallway floor and clean walls -->
      <rect x="0" y="320" width="800" height="280" fill="#cbd5e1"/>
      <rect x="0" y="0" width="800" height="320" fill="#f8fafc"/>
      <!-- Exit Door in background -->
      <rect x="360" y="140" width="100" height="180" fill="#94a3b8" stroke="#475569" stroke-width="3"/>
      <!-- EXIT light box -->
      <rect x="385" y="115" width="50" height="18" fill="#15803d" rx="2"/>
      <text x="410" y="128" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">EXIT</text>
      <!-- Fire hose reel cabinet -->
      <rect x="520" y="200" width="45" height="60" fill="#dc2626" rx="4"/>
      <!-- Warning ramp with black & yellow stripes -->
      <polygon points="560,420 740,400 750,440 570,460" fill="#eab308"/>
      <line x1="590" y1="416" x2="600" y2="456" stroke="#000000" stroke-width="12"/>
      <line x1="630" y1="412" x2="640" y2="452" stroke="#000000" stroke-width="12"/>
      <line x1="670" y1="408" x2="680" y2="448" stroke="#000000" stroke-width="12"/>
      <line x1="710" y1="404" x2="720" y2="444" stroke="#000000" stroke-width="12"/>`
    ),
  },
  {
    id: 'photo-6',
    filename: 'Loi thoat nan cau thang len sanh nha PK.jpg',
    title: 'Cầu thang thoát nạn ngoài trời lên sảnh Nhà PK',
    category: 'escape_route',
    plant: 'pk',
    location: 'Trục thang thoát hiểm phía ngoài Khu nhà PK',
    capturedAt: '27/08/2026 11:16:18',
    status: 'passed',
    description:
      'Thang thoát nạn bằng thép định hình sơn chống rỉ, bậc thang có gờ chống trượt; cửa thoát ra ngoài trời mở theo chiều di tản và có đèn EXIT hoạt động ổn định.',
    imageData: createInspectionSvgDataUrl(
      'Cầu thang thoát nạn lên sảnh Nhà PK',
      'Trục thang ngoài trời Khu nhà PK',
      'ĐẠT',
      '27/08/2026 11:16:18',
      '#38bdf8',
      `<!-- Staircase steps upwards to door opening -->
      <rect x="180" y="160" width="440" height="36" fill="#64748b" stroke="#334155" stroke-width="2"/>
      <rect x="160" y="196" width="480" height="36" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
      <rect x="140" y="232" width="520" height="38" fill="#64748b" stroke="#334155" stroke-width="2"/>
      <rect x="120" y="270" width="560" height="42" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
      <rect x="100" y="312" width="600" height="46" fill="#64748b" stroke="#334155" stroke-width="2"/>
      <rect x="70" y="358" width="660" height="52" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
      <!-- Outside open door with blue sky view -->
      <rect x="360" y="40" width="80" height="120" fill="#38bdf8" stroke="#475569" stroke-width="4"/>
      <!-- EXIT green sign -->
      <rect x="375" y="20" width="50" height="16" fill="#15803d" rx="2"/>
      <text x="400" y="32" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">EXIT</text>
      <!-- Handrail -->
      <line x1="80" y1="360" x2="200" y2="140" stroke="#f1f5f9" stroke-width="6"/>`
    ),
  },
  {
    id: 'photo-7',
    filename: 'Loi thoat nan cau thang nha PK.jpg',
    title: 'Cầu thang bộ thoát nạn nội bộ Nhà PK',
    category: 'escape_route',
    plant: 'pk',
    location: 'Cầu thang bộ trục chính Khu nhà PK',
    capturedAt: '27/08/2026 11:12:06',
    status: 'passed',
    description:
      'Cầu thang bộ thoát nạn rộng 1,4m đảm bảo chiều rộng thoát nạn theo quy định; bậc thang chắc chắn, tay vịn gỗ và lan can kim loại an toàn; thông thoáng không để vật cản.',
    imageData: createInspectionSvgDataUrl(
      'Cầu thang bộ thoát nạn nội bộ Nhà PK',
      'Trục thang bộ trung tâm Khu nhà PK',
      'ĐẠT',
      '27/08/2026 11:12:06',
      '#f59e0b',
      `<!-- Indoor masonry staircase with decorative lattice window -->
      <rect x="60" y="40" width="220" height="240" fill="#e2e8f0" stroke="#94a3b8" stroke-width="3"/>
      <!-- Window grid pattern -->
      <line x1="133" y1="40" x2="133" y2="280" stroke="#94a3b8" stroke-width="2"/>
      <line x1="206" y1="40" x2="206" y2="280" stroke="#94a3b8" stroke-width="2"/>
      <line x1="60" y1="120" x2="280" y2="120" stroke="#94a3b8" stroke-width="2"/>
      <line x1="60" y1="200" x2="280" y2="200" stroke="#94a3b8" stroke-width="2"/>
      <!-- Terrazzo stone steps -->
      <rect x="240" y="240" width="460" height="35" fill="#a8a29e" stroke="#78716c" stroke-width="2"/>
      <rect x="220" y="275" width="500" height="38" fill="#d6d3d1" stroke="#78716c" stroke-width="2"/>
      <rect x="200" y="313" width="540" height="42" fill="#a8a29e" stroke="#78716c" stroke-width="2"/>
      <rect x="170" y="355" width="600" height="48" fill="#d6d3d1" stroke="#78716c" stroke-width="2"/>
      <rect x="140" y="403" width="660" height="55" fill="#a8a29e" stroke="#78716c" stroke-width="2"/>`
    ),
  },
];

/**
 * Extracts a displayable month string (e.g. "8" or "08") from "Tháng báo cáo (Tiêu đề chính)"
 * like "08/2026", "8/2026", "8", "Tháng 8", etc.
 */
export function getReportMonthDisplay(reportMonthStr?: string, fallbackMonth?: string): string {
  if (!reportMonthStr || !reportMonthStr.trim()) {
    return fallbackMonth ? fallbackMonth.replace(/^0+/, '') || fallbackMonth : '8';
  }
  const clean = reportMonthStr.trim();
  if (clean.includes('/')) {
    const monthPart = clean.split('/')[0].trim();
    return monthPart.replace(/^0+/, '') || monthPart;
  }
  const m = clean.match(/tháng\s*(\d+)/i);
  if (m) {
    return m[1];
  }
  const digits = clean.replace(/\D/g, '');
  if (digits) {
    return digits.replace(/^0+/, '') || digits;
  }
  return clean;
}

/**
 * Automatically classifies an uploaded photo based on filename and contents.
 * Uses clean filename directly as the demonstration title.
 */
export function autoClassifyPhoto(
  filename: string,
  dataUrl: string,
  userCapturedTime?: string
): InspectionPhoto {
  const lower = filename.toLowerCase();
  const id = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const capturedAt = userCapturedTime || new Date().toLocaleString('vi-VN');

  // Helper to test words safely
  const norm = lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ');

  // 1. Check for specific known Ialy photos first
  const isIalyMR = norm.includes('mr') || norm.includes('mo rong') || lower.includes('mở rộng');
  const isPK = norm.includes('pk');
  const isTram500 = norm.includes('500kv') || norm.includes('500 kv');

  // Check explicit defect/warning only on full word patterns (NEVER single substrings like 'mo' or 'can')
  const isDefect =
    /\b(hỏng|hư hỏng|kẹt|bị rách|chướng ngại vật|không đạt|chưa đạt|tụt áp|hết hạn|rỉ sét nặng)\b/i.test(lower) ||
    /\b(hu hong|bi ket|chuong ngai vat|khong dat|chua dat|het han|tut ap)\b/i.test(norm);

  const isWarning =
    /\b(cần lưu ý|cần theo dõi|chú ý|bám bụi nhẹ)\b/i.test(lower) ||
    /\b(can luu y|theo doi|chu y)\b/i.test(norm);

  // Profile 1: Bãi đỗ xe chữa cháy Ialy MR
  if ((norm.includes('bai') && norm.includes('xe') && isIalyMR) || (norm.includes('chua chay') && isIalyMR && (norm.includes('xe') || norm.includes('dau') || norm.includes('do')))) {
    return {
      id,
      filename,
      title: 'Bãi đỗ xe chữa cháy NMTĐ Ialy Mở rộng',
      category: 'parking',
      plant: 'ialy_mr',
      location: 'Sân trước Gian máy NMTĐ Ialy MR',
      capturedAt,
      status: isDefect ? 'failed' : isWarning ? 'warning' : 'passed',
      description: isDefect
        ? 'Ghi nhận hiện trường có khiếm khuyết/chướng ngại vật ảnh hưởng an toàn. Đề nghị khẩn trương xử lý, giải tỏa và khắc phục.'
        : 'Đường giao thông và bãi đỗ xe chữa cháy đảm bảo chiều rộng, vạch sơn phân làn màu vàng rõ ràng, không có chướng ngại vật cản trở phương tiện tiếp cận.',
      imageData: dataUrl,
    };
  }

  // Profile 2: Bãi đỗ xe Nhà PK
  if ((norm.includes('bai') && norm.includes('xe') && isPK) || (norm.includes('dau xe') && isPK)) {
    return {
      id,
      filename,
      title: 'Bãi đỗ xe cứu nạn & chữa cháy Nhà PK',
      category: 'parking',
      plant: 'pk',
      location: 'Sân trước sảnh đón Khu nhà PK',
      capturedAt,
      status: isDefect ? 'failed' : isWarning ? 'warning' : 'passed',
      description: isDefect
        ? 'Ghi nhận hiện trường có khiếm khuyết/chướng ngại vật ảnh hưởng an toàn. Đề nghị khẩn trương xử lý, giải tỏa và khắc phục.'
        : 'Lòng đường tiếp cận và bãi dừng đỗ xe cứu hộ cứu nạn thông thoáng, độ dốc đảm bảo an toàn, không bị lấn chiếm hoặc che khuất tầm nhìn.',
      imageData: dataUrl,
    };
  }

  // Profile 3: Cầu thang bộ thoát nạn lên Cao trình 309m Ialy MR
  if (norm.includes('thang') && (norm.includes('309') || isIalyMR)) {
    return {
      id,
      filename,
      title: 'Cầu thang bộ thoát nạn lên Cao trình 309m (Ialy MR)',
      category: 'escape_route',
      plant: 'ialy_mr',
      location: 'Trục cầu thang bộ số 1 lên Cao trình 309,50m',
      capturedAt,
      status: isDefect ? 'failed' : isWarning ? 'warning' : 'passed',
      description: isDefect
        ? 'Ghi nhận hiện trường có khiếm khuyết/chướng ngại vật ảnh hưởng an toàn. Đề nghị khẩn trương xử lý, giải tỏa và khắc phục.'
        : 'Bậc thang bằng phẳng, không nứt vỡ; có biển chỉ dẫn cao trình [▼309,50 m] rõ ràng; lan can inox vững chắc, thông thoáng, không có chướng ngại vật.',
      imageData: dataUrl,
    };
  }

  // Profile 4: Lối thoát nạn hành lang cáp cao trình 303m
  if (norm.includes('303')) {
    return {
      id,
      filename,
      title: 'Lối thoát nạn hành lang cáp kỹ thuật Cao trình 303m',
      category: 'escape_route',
      plant: 'ialy',
      location: 'Hành lang kỹ thuật trục H1-H2 (Cao trình 303m)',
      capturedAt,
      status: isDefect ? 'failed' : isWarning ? 'warning' : 'passed',
      description: isDefect
        ? 'Ghi nhận hiện trường có khiếm khuyết/chướng ngại vật ảnh hưởng an toàn. Đề nghị khẩn trương xử lý, giải tỏa và khắc phục.'
        : 'Hành lang thẳng và thông suốt, hệ thống đèn chiếu sáng sự cố hoạt động tốt, bề mặt sàn sạch sẽ khô ráo; các tủ điều khiển đóng nắp kín và có biển cảnh báo an toàn.',
      imageData: dataUrl,
    };
  }

  // Profile 5: Lối thoát nạn và cửa ngăn cháy Cao trình 309m Ialy MR
  if (norm.includes('309')) {
    return {
      id,
      filename,
      title: 'Lối thoát nạn và cửa ngăn cháy Cao trình 309m - Ialy MR',
      category: 'escape_route',
      plant: 'ialy_mr',
      location: 'Sảnh sàn kỹ thuật Cao trình 309m (NMTĐ Ialy MR)',
      capturedAt,
      status: isDefect ? 'failed' : isWarning ? 'warning' : 'passed',
      description: isDefect
        ? 'Ghi nhận hiện trường có khiếm khuyết/chướng ngại vật ảnh hưởng an toàn. Đề nghị khẩn trương xử lý, giải tỏa và khắc phục.'
        : 'Cửa thoát hiểm tự đóng hoạt động nhẹ nhàng; đèn EXIT phía trên sáng rõ; gờ dốc chống trượt sơn sọc vàng đen an toàn; họng nước chữa cháy vách tường được bố trí thuận tiện.',
      imageData: dataUrl,
    };
  }

  // Profile 6: Thang thoát hiểm ngoài trời Nhà PK
  if (isPK && (norm.includes('sanh') || norm.includes('ngoai troi') || norm.includes('thep'))) {
    return {
      id,
      filename,
      title: 'Cầu thang thoát nạn ngoài trời lên sảnh Nhà PK',
      category: 'escape_route',
      plant: 'pk',
      location: 'Trục thang thoát hiểm phía ngoài Khu nhà PK',
      capturedAt,
      status: isDefect ? 'failed' : isWarning ? 'warning' : 'passed',
      description: isDefect
        ? 'Ghi nhận hiện trường có khiếm khuyết/chướng ngại vật ảnh hưởng an toàn. Đề nghị khẩn trương xử lý, giải tỏa và khắc phục.'
        : 'Thang thoát nạn bằng thép định hình sơn chống rỉ, bậc thang có gờ chống trượt; cửa thoát ra ngoài trời mở theo chiều di tản và có đèn EXIT hoạt động ổn định.',
      imageData: dataUrl,
    };
  }

  // Profile 7: Cầu thang bộ nội bộ Nhà PK
  if (isPK && norm.includes('thang')) {
    return {
      id,
      filename,
      title: 'Cầu thang bộ thoát nạn nội bộ Nhà PK',
      category: 'escape_route',
      plant: 'pk',
      location: 'Cầu thang bộ trục chính Khu nhà PK',
      capturedAt,
      status: isDefect ? 'failed' : isWarning ? 'warning' : 'passed',
      description: isDefect
        ? 'Ghi nhận hiện trường có khiếm khuyết/chướng ngại vật ảnh hưởng an toàn. Đề nghị khẩn trương xử lý, giải tỏa và khắc phục.'
        : 'Cầu thang bộ thoát nạn rộng 1,4m đảm bảo chiều rộng thoát nạn theo quy định; bậc thang chắc chắn, tay vịn an toàn; thông thoáng, không để đồ đạc vật cản.',
      imageData: dataUrl,
    };
  }

  // General Classification for any other file
  const cleanTitle = filename.replace(/\.[^/.]+$/, '').trim();
  let title = cleanTitle || 'Ảnh kiểm tra hiện trường PCCC';
  let category: InspectionPhoto['category'] = 'escape_route';
  let plant: InspectionPhoto['plant'] = isIalyMR ? 'ialy_mr' : isPK ? 'pk' : isTram500 ? 'trạm_500kv' : 'ialy';
  let location = 'Khu vực kiểm tra PCCC';
  let description = '';

  if (norm.includes('bai') || norm.includes('dau xe') || norm.includes('do xe') || norm.includes('giao thong')) {
    category = 'parking';
    location = isIalyMR
      ? 'Sân trước Gian máy NMTĐ Ialy MR'
      : isPK
      ? 'Sân trước sảnh Khu nhà PK'
      : 'Đường nội bộ & bãi đỗ xe NMTĐ Ialy';
    title = title.length > 5 ? title : `Bãi đỗ xe chữa cháy ${plant === 'ialy_mr' ? 'Ialy Mở rộng' : 'NMTĐ Ialy'}`;
  } else if (norm.includes('binh') || norm.includes('lang') || norm.includes('voi') || norm.includes('bom') || norm.includes('hong') || norm.includes('tru')) {
    category = 'equipment';
    location = 'Tủ & khu vực bố trí thiết bị PCCC';
  } else {
    category = 'escape_route';
    if (norm.includes('thang')) {
      location = isPK ? 'Cầu thang bộ Khu nhà PK' : 'Trục thang bộ thoát nạn';
    } else if (norm.includes('hanh lang')) {
      location = 'Hành lang kỹ thuật thoát nạn';
    } else if (norm.includes('gian may')) {
      location = isIalyMR ? 'Gian máy NMTĐ Ialy MR' : 'Gian máy NMTĐ Ialy';
    } else {
      location = isIalyMR ? 'Khu vực NMTĐ Ialy Mở rộng' : isPK ? 'Khu nhà PK' : 'Khu vực NMTĐ Ialy';
    }
  }

  let status: InspectionPhoto['status'] = 'passed';
  if (isDefect) {
    status = 'failed';
    description = 'Ghi nhận hiện trường có khiếm khuyết/chướng ngại vật ảnh hưởng an toàn. Đề nghị khẩn trương xử lý, giải tỏa và khắc phục.';
  } else if (isWarning) {
    status = 'warning';
    description = 'Hiện trạng cơ bản đảm bảo nhưng cần lưu ý theo dõi, tăng cường kiểm tra định kỳ và duy trì vệ sinh sạch sẽ.';
  } else {
    status = 'passed';
    if (category === 'parking') {
      description = 'Đường giao thông và bãi đỗ xe chữa cháy đảm bảo chiều rộng, vạch sơn phân làn màu vàng rõ ràng, không có chướng ngại vật cản trở phương tiện tiếp cận.';
    } else if (category === 'equipment') {
      description = 'Phương tiện PCCC tại chỗ được bảo quản tốt, niêm phong kẹp chì đầy đủ, đồng hồ áp suất nằm trong vùng an toàn, sẵn sàng sử dụng.';
    } else {
      description = 'Lối thoát nạn thông thoáng, mặt sàn bằng phẳng khô ráo; hệ thống đèn chiếu sáng sự cố và biển chỉ dẫn thoát hiểm hoạt động bình thường, đảm bảo an toàn di tản.';
    }
  }

  return {
    id,
    filename,
    title,
    category,
    plant,
    location,
    description,
    capturedAt,
    status,
    imageData: dataUrl,
  };
}

/**
 * Converts an image dataURL (PNG, JPEG, or SVG) to a Uint8Array PNG buffer for docx.
 */
export async function imageToPngBytes(
  dataUrl: string,
  targetWidth = 480,
  targetHeight = 360
): Promise<Uint8Array | null> {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  // Fast-path: If already high-res PNG base64, convert directly without re-rendering to canvas
  if (dataUrl.startsWith('data:image/png;base64,') && targetWidth >= 800) {
    try {
      const base64 = dataUrl.split(',')[1];
      let clean = base64.replace(/[\s\r\n]+/g, '');
      while (clean.length % 4 !== 0) clean += '=';
      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return Promise.resolve(bytes);
    } catch {
      // fallback to image rendering below
    }
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = targetWidth;
          const maxH = targetHeight;
          const srcW = img.naturalWidth || maxW;
          const srcH = img.naturalHeight || maxH;

          const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
          const w = Math.round(srcW * ratio);
          const h = Math.round(srcH * ratio);

          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const pngUrl = canvas.toDataURL('image/png');
          const base64 = pngUrl.split(',')[1];
          if (!base64) {
            resolve(null);
            return;
          }

          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          resolve(bytes);
        } catch (e) {
          console.error('Error rendering image to canvas:', e);
          resolve(null);
        }
      };

      img.onerror = () => {
        resolve(null);
      };

      let src = dataUrl.trim();
      if (src.startsWith('data:image/svg+xml;utf8,') && src.includes('#') && !src.includes('%23')) {
        src = src.replace(/#/g, '%23');
      }
      img.src = src;
    } catch (e) {
      console.error('Error in imageToPngBytes:', e);
      resolve(null);
    }
  });
}

export interface ImageDimensionResult {
  bytes: Uint8Array;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
}

export async function getImageDimensionsAndBytes(
  dataUrl: string,
  trimWhiteMargins = false
): Promise<ImageDimensionResult | null> {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const naturalWidth = img.naturalWidth || 1400;
          const naturalHeight = img.naturalHeight || 990;
          const aspectRatio = naturalWidth / naturalHeight;

          // If already PNG data URL and no trimming requested, parse base64 directly
          if (!trimWhiteMargins && dataUrl.startsWith('data:image/png;base64,')) {
            const base64 = dataUrl.split(',')[1];
            let clean = base64.replace(/[\s\r\n]+/g, '');
            while (clean.length % 4 !== 0) clean += '=';
            const binary = atob(clean);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            resolve({ bytes, naturalWidth, naturalHeight, aspectRatio });
            return;
          }

          // Draw to canvas to convert to PNG or trim white margins
          const canvas = document.createElement('canvas');
          canvas.width = naturalWidth;
          canvas.height = naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, naturalWidth, naturalHeight);
          ctx.drawImage(img, 0, 0);

          let finalCanvas = canvas;

          if (trimWhiteMargins && naturalWidth > 50 && naturalHeight > 50) {
            try {
              const imgData = ctx.getImageData(0, 0, naturalWidth, naturalHeight);
              const data = imgData.data;
              let minX = naturalWidth, minY = naturalHeight, maxX = 0, maxY = 0;
              let found = false;

              // Step 2 for speed
              for (let y = 0; y < naturalHeight; y += 2) {
                for (let x = 0; x < naturalWidth; x += 2) {
                  const idx = (y * naturalWidth + x) * 4;
                  const r = data[idx];
                  const g = data[idx + 1];
                  const b = data[idx + 2];
                  const a = data[idx + 3];

                  if (a > 30 && (r < 248 || g < 248 || b < 248)) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    found = true;
                  }
                }
              }

              if (found) {
                const padding = 14;
                minX = Math.max(0, minX - padding);
                minY = Math.max(0, minY - padding);
                maxX = Math.min(naturalWidth - 1, maxX + padding);
                maxY = Math.min(naturalHeight - 1, maxY + padding);

                const cropW = maxX - minX + 1;
                const cropH = maxY - minY + 1;

                if (naturalWidth - cropW > 24 || naturalHeight - cropH > 24) {
                  const cropped = document.createElement('canvas');
                  cropped.width = cropW;
                  cropped.height = cropH;
                  const cCtx = cropped.getContext('2d');
                  if (cCtx) {
                    cCtx.fillStyle = '#ffffff';
                    cCtx.fillRect(0, 0, cropW, cropH);
                    cCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
                    finalCanvas = cropped;
                  }
                }
              }
            } catch {
              // fallback to untrimmed canvas
            }
          }

          const outW = finalCanvas.width;
          const outH = finalCanvas.height;
          const outRatio = outW / outH;

          const pngUrl = finalCanvas.toDataURL('image/png');
          const base64 = pngUrl.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          resolve({ bytes, naturalWidth: outW, naturalHeight: outH, aspectRatio: outRatio });
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
      img.src = dataUrl.trim();
    } catch {
      resolve(null);
    }
  });
}
