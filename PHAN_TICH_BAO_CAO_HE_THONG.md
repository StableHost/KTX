# PHÂN TÍCH HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ

## I. TỔNG QUAN DỰ ÁN

### 1.1 Tên dự án
**Hệ thống Quản lý Ký túc xá học sinh**

### 1.2 Mục đích
Xây dựng một nền tảng quản lý toàn diện cho hoạt động quản lý ký túc xá, giúp:
- Quản lý thông tin học sinh, phòng ở, ký túc xá
- Đánh giá chất lượng phòng theo tiêu chí chấm điểm hàng ngày
- Xử lý các yêu cầu đặc biệt của học sinh (đổi phòng, trả phòng, gia hạn, sửa chữa)
- Theo dõi yêu cầu đón/trả học sinh trong trường hợp đột xuất
- Quản lý quyền hạn theo vai trò (role-based access control)

### 1.3 Công nghệ sử dụng
- **Backend**: Node.js + Express.js + MongoDB
- **Frontend**: React.js + React Router + TailwindCSS + Ant Design
- **Authentication**: JWT (JSON Web Token) + bcryptjs
- **AI**: Google Generative AI (Gemini API) - hỗ trợ phân tích ghi chú chấm điểm
- **Báo cáo**: ExcelJS - xuất báo cáo Excel
- **Email**: Nodemailer - gửi thông báo email
- **Database**: MongoDB Atlas

---

## II. HỆ THỐNG VAI TRÒ (ROLE-BASED ACCESS CONTROL)

### 2.1 Các vai trò (Role) được hỗ trợ

| Vai trò | Mã | Quyền chính |
|---------|-----|-----------|
| **Admin** | `admin` | Quản lý toàn hệ thống, cấp quyền, duyệt tất cả yêu cầu |
| **GVPT** | `gvpt` | Quản lý phòng & sinh viên, duyệt yêu cầu của phòng phụ trách |
| **CODO** | `codo` | Chấm điểm phòng hàng ngày, cập nhật vi phạm |
| **Sinh viên** | `student` | Xem thông tin cá nhân, tạo yêu cầu, xem lịch sử |

### 2.2 Cấu trúc lưu trữ vai trò

**Model: Account**
```
{
  _id: ObjectId,
  CMND: String (unique),
  MatKhau: String (hash bcrypt),
  RoleId: ObjectId (ref: Role),
  timestamps: true
}
```

**Model: Role**
```
{
  _id: ObjectId,
  role: String (enum: ["admin", "gvpt", "codo", "student"]),
  timestamps: true
}
```

---

## III. CÁC CHỨC NĂNG CHÍNH

### 3.1 Quản lý Tài khoản & Xác thực

#### A. Đăng nhập
- **Endpoint**: `POST /api/auth/login`
- **Input**: CMND, Mật khẩu
- **Output**: JWT Token (lưu trong cookie)
- **Quy trình**: 
  1. Xác thực CMND + Mật khẩu trong Account
  2. Kiểm tra Role liên kết
  3. Cấp JWT Token
  4. Chuyển hướng theo role (Admin Dashboard / Student Page / v.v)

#### B. Đăng ký tài khoản (Admin)
- **Endpoint**: `POST /api/auth/register`
- **Quyền**: Admin only
- **Input**: CMND, Mật khẩu (mặc định Password@123), RoleId
- **Output**: Tài khoản mới được tạo

#### C. Quản lý tài khoản
- **Xóa tài khoản**: `DELETE /api/auth/account/:id` (Admin)
- **Cập nhật mật khẩu**: `PUT /api/auth/account/:accountId`

#### D. Kiểm tra quyền
- `GET /api/auth/checkauth` - Kiểm tra đã đăng nhập
- `GET /api/auth/checkuser/:id` - Kiểm tra quyền User
- `GET /api/auth/checkadmin` - Kiểm tra quyền Admin

---

### 3.2 Quản lý Học sinh

#### A. Thông tin học sinh
**Model: User**
```
{
  HoTen: String,
  Mssv: String (Mã số sinh viên),
  CMND: String,
  Matk: ObjectId (ref: Account),
  GioiTinh: String,
  Truong: String,
  NganHang: String,
  Phone: String,
  Email: String (unique),
  Address: String,
  DateOfBirth: Date,
  NienKhoa: String (Niên khoá),
  Photos: [String],
  room: {
    roomId: ObjectId,
    roomTitle: String,
    dateIn: Date,
    dateOut: Date,
    status: Number (0-Đang ở, 1-Đã xuất)
  },
  timestamps: true
}
```

