# Erebus - AI-Powered Project Management

Erebus là một ứng dụng quản lý dự án dạng Kanban Board, tập trung vào trải nghiệm người dùng tối giản (lấy cảm hứng từ Linear) và khả năng tự động hóa luồng công việc nhờ tích hợp AI. 

Dự án này được xây dựng nhằm mục đích nghiên cứu cách kết hợp Real-time Collaboration và LLMs vào một hệ thống quản lý công việc thực tế.

## Tính năng chính 

### AI Integration
- **Auto Subtasks Generation:** Tự động phân tích Title và Description của issue để sinh ra danh sách subtasks (ép kiểu đầu ra chuẩn JSON thông qua strict prompting).
- **Smart Content Editor:** Tích hợp AI vào trình soạn thảo để hỗ trợ sửa lỗi ngữ pháp, thay đổi văn phong hoặc mở rộng (expand) mô tả ngắn thành một ticket hoàn chỉnh.

### Real-time Kanban & Workspace
- **Live Updates:** Mọi thay đổi về vị trí task, nội dung, hay trạng thái đều được đồng bộ realtime tới các client khác qua WebSockets.
- **Optimistic UI:** Thao tác kéo thả (Drag & Drop) mượt mà, UI phản hồi ngay lập tức trước khi server xác nhận nhờ cơ chế caching và mutation của React Query.
- **Activity Feed:** Ghi nhận và theo dõi lịch sử thao tác của các thành viên trên từng issue.

### Modern UI/UX
- **Dark-mode First:** Giao diện tối giản, độ tương phản cao.
- **Smart Pickers:** Các component (Label, Priority, Status, Assignee) được build custom hoàn toàn bằng React Portal để tránh lỗi context/z-index, hỗ trợ tìm kiếm và tạo mới (create-on-the-fly) label trực tiếp từ dropdown với auto-color generation.

---

## Tech Stack

**Frontend:**
- **Core:** React 18, TypeScript, Vite
- **State Management & Data Fetching:** TanStack Query (React Query) v5
- **Styling:** Tailwind CSS, Lucide Icons
- **Utilities:** `@dnd-kit` (Drag & Drop), `date-fns`

**Backend & Infrastructure:**
- **BaaS:** Supabase (PostgreSQL, Row Level Security, Realtime Subscriptions)
- **Serverless:** Supabase Edge Functions (Deno) - Dùng để proxy các request gọi AI, bảo mật API Key tuyệt đối khỏi client.

**AI Model:**
- **Google Gemini 2.5 Flash:** Handle các tác vụ xử lý ngôn ngữ tự nhiên, phân tách dữ liệu.

---

## Hướng dẫn chạy dự án 

**Yêu cầu hệ thống:**
- Node.js >= 18.x
- Tài khoản Supabase (để tạo project và lấy credentials)
- Gemini API Key

**1. Clone dự án & Cài đặt dependencies**
```bash
git clone [https://github.com/](https://github.com/)[username-cua-ban]/Erebus.git
cd Erebus
npm install
```

**2. Thiết lập biến môi trường**
Tạo file .env ở thư mục gốc và cung cấp các thông tin sau :
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
(Lưu ý: API Key của Gemini sẽ được cấu hình riêng trên môi trường của Supabase Edge Functions, không lưu ở client).

**3. Khởi động môi trường dev**
```bash
npm run dev
```
Truy cập ứng dụng tại: http://localhost:5173

## Technical Notes & Challenges 
- **Drag & Drop Reordering:** Việc tính toán lại vị trí (position) của task khi kéo thả trong Kanban board đòi hỏi thuật toán sắp xếp linh hoạt để giảm thiểu số lần ghi vào database.
- **AI Prompt Engineering:** Để đảm bảo AI luôn trả về một mảng JSON array hợp lệ cho tính năng Auto Subtasks (tránh việc AI sinh ra các thẻ markdown rác như json ), prompt đã được tinh chỉnh nghiêm ngặt và xử lý data cleaning ở tầng Edge Function.
- **React Portal cho Dropdowns:** Việc quản lý các Popup/Dropdown lồng sâu trong các thẻ div có overflow-y-auto (như sidebar) gây ra hiện tượng cắt layout. Giải pháp là viết lại component <Popover /> sử dụng createPortal để render thẳng ra ngoài cấp cao nhất của thẻ <body>, tự động tính toán tọa độ bằng getBoundingClientRect().