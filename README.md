# Ứng Dụng Quản Lý & Xuất Biên Bản Kiểm Tra PCCC & CNCH - Thủy Điện Ialy

Ứng dụng web chuyên dụng cho công tác lập, kiểm tra, theo dõi và tự động xuất biên bản định kỳ công tác Phòng cháy chữa cháy và Cứu nạn cứu hộ (PCCC & CNCH) tại **Công ty Thủy điện Ialy** (Bao gồm **Nhà máy Thủy điện Ialy** hiện hữu và **Nhà máy Thủy điện Ialy Mở rộng**).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com)

---

## 🌟 Tính Năng Nổi Bật
- **Soạn thảo & Quản lý Biên bản theo tháng**: Đầy đủ các trường biểu mẫu chuẩn hành chính nhà nước EVN / Công ty Thủy điện Ialy.
- **Bảng thiết bị PCCC chia rõ 2 khu vực**:
  - **Mục I**: Nhà máy Thủy điện Ialy (Hiện hữu - Gian máy, Trạm 500kV, Đập dâng...).
  - **Mục II**: Nhà máy Thủy điện Ialy Mở rộng (Cao trình 348m, 339m, 309m, 288m...).
- **Quét thông minh từ File kiểm tra (Bảng II Excel, Word, OCR)**:
  - Tự động nhận diện thiết bị hư hỏng (bị vỡ, tụt áp, rò rỉ van...).
  - Tự động điền cột Không đạt, trừ cột Đạt, điền Ghi chú và sinh Kiến nghị theo từng nhà máy.
- **Xuất văn bản Word (.docx) chuẩn thể thức**: Đầy đủ Quốc hiệu, Tiêu ngữ, Bảng kẻ 2 khu vực, căn lề A4 chuẩn, chữ ký các bên.
- **Xem trước & In ấn trực tiếp (Print A4)**: Trực quan, sắc nét.

---

## 🚀 Hướng Dẫn Triển Khai Lên GitHub & Vercel Tự Động

### Cách 1: Xuất trực tiếp từ Google AI Studio (Nhanh nhất)
1. Trong giao diện Google AI Studio, nhấp vào menu **Settings / Export** ở góc trên bên phải.
2. Chọn **"Export to GitHub"**.
3. Kết nối với tài khoản GitHub của bạn để tạo repository.
4. Truy cập **[Vercel](https://vercel.com)**, đăng nhập bằng GitHub.
5. Chọn **"Add New..."** -> **"Project"**, chọn repository vừa tạo và nhấn **"Deploy"**.
6. Vercel đã tích hợp sẵn file cấu hình `vercel.json`, ứng dụng sẽ tự động build và chạy trực tiếp!

### Cách 2: Đẩy mã nguồn thủ công qua Git CLI
```bash
# 1. Khởi tạo kho lưu trữ git
git init
git add .
git commit -m "feat: Bien ban PCCC Ialy & Ialy MR"

# 2. Đặt nhánh chính là main
git branch -M main

# 3. Thêm remote repository GitHub của bạn
git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git

# 4. Đẩy code lên GitHub
git push -u origin main
```
Sau đó vào **[Vercel Dashboard](https://vercel.com/new)** -> Import kho lưu trữ trên và nhấn **Deploy**.

---

## 🛠️ Chạy Ứng Dụng Ở Máy Cục Bộ (Local)

Yêu cầu: Node.js 18+

```bash
# Cài đặt thư viện
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```

Truy cập: `http://localhost:3000`

```bash
# Build đóng gói sản phẩm
npm run build
```

---

## 📄 Cấu hình Vercel (`vercel.json`)
File `vercel.json` đã được cài đặt sẵn tại thư mục gốc với chế độ SPA Rewrite:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Mỗi khi bạn commit / push lên GitHub, Vercel sẽ tự động kích hoạt CI/CD build và cập nhật phiên bản mới nhất hoàn toàn tự động.