#### B. API Quản lý học sinh
- `POST /api/user` - Tạo sinh viên mới
- `GET /api/user` - Danh sách tất cả sinh viên
- `GET /api/user/:id` - Chi tiết sinh viên (theo Matk = Account ID)
- `PUT /api/user/:id` - Cập nhật thông tin sinh viên
- `DELETE /api/user/:id` - Xóa sinh viên (Admin)

#### C. Phân quyền xem thông tin
- **Admin**: Xem tất cả sinh viên
- **GVPT**: Chỉ xem sinh viên trong phòng phụ trách
- **CODO**: Chỉ xem sinh viên trong phòng chấm
- **Sinh viên**: Chỉ xem thông tin cá nhân

---

### 3.3 Quản lý Ký túc xá & Phòng

#### A. Ký túc xá
**Model: Dormitory**
```
{
  Name: String,
  Desc: String,
  Room: [ObjectId] (ref: Room),
  timestamps: true
}
```

**API**:
- `POST /api/dormitorys` - Tạo ký túc xá
- `GET /api/dormitorys` - Danh sách ký túc xá
- `GET /api/dormitorys/:id` - Chi tiết ký túc xá
- `GET /api/dormitorys/room/:id` - Danh sách phòng của ký túc xá
- `PUT /api/dormitorys/:id` - Cập nhật (Admin)
- `DELETE /api/dormitorys/:id` - Xóa (Admin)

#### B. Phòng ở
**Model: Room**
```
{
  dormId: ObjectId (ref: Dormitory),
  Title: String (vd: A5, B3),
  status: Number (0-Có chỗ, 1-Đầy),
  Price: Number,
  Slot: Number (sức chứa tối đa),
  availableSlot: Number (chỗ trống),
  roomMembers: [
    {
      userId: ObjectId,
      HoTen: String,
      Mssv: String,
      CMND: String,
      Truong: String,
      Phone: String,
      Email: String,
      dateIn: Date,
      dateOut: Date
    }
  ],
  timestamps: true
}
```

**API Quản lý phòng**:
- `POST /api/rooms` - Tạo phòng mới
- `GET /api/rooms` - Danh sách phòng
- `GET /api/rooms/:id` - Chi tiết phòng
- `PUT /api/rooms/:id` - Cập nhật phòng (Admin)
- `DELETE /api/rooms/:id/:dormitoryId` - Xóa phòng (Admin)
- `PUT /api/rooms/availability/:id` - Cập nhật ngày không khả dụng (Admin)

**API Yêu cầu đổi phòng**:
- `POST /api/rooms/change-room` - Tạo yêu cầu đổi phòng
- `GET /api/rooms/change-room` - Danh sách yêu cầu (Admin)
- `GET /api/rooms/change-room/:userId` - Yêu cầu đổi phòng của user
- `PUT /api/rooms/change-room/:id` - Duyệt/Từ chối (Admin)

**API Yêu cầu trả phòng**:
- `POST /api/rooms/checkout` - Tạo yêu cầu trả phòng
- `GET /api/rooms/checkout` - Danh sách yêu cầu (Admin)
- `GET /api/rooms/checkout/:userId` - Yêu cầu trả phòng của user
- `PUT /api/rooms/checkout/:id` - Duyệt/Từ chối (Admin)

**API Yêu cầu gia hạn**:
- `POST /api/rooms/extend` - Tạo yêu cầu gia hạn
- `GET /api/rooms/extend` - Danh sách yêu cầu (Admin)
- `GET /api/rooms/extend/:userId` - Yêu cầu gia hạn của user
- `PUT /api/rooms/extend/:id` - Duyệt/Từ chối (Admin)

**API Yêu cầu sửa chữa**:
- `POST /api/rooms/fix` - Tạo yêu cầu sửa phòng
- `GET /api/rooms/fix` - Danh sách yêu cầu (Admin)
- `GET /api/rooms/fix/:userId` - Yêu cầu sửa phòng của user
- `PUT /api/rooms/fix/:id` - Duyệt/Từ chối (Admin)

---

### 3.4 Chấm Điểm Phòng (Grading System)

