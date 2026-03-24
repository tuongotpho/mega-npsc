
# Tài liệu Kiến trúc Hệ thống & Cấu trúc Dữ liệu (Schema)

Hệ thống sử dụng **Google Cloud Firestore** (NoSQL) làm cơ sở dữ liệu chính. 
Lưu ý: Hệ thống sử dụng 2 Project Firebase riêng biệt cho 2 phân hệ để đảm bảo an toàn dữ liệu.

---

## 1. Phân hệ Quản lý Dự án (Project Management)
**Firebase Config:** `services/firebase.ts`

### 1.1. Collection: `users`
Lưu trữ thông tin người dùng và phân quyền.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | UID từ Firebase Auth |
| `email` | String | Email người dùng |
| `name` | String | Tên hiển thị |
| `role` | String | Vai trò: `Admin`, `DepartmentHead`, `ProjectManager`, `LeadSupervisor` |

### 1.2. Collection: `projects`
Lưu trữ thông tin hồ sơ dự án SCL.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Tên dự án |
| `financialYear` | Number | Năm tài chính |
| `isLocked` | Boolean | Trạng thái khóa sổ/quyết toán |
| `projectManagerIds` | Array<String> | Danh sách UID cán bộ quản lý (được quyền sửa/báo cáo) |
| `leadSupervisorIds` | Array<String> | Danh sách UID giám sát trưởng |
| `constructionStartDate` | String (DD/MM/YYYY) | Ngày khởi công |
| `plannedAcceptanceDate` | String (DD/MM/YYYY) | Ngày dự kiến nghiệm thu |
| `capitalPlanApproval` | Map | `{ decisionNumber: string, date: string }` (Giao danh mục) |
| `technicalPlanStage` | Map | `{ submissionDate: string, approvalDate: string }` (Phương án kỹ thuật) |
| `budgetStage` | Map | `{ submissionDate: string, approvalDate: string }` (Dự toán) |
| `designBidding` | Map | `{ itbIssuanceDate: string, contractSignDate: string }` (Gói thầu TVTK) |
| `constructionBidding` | Map | `{ itbIssuanceDate: string, contractSignDate: string }` (Gói thầu Thi công) |
| `supervisionBidding` | Map | `{ itbIssuanceDate: string, contractSignDate: string }` (Gói thầu Giám sát) |
| `finalSettlementStage` | Map | `{ submissionDate: string, approvalDate: string }` (Quyết toán) |
| `designUnit` | Map | Thông tin đơn vị thiết kế |
| `constructionUnit` | Map | Thông tin đơn vị thi công |
| `supervisionUnit` | Map | Thông tin đơn vị giám sát |
| `reviews` | Map | `{ [reportId]: { comment: string, reviewedBy: string ... } }` (Nhận xét báo cáo) |

### 1.3. Collection: `reports`
Nhật ký thi công hàng ngày.

| Field | Type | Description |
| :--- | :--- | :--- |
| `projectId` | String | ID của dự án tham chiếu |
| `date` | String (DD/MM/YYYY) | Ngày báo cáo |
| `tasks` | String | Nội dung công việc thực hiện |
| `progressPercentage` | Number | % Tiến độ lũy kế |
| `personnelCount` | Number | Số lượng nhân lực |
| `equipmentOnSite` | String | Máy móc thiết bị |
| `images` | Array<String> | URLs ảnh hiện trường (Firebase Storage) |
| `submittedBy` | String | Tên người gửi báo cáo |

### 1.4. Collection: `contractors`
Thư viện nhà thầu dùng chung (để gợi ý khi nhập liệu).

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Tên công ty |
| `type` | String | `Design`, `Construction`, `Supervision` |
| `contactPerson` | String | Người liên hệ đại diện |
| `phone` | String | Số điện thoại |

---

## 2. Phân hệ Quản lý Sáng kiến (Innovation Hub)
**Firebase Config:** `services/firebaseSangkien.ts`

### 2.1. Collection: `initiatives`
Kho dữ liệu sáng kiến chính thức.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | String | Tên sáng kiến |
| `authors` | Array<String> | Danh sách tác giả |
| `unit` | Array<String> | Danh sách đơn vị áp dụng |
| `year` | Number | Năm công nhận |
| `level` | Array<String> | Cấp công nhận: `HLH`, `NPSC`, `NPC`, `EVN` |
| `content` | String | Tóm tắt nội dung giải pháp |
| `field` | Array<String> | Lĩnh vực chuyên môn |
| `isScalable` | Boolean | Có khả năng nhân rộng hay không |
| `embedding_field` | Array<Number> | **Quan trọng:** Vector 768 chiều dùng cho tìm kiếm AI (RAG) |
| `imageUrls` | Array<String> | Ảnh minh họa |
| `attachmentUrls` | Array<String> | File đính kèm |
| `approvalDocUrls` | Array<String> | Quyết định công nhận (scan) |

### 2.2. Collection: `pending_initiatives`
Hàng đợi các đơn đăng ký sáng kiến chờ duyệt. Cấu trúc tương tự `initiatives` nhưng có thêm:

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | String | `pending` |
| `publicAnalysis` | Map | Kết quả check trùng lặp sơ bộ của AI khi người dùng nộp |
| `complianceCheck` | Map | Kết quả chấm điểm form mẫu của AI |
| `contactZalo` | String | Số điện thoại liên hệ |

### 2.3. Collection: `research_projects`
Quản lý đề tài nghiên cứu khoa học.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | String | Tên đề tài |
| `mainMembers` | Array<String> | Thành viên chính |
| `budget` | Number | Kinh phí được duyệt |
| `progress` | Number | % Tiến độ |
| `status` | String | `dang_thuc_hien`, `da_nghiem_thu`, `da_huy` |
| `settlementStatus`| String | Trạng thái thanh quyết toán |

### 2.4. Collection: `settings`
Cấu hình hệ thống động.
*   Document `global_config`: Chứa `pointConfig` (Cấu hình điểm số cho các cấp HLH, NPSC...).

---

## 3. Storage Structure

*   `/reports/{projectId}/{filename}`: Ảnh báo cáo nhật ký công trình.
*   `/projects/{projectId}/{path}/{filename}`: Tài liệu quản lý dự án.
*   `/initiatives/images/{filename}`: Ảnh minh họa sáng kiến.
*   `/initiatives/attachments/{filename}`: Tài liệu thuyết minh sáng kiến.
*   `/initiatives/approval_docs/{filename}`: Quyết định công nhận.
*   `/pending_initiatives/...`: File tạm của đơn đăng ký chờ duyệt.

---

## 4. AI Integration (Gemini)

*   **Model:** `gemini-3-flash-preview` (cho Text/Chat/Analysis), `text-embedding-004` (cho Vector Search).
*   **Vector Search (RAG):**
    *   Khi lưu sáng kiến, hệ thống gọi `generateEmbedding` để tạo vector từ `title + content`.
    *   Khi chat/tìm kiếm, hệ thống tạo vector từ câu hỏi và tính `cosineSimilarity` với database để tìm kết quả liên quan nhất.
