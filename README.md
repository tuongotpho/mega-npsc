
# NPSC Digital Portal - Hệ thống Quản lý Tập trung

Đây là ứng dụng web "MegaApp" của NPSC, tích hợp các phân hệ quản lý:
1. **Quản lý Dự án (Project Management):** Theo dõi tiến độ, nhật ký thi công, hồ sơ hoàn công.
2. **Quản lý Sáng kiến (Innovation Hub):** Kho dữ liệu sáng kiến, tìm kiếm AI (RAG), chấm điểm tự động.

## 🚀 Yêu cầu hệ thống

*   **Node.js**: Phiên bản 18.x trở lên.
*   **NPM**: Phiên bản đi kèm Node.js.
*   **Trình duyệt**: Chrome/Edge/Safari/Firefox mới nhất.

## 🛠️ Cài đặt & Chạy Local

1.  **Clone dự án:**
    ```bash
    git clone <repository-url>
    cd qlda-npsc
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```

3.  **Cấu hình môi trường:**
    *   Tạo file `.env` tại thư mục gốc (xem mẫu trong `.env.example`).
    *   Điền API Key của Google Gemini vào `GEMINI_API_KEY`.

4.  **Chạy ứng dụng (Môi trường Dev):**
    ```bash
    npm run dev
    ```
    Truy cập: `http://localhost:5173`

5.  **Build cho Production:**
    ```bash
    npm run build
    npm run preview
    ```

## 📂 Cấu trúc Thư mục

```text
/
├── public/                 # Static assets (icons, manifest)
├── src/
│   ├── components/         # UI Components dùng chung & cho module Dự án
│   │   ├── common/         # Các component nhỏ (Input, Checkbox...)
│   │   ├── dashboard/      # Widget cho Dashboard dự án
│   │   └── ...
│   ├── contexts/           # React Context (Global State)
│   ├── hooks/              # Custom Hooks (Logic tách biệt)
│   ├── innovations/        # SOURCE CODE PHÂN HỆ SÁNG KIẾN (Tách biệt)
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── pages/              # Các trang chính của module Dự án
│   ├── services/           # Firebase config, AI Service, Permissions
│   ├── types.ts            # Định nghĩa TypeScript Interfaces toàn bộ app
│   ├── App.tsx             # Main Entry & Routing logic
│   └── main.tsx            # React Root
├── firestore.rules         # Quy tắc bảo mật Database
├── storage.rules           # Quy tắc bảo mật File Storage
└── ...
```

## 🔐 Tài khoản Demo (Nếu có)

Liên hệ quản trị viên để được cấp quyền truy cập vào dữ liệu thực tế trên Firebase.

---
© 2025 NPSC