#### A. Tiêu chí chấm điểm
- **Điểm gốc**: 120 điểm/ngày
- **Ngày bắt đầu tuần**: Thứ 6 (Friday)

#### B. Các loại vi phạm & mức trừ

| Loại vi phạm | Mã | Mức trừ |
|------|-----|---------|
| Nền phòng bẩn | `nen_ban` | -10 |
| Đổ rác muộn | `do_rac_muon` | -10 |
| Chăn màn không gọn | `chan_man_cau_tha` | -5 |
| Không đi ăn | `khong_di_an` | -10 |
| Mất trật tự giờ ngủ | `mtt_gio_ngu` | -10 |

#### C. Database Model

**Model: GradingLog**
```
{
  roomId: ObjectId (ref: Room),
  roomTitle: String,
  date: Date,
  dayOfWeek: String (Thứ 2→7, Chủ nhật),
  violations: [
    {
      type: String (loại vi phạm),
      count: Number (số lần, default: 1),
      note: String (ghi chú chi tiết)
    }
  ],
  defaultScore: Number (mặc định 120),
  totalPenalty: Number (tính tự động: sum trừ điểm),
  finalScore: Number (tính tự động: 120 - totalPenalty, min: 0),
  supervisor: String,
  rawNote: String (ghi chú tự do, để AI phân tích),
  status: Number (0-Nháp, 1-Đã duyệt),
  approvedBy: String,
  approvedAt: Date,
  createdBy: String,
  updatedBy: String,
  timestamps: true
}
```

#### D. API Chấm điểm

- **POST /api/grading/analyze**
  - Input: `rawNote` (ghi chú tự do)
  - Output: Danh sách vi phạm & trừ điểm (không lưu)
  - Hỗ trợ: Google Generative AI (Gemini) phân tích ghi chú

- **POST /api/grading/save**
  - Input: roomId, date, violations, supervisor
  - Output: GradingLog được lưu
  - Status: 0 (Nháp) - chưa duyệt

- **POST /api/grading/quick-submit**
  - Input: rawNote
  - Quy trình: Gửi ghi chú → AI phân tích → Lưu tự động
  - Output: GradingLog với status 0 (Nháp)

- **GET /api/grading/history/weekly**
  - Output: Lịch sử chấm điểm tuần (JSON)

- **GET /api/grading/export/weekly**
  - Output: Báo cáo Excel tuần (Friday-Thursday)
  - Bao gồm: Danh sách phòng, điểm, xếp hạng

- **GET /api/grading/export/monthly**
  - Output: Báo cáo Excel tháng

- **DELETE /api/grading/:id**
  - Xóa bản ghi chấm điểm (Admin)

#### E. Quy trình chấm điểm hàng ngày

1. **CODO/GVPT chấm phòng**:
   - Nhập ghi chú tự do hoặc chọn vi phạm
   - POST `/api/grading/quick-submit` hoặc `/api/grading/save`
   - Status = 0 (Nháp)

2. **AI phân tích** (nếu dùng quick-submit):
   - Gemini API phân tích ghi chú tự do
   - Tự động xác định loại vi phạm & mức trừ

3. **Admin/GVPT phê duyệt**:
   - Review bản ghi
   - Thay đổi vi phạm nếu cần
   - Cập nhật status = 1 (Đã duyệt)

4. **Tính điểm tự động**:
   - finalScore = MAX(0, 120 - totalPenalty)
   - Điểm được tích lũy theo tuần

5. **Xuất báo cáo**:
   - Tuần: Friday-Thursday
   - Bao gồm: Xếp hạng phòng, top điểm cao

---

### 3.5 Yêu cầu Đặc biệt của Học sinh

#### A. 4 loại yêu cầu

**1. Yêu cầu đổi phòng (ChangeRoomRequest)**
```
{
  userId: ObjectId (ref: User),
  userDetail: { CMND, HoTen },
  originRoom: { roomId, roomTitle },
  toRoom: { roomId, roomTitle },
  requestStatus: Number (0-Chờ, 1-Duyệt, 2-Từ chối),
  rejectReason: String,
  updatedBy: String,
  timestamps: true
}
```

**2. Yêu cầu trả phòng (CheckOutRequest)**
```
{
  userId: ObjectId (ref: User),
  userDetail: { CMND, HoTen },
  room: { roomId, roomTitle, dateOut },
  requestStatus: Number (0-Chờ, 1-Duyệt, 2-Từ chối),
  rejectReason: String,
  updatedBy: String,
  timestamps: true
}
```

