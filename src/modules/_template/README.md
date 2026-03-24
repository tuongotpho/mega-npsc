# Module Template

Đây là template chuẩn để tạo module mới trong NPSC MegaApp.

## Cách sử dụng

1. **Copy thư mục** `_template/` → `tên-module-mới/`
2. **Đổi tên component** `TemplateModule` → tên module thực tế
3. **Thêm vào App shell** (`src/App.tsx`):
   - Thêm giá trị mới vào `ActiveModule` type
   - Thêm route/rendering trong JSX
4. **Thêm card** vào `ModuleSelector.tsx` (bỏ `isComingSoon`)
5. **Tạo Firebase config** riêng nếu dùng database riêng
6. **Định nghĩa types** riêng trong `types.ts`

## Cấu trúc thư mục

```
ten-module/
├── index.tsx          ← Entry point, export component chính
├── types.ts           ← Type definitions riêng
├── services/          ← Firebase config, API calls
├── hooks/             ← Custom React hooks
├── components/        ← UI components
├── pages/             ← Page-level components (nếu module có nhiều trang)
└── README.md          ← Tài liệu module
```

## Quy tắc

- Import shared components từ `../../shared/components/`
- Import shared types từ `../../shared/types/common.ts`
- Mỗi module PHẢI tự chứa (self-contained): không import trực tiếp từ module khác
- Export duy nhất component chính qua `index.tsx`
