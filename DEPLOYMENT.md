# Deploy TaskTrack AS2 lên Vercel

Dành cho frontend AS2 kế thừa public UI AS1. Backend phải có URL Render HTTPS và database/auth hoạt động trước khi kiểm tra live. Cấu hình đối chiếu ngày 13/10/2026.

Bản production: [TaskTrack AS2](https://qe190064-prn232-ass2-fe.vercel.app), API `https://qe190064-prn232-ass2-be.onrender.com/api`. Đã kiểm tra Register Staff, Admin/Staff, CRUD, quyền, session/logout và responsive trên hệ thống live. Bản hiện tại được deploy qua API từ đúng source đã commit vì tài khoản Vercel chưa có GitHub Login Connection; push Git mới chưa tự deploy frontend. Khi cập nhật, deploy lại source hoặc hoàn tất Git connection trước khi dựa vào auto-deploy.

## Bản bổ sung đang chờ deploy

Source đã khôi phục chín trang public AS1 và thêm `/profile`, tự refresh access token, logout thu hồi phiên. Đã đạt 17/17 Playwright và 4/4 unit; build/lint/typecheck đạt. Kết nối Vercel hiện không thấy team có quyền, nên chưa đưa bản bổ sung lên live và chưa xác nhận Git auto-deploy. Kết nối lại đúng tài khoản/workspace vibe-cast trước khi cập nhật project hiện có; không tạo project thay thế chỉ để tránh lỗi quyền.

## Cấu hình project

1. Commit/push những thay đổi đã kiểm tra lên repo AS2 `NguyenNgu2k5/QE190064_PRN232_Ass2_FE`. Dịch vụ Git chỉ build source đã push.
2. Trong Vercel, import repo đó hoặc cập nhật Git connection của project hiện có sau khi xác nhận đúng đích AS2.
3. Chọn framework **Next.js**, root directory là repo root, Node.js **24.x**, install **npm ci**, build **npm run build**; giữ output directory mặc định của framework.
4. Đặt **NEXT_PUBLIC_API_URL** cho **Production** thành `https://YOUR_RENDER_SERVICE.onrender.com/api`, thay bằng URL thật. Nếu cần test Preview, cấu hình biến cho Preview riêng.
5. Deploy và ghi lại domain HTTPS ổn định. Backend đặt **CORS_ORIGINS** bằng chính origin đó, không path hoặc dấu `/` cuối.

Vercel hỗ trợ Next.js và Node 24.x. [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

NEXT_PUBLIC_API_URL là giá trị public nằm trong browser bundle. Đổi biến môi trường cần deploy lại; chỉ sửa dashboard không thay bundle đã build. Frontend không nhận DATABASE_URL, JWT_SECRET hoặc password tài khoản. [Environment variables](https://vercel.com/docs/environment-variables).

## Checklist nghiệm thu live

| Ca test | Thao tác | Kết quả cần có |
|---|---|---|
| Public | Mở home, departments, projects, tasks, tags, search và detail có ID thật | Hiển thị dữ liệu từ Render, GET 200 |
| Guest | Mở `/admin` và các trang con trong cửa sổ không có session | Chuyển `/login` |
| Register | Mở `/register`, tạo Staff với email mới | POST 201, thông báo thành công và về Login |
| Register trùng | Gửi lại email đã có | POST 409, UI báo lỗi |
| Login sai | Password không đúng | POST 401, UI báo lỗi |
| Login đúng | Dùng Staff vừa đăng ký | POST 200, vào `/admin`, hiện tên và Logout |
| Dashboard | Đối chiếu bốn summary cards với response GET | Tổng departments/projects/tasks active và tags khớp |
| Staff CRUD | Tạo department → project → tag → task; sửa từng nhóm | POST/PUT 200, public phản ánh dữ liệu mới |
| Tag multi-select | Sửa task giữ/thêm/bớt/bỏ hết tags | Danh sách tags khớp sau refresh |
| Confirm delete | Bấm Delete rồi Keep it, sau đó test Yes, delete trên fixture riêng | Cancel không gửi DELETE; xóa hợp lệ 204 |
| Soft delete task | Xóa task test rồi GET lại đúng ID | Task không còn trong public, API detail 404 |
| Staff accounts | UI `/admin/accounts`; Swagger đủ bốn API Accounts với JWT Staff | UI chặn dữ liệu; API 403 |
| Admin accounts | Login Admin đã seed trực tiếp; list/detail/sửa/xóa account test chưa tạo task | GET/PUT 200, DELETE 204; không lộ password/hash |
| Account có task | Xóa account test đã tạo task, kể cả task đã soft-delete | 409, giữ nguyên account |
| Refresh session | Reload khi đã login | GET auth/me 200, vẫn đăng nhập |
| Token không hợp lệ | Trong session test riêng, dùng token giả hoặc account đã bị đổi role; gọi API có quyền | 401, clear session và chuyển Login |
| Logout | Bấm Logout, rồi vào lại `/admin` | Về home, hiển thị Login/Register, admin chuyển Login |
| Responsive | Dùng mobile viewport, mở auth, các bảng và modal | Không tràn toàn trang; form/dialog/scroll dùng được |

Test bằng dữ liệu có tiền tố riêng; DELETE departments/projects/tags/accounts xóa thật khi được phép. Task xóa mềm vẫn giữ liên kết, nên project/tag/account liên quan có thể bị chặn xóa. Không chạy suite integration local trực tiếp lên live.

Sau khi đủ ca test, ghi URL, thời điểm deploy, commit SHA và kết quả vào báo cáo bàn giao. Chỉ điền credentials Admin/Staff đã login live thành công vào `QE190064_SE19B_Ass2.docx`; giữ DOCX riêng để nộp, không đưa password vào repo public.

## Lỗi thường gặp

- **CORS:** kiểm tra Request Origin trong Network, thêm đúng origin vào backend và redeploy backend.
- **API vẫn localhost:** sửa NEXT_PUBLIC_API_URL cho đúng environment, deploy lại frontend.
- **401:** dùng token mới sau login; role thay đổi hoặc account bị xóa làm token cũ mất hiệu lực.
- **API khởi động nhưng GET lỗi:** kiểm tra database/schema và DATABASE_URL; Swagger mở được chưa chứng minh database sẵn sàng.
- **Không cập nhật UI mới:** đối chiếu commit của deployment với source đã push; kiểm tra đúng project và Production deployment.