**3. Yêu cầu gia hạn (ExtendRequest)**
```
{
  userId: ObjectId (ref: User),
  userDetail: { CMND, HoTen },
  roomId: ObjectId,
  roomTitle: String,
  dateOut: Date (ngày hết hạn hiện tại),
  newDateOut: Date (ngày hết hạn mới),
  requestStatus: Number (0-Chờ, 1-Duyệt, 2-Từ chối),
  rejectReason: String,
  updatedBy: String,
  timestamps: true
}
```

**4. Yêu cầu sửa chữa (FixRequest)**
```
{
  userId: ObjectId (ref: User),
  userDetail: { CMND, HoTen },
  room: { roomId, roomTitle },
  note: String (nội dung sửa chữa),
  requestStatus: Number (0-Chờ, 1-Duyệt, 2-Từ chối),
  rejectReason: String,
  updatedBy: String,
  timestamps: true
}
```

#### B. Quy trình xử lý
1. Học sinh tạo yêu cầu → Status = 0 (Chờ duyệt)
2. GVPT/Admin duyệt → Status = 1 (Duyệt) hoặc 2 (Từ chối)
3. Cập nhật thông tin học sinh (nếu phê duyệt)

---

### 3.6 Theo dõi Đón/Trả Học sinh (Pickup/Dropoff)

#### A. Tình huống sử dụng
- Học sinh bị ốm, cần về nhà điều trị
- Gia đình có việc đột xuất
- Cần tiếp kiến phụ huynh

#### B. Database Model

**Model: PickupDropoff**
```
{
  userId: ObjectId (ref: User),
  studentInfo: {
    HoTen: String,
    MHV: String,
    CMND: String,
    roomTitle: String,
    roomId: ObjectId
  },
  pickupPerson: {
    fullName: String,
    relationship: String (Cha/Mẹ/v.v),
    idCard: String,
    phone: String
  },
  pickupTime: Date,
  reason: String,
  pickupSignature: String,
  dropoffTime: Date,
  dropoffSignature: String,
  status: Number (0-Chờ phê duyệt, 1-Đã đón, 2-Đã trả, 3-Từ chối),
  approvedBy: String,
  approverEmail: String,
  approvedAt: Date,
  rejectedReason: String,
  createdBy: String,
  updatedBy: String,
  timestamps: true
}
```

#### C. API

- `POST /api/pickup-dropoff` - Tạo yêu cầu đón
- `GET /api/pickup-dropoff` - Danh sách yêu cầu (Admin)
- `GET /api/pickup-dropoff/:id` - Chi tiết yêu cầu
- `GET /api/pickup-dropoff/user/:userId` - Yêu cầu của user
- `PUT /api/pickup-dropoff/approve/:id` - Phê duyệt đón
  - Gửi email thông báo phê duyệt
- `PUT /api/pickup-dropoff/reject/:id` - Từ chối đón
  - Gửi email thông báo từ chối
- `PUT /api/pickup-dropoff/dropoff/:id` - Cập nhật thời gian trả
  - Gửi email thông báo trả xong
- `DELETE /api/pickup-dropoff/:id` - Xóa yêu cầu (Admin)

#### D. Email Notification
- **Phê duyệt**: `sendPickupApprovalEmail()` - Thông báo phê duyệt + Details
- **Từ chối**: `sendPickupRejectionEmail()` - Thông báo từ chối + Lý do
- **Trả xong**: `sendDropoffNotificationEmail()` - Thông báo trả xong

---

## IV. GIAO DIỆN NGƯỜI DÙNG (FRONTEND)

### 4.1 Công khai (Public Routes)

- **Trang chủ** (`/`) - Giới thiệu ký túc xá
- **Danh sách phòng** (`/room`) - Xem phòng có sẵn
- **Chi tiết phòng** (`/room/:id`) - Thông tin phòng, giá, v.v
- **Chính sách** (`/policy/register`) - Quy định ký túc xá

### 4.2 Xác thực (Auth Routes)

- **Đăng nhập** (`/login`) - CMND + Mật khẩu
- **Đăng xuất** (`/logout`) - Clear token

### 4.3 Học sinh (Student Routes)

- **Hồ sơ cá nhân** (`/student/profile/:id`) - Xem/Sửa thông tin
- **Lịch sử phòng** (`/student/room/history`) - Danh sách phòng đã ở

### 4.4 Quản trị (Admin Routes)

- **Dashboard** (`/admin`) - Tổng quan hệ thống
- **Danh sách sinh viên** (`/admin/student/list`)
  - Thêm học sinh (`/admin/student/signup`)
- **Danh sách phòng** (`/admin/room/list`)
  - Chi tiết phòng (`/admin/room/:id`)
  - Thêm phòng (`/admin/room/add`)
- **Chấm điểm** (`/admin/grading-ai`)
  - Giao diện chấm điểm hàng ngày
  - AI hỗ trợ phân tích ghi chú
  - Xuất báo cáo tuần/tháng
- **Quản lý yêu cầu** (`/admin/requests`)
  - Đổi phòng, trả phòng, gia hạn, sửa chữa
- **Đón/Trả học sinh** (`/admin/pickup-dropoff`)
  - Danh sách yêu cầu
  - Phê duyệt / Từ chối / Cập nhật trả

---

## V. AUTHENTICATION & AUTHORIZATION

### 5.1 Cơ chế xác thực

- **JWT Token** - Lưu trong HTTP-only cookie
- **Bcryptjs** - Mã hóa mật khẩu

### 5.2 Kiểm tra quyền (Middleware)

**File**: `Utils/Verifytoken.js`

- `Verifytoken()` - Kiểm tra JWT token từ cookie
- `VerifyUser()` - Xác minh quyền User (có account không)
- `VerifyAdmin()` - Xác minh quyền Admin (role = ADMIN_ROLE_ID từ env)

### 5.3 Các endpoint yêu cầu quyền

- **Xóa tài khoản**: `VerifyAdmin` (Admin)
- **Xóa sinh viên**: `VerifyAdmin` (Admin)
- **Xóa phòng**: `VerifyAdmin` (Admin)
- **Cập nhật phòng**: `VerifyAdmin` (Admin)
- **Duyệt yêu cầu**: `VerifyAdmin` (Admin)

---

## VI. CÁC TÍNH NĂNG NỔI BẬT

### 6.1 AI hỗ trợ chấm điểm
- Dùng **Google Generative AI (Gemini)**
- Phân tích ghi chú tự do → Xác định vi phạm
- Gợi ý loại lỗi & mức trừ

### 6.2 Báo cáo tự động
- Xuất Excel tuần (Friday-Thursday)
- Xuất Excel tháng
- Xếp hạng phòng theo điểm

### 6.3 Email notification
- Phê duyệt yêu cầu đón
- Từ chối yêu cầu đón
- Thông báo trả học sinh

### 6.4 Quản lý yêu cầu đặc biệt
- Đổi phòng, trả phòng, gia hạn, sửa chữa
- Duyệt/Từ chối tập trung
- Lưu lịch sử xử lý

### 6.5 Bảo mật
- Role-based access control (RBAC)
- JWT token authentication
- Mã hóa bcryptjs
- HTTP-only cookies

---

## VII. KIẾN TRÚC BACKEND

### 7.1 Cấu trúc thư mục

```
Backend/API/
├── Controllers/
│   ├── admin.js
│   ├── auth.js
│   ├── dormitory.js
│   ├── grading.js
│   ├── pickupDropoff.js
│   ├── role.js
│   ├── room.js
│   ├── roomdetails.js
│   └── user.js
├── Models/
│   ├── Account.js
│   ├── Admin.js
│   ├── Dormitory.js
│   ├── GradingLog.js
│   ├── PickupDropoff.js
│   ├── Role.js
│   ├── Room.js
│   ├── RoomDetails.js
│   ├── User.js
│   └── requests/
│       ├── changeRoomRequest.js
│       ├── checkOutRequest.js
│       ├── extendRequest.js
│       └── fixRequest.js
├── Routes/
│   ├── admin.js
│   ├── auth.js
│   ├── dormitorys.js
│   ├── grading.js
│   ├── pickupDropoff.js
│   ├── role.js
│   ├── roomdetail.js
│   ├── rooms.js
│   └── Users.js
├── Middlewares/
│   └── errors.js
├── Utils/
│   ├── ApiError.js
│   ├── Error.js
│   ├── Verifytoken.js
│   └── mailer.js
├── Index.js (Entrypoint)
└── JwtToken.js
```

### 7.2 Entry Point
- **File**: `Index.js`
- **Port**: 8800
- **CORS**: Whitelist frontend (localhost:3000 + .env FRONTEND_URL)
- **Static files**: Phục vụ React build từ `/Frontend/build`
- **Routes**: Mount tất cả API routes từ `/api/`

---

## VIII. KIẾN TRÚC FRONTEND

### 8.1 Cấu trúc thư mục

```
Frontend/src/
├── pages/
│   ├── Public/
│   │   ├── RoomMenuPage.jsx
│   │   ├── RoomMenuDetail.jsx
│   │   └── PolicyPage.jsx
│   ├── Student/
│   │   ├── StudentProfile.jsx
│   │   └── RoomHistory.jsx
│   ├── Admin/
│   │   ├── AdminDashboardPage.jsx
│   │   ├── StudentList.jsx
│   │   ├── RoomListPage.jsx
│   │   ├── RoomDetailPage.jsx
│   │   ├── RoomAddPage.jsx
│   │   ├── KTXGradingPage.jsx
│   │   ├── PickupDropoffManagement.jsx
│   │   ├── SignupPage.jsx
│   │   └── Requests/
│   │       ├── index.jsx (Danh sách yêu cầu)
│   │       ├── ChangeRoomRequest.jsx
│   │       ├── CheckoutRequest.jsx
│   │       ├── ExtendRequest.jsx
│   │       └── FixRoom.jsx
│   ├── HomePage.jsx
│   └── NotFound.jsx
├── components/
├── API/ (Axios instances)
├── context/ (Global state)
├── routes/ (Routing)
├── utils/ (Helper)
├── Validate/ (Auth context)
└── App.js
```

### 8.2 Pages chính

| Page | Route | Mô tả |
|------|-------|-------|
| Trang chủ | `/` | Giới thiệu ký túc xá |
| Danh sách phòng | `/room` | Xem phòng có sẵn (Public) |
| Chi tiết phòng | `/room/:id` | Thông tin phòng (Public) |
| Chính sách | `/policy/register` | Quy định ký túc xá |
| Đăng nhập | `/login` | CMND + Mật khẩu |
| Hồ sơ HS | `/student/profile/:id` | Hồ sơ cá nhân |
| Lịch sử phòng | `/student/room/history` | Phòng đã ở |
| Dashboard | `/admin` | Tổng quan Admin |
| Danh sách HS | `/admin/student/list` | Quản lý sinh viên |
| Thêm HS | `/admin/student/signup` | Đăng ký sinh viên |
| Danh sách phòng | `/admin/room/list` | Quản lý phòng |
| Chi tiết phòng | `/admin/room/:id` | Cập nhật phòng |
| Thêm phòng | `/admin/room/add` | Tạo phòng mới |
| Chấm điểm | `/admin/grading-ai` | Chấm & xuất báo cáo |
| Quản lý yêu cầu | `/admin/requests` | Đổi phòng/Trả/v.v |
| Đón/Trả HS | `/admin/pickup-dropoff` | Quản lý đón trả |

---

## IX. CÁCH TRIỂN KHAI & CHẠY

### 9.1 Cài đặt Dependencies

```bash
# Backend
cd Backend/API
npm install

# Frontend
cd Frontend
npm install
```

### 9.2 Cấu hình Environment

**Backend** - `.env`:
```
MONGO=mongodb+srv://...
JWT=<secret-key>
ADMIN_ROLE_ID=<role-id-từ-db>
GEMINI_API_KEY=<gemini-key>
EMAIL_USER=<gmail>
EMAIL_PASSWORD=<app-password>
FRONTEND_URL=http://localhost:3000
```

### 9.3 Chạy

```bash
# Backend (dev mode)
cd Backend/API
npm run dev

# Frontend (dev mode)
cd Frontend
npm run dev

# Build Frontend
npm run build  # → output: Frontend/build
```

---

## X. HƯỚNG PHÁT TRIỂN TƯƠNG LAI

- [ ] Mobile app (iOS/Android)
- [ ] Thống kê nâng cao (BI Dashboard)
- [ ] Tích hợp thanh toán online
- [ ] Chatbot hỗ trợ 24/7
- [ ] Khảo sát, đánh giá hài lòng
- [ ] Quản lý sự kiện, hoạt động tập thể

---

**Ngày cập nhật**: 18/03/2026  
**Vesion**: 2.0 (Cập nhật sát source code)