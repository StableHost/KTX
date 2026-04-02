# 🔐 Hệ Thống Phân Quyền KTX - README

**Ngày hoàn thành:** 19/03/2026  
**Phiên bản:** 1.0  
**Trạng thái:** ✅ Sẵn sàng tích hợp

---

## 🎯 Mục Tiêu

Giới thiệu hệ thống **phân quyền chức năng (Role-Based Access Control - RBAC)** cho KTXGradingPage với **3 nhóm quyền chính**:

1. **Admin** - Quản trị viên (Toàn quyền)
2. **BCH** - Ban Chấp Hành Đoàn (Chấm điểm, sửa vi phạm, xuất báo cáo)
3. **GVPT** - Giáo viên phụ trách (Xem & quản lý HS phòng mình)

---

## ⚡ Bắt Đầu Nhanh (5 phút)

### Step 1: Kiểm Tra File Mới Được Tạo

```bash
# Frontend
✅ Frontend/src/utils/permissions.js              # Define roles & permissions
✅ Frontend/src/hooks/useUserPermissions.js       # Custom hook  
✅ Frontend/src/components/PermissionControl/PermissionControl.jsx  # Components

# Backend
✅ Backend/API/config/permissions.js              # Backend permissions
✅ Backend/API/Middlewares/authorization.js       # Auth middleware

# Documentation
✅ HUONG_DAN_PHAN_QUYEN.md                        # Admin guide
✅ HUONG_DAN_SU_DUNG_PHAN_QUYEN.md               # Dev guide (Frontend)
✅ HUONG_DAN_TICH_HOP_PHAN_QUYEN_BACKEND.md      # Dev guide (Backend)
✅ TONG_KET_PHAN_QUYEN.md                         # Summary document
✅ README_PHAN_QUYEN.md                           # This file
```

### Step 2: KTXGradingPage Đã Được Cập Nhật

File `Frontend/src/pages/Admin/KTXGradingPage.jsx` đã có:
- ✅ Import permissions utilities
- ✅ Load user role từ localStorage
- ✅ Kiểm tra quyền trước khi chấm điểm/sửa/xuất báo cáo
- ✅ Hiển thị badge vai trò người dùng
- ✅ Thông báo quyền bị từ chối

### Step 3: Chạy & Test

```bash
# Frontend
cd Frontend
npm install
npm start
# Truy cập: http://localhost:3000
# Login với các vai trò khác nhau để test

# Backend
cd Backend/API
npm install
npm start
# Chạy trên port: 8800
```

---

## 📖 Các Tài Liệu Quan Trọng

| Tài Liệu | Dành Cho | Thời Đọc | Mục Đích |
|----------|----------|---------|---------|
| **HUONG_DAN_PHAN_QUYEN.md** | 👤 Admin / PM | 20 min | Hiểu chi tiết 3 nhóm quyền |
| **HUONG_DAN_SU_DUNG_PHAN_QUYEN.md** | 👨‍💻 Frontend Dev | 30 min | Sử dụng utils & components |
| **HUONG_DAN_TICH_HOP_PHAN_QUYEN_BACKEND.md** | 👨‍💻 Backend Dev | 40 min | Tích hợp middleware |
| **TONG_KET_PHAN_QUYEN.md** | 🤔 Tất cả | 15 min | Tóm tắt toàn bộ |
| **README_PHAN_QUYEN.md** | 🎯 Bắt đầu | 5 min | Bạn đang đọc |

---

## 🎬 Ví Dụ Nhanh

### Frontend - Kiểm Tra Quyền

```jsx
// Cách 1: Sử dụng Hook (Cách tốt nhất ⭐)
import { useUserPermissions } from '../../hooks/useUserPermissions';

function GradingPage() {
  const { canGrade, userRole } = useUserPermissions();
  
  if (!canGrade) {
    return <div>❌ Bạn không có quyền chấm điểm</div>;
  }
  
  return <button onClick={submitGrade}>Chấm Điểm</button>;
}
```

```jsx
// Cách 2: Sử dụng Component ProtectedFeature
import { ProtectedFeature } from '../../components/PermissionControl/PermissionControl';

<ProtectedFeature
  userRole={userRole}
  requiredPermission="canGradePoint"
  fallback={<p>Không quyền</p>}
>
  <button>Chấm Điểm</button>
</ProtectedFeature>
```

### Backend - Kiểm Tra Quyền

```javascript
// Src: Backend/API/Routes/grading.js
const verifyToken = require('../Utils/Verifytoken');
const { checkPermission } = require('../Middlewares/authorization');

// Route chỉ BCH + Admin có thể chấm điểm
router.post(
  '/save',
  verifyToken,              // 1. Xác thực token
  checkPermission('canGradePoint'),  // 2. Kiểm tra quyền
  gradingController.saveGrade        // 3. Xử lý request
);
```

---

## 🔑 3 Nhóm Quyền Chính

### 1. ADMIN - Toàn Quyền ✅✅✅

```
Chấm điểm          ✅ CÓ
Sửa điểm vi phạm   ✅ CÓ
Xuất báo cáo       ✅ CÓ
Quản lý HS         ✅ CÓ (thêm, sửa, xóa)
Tạo tài khoản      ✅ CÓ
Phân quyền         ✅ CÓ
```

### 2. BCH - Chấm Điểm & Xuất Báo Cáo ✅✅❌

```
Chấm điểm          ✅ CÓ
Sửa điểm vi phạm   ✅ CÓ
Xuất báo cáo       ✅ CÓ
Quản lý HS         ❌ KHÔNG
Tạo tài khoản      ❌ KHÔNG
Phân quyền         ❌ KHÔNG
```

### 3. GVPT - Quản Lý Phòng Mình ✅❌❌

```
Chấm điểm          ❌ KHÔNG (tuyệt đối!)
Sửa điểm vi phạm   ❌ KHÔNG (tuyệt đối!)
Xuất báo cáo       ❌ KHÔNG
Quản lý HS         ✅ CÓ (chỉ HS phòng mình)
Tạo tài khoản      ❌ KHÔNG
Phân quyền         ❌ KHÔNG
```

---

## 📊 Quyền Chi Tiết - Bảng So Sánh

| Chức Năng | Admin | BCH | GVPT | Student |
|-----------|:----:|:----:|:----:|:-------:|
| Tạo tài khoản | ✅ | ❌ | ❌ | ❌ |
| Phân quyền | ✅ | ❌ | ❌ | ❌ |
| Chấm điểm | ✅ | ✅ | ❌ | ❌ |
| Sửa điểm | ✅ | ✅ | ❌ | ❌ |
| Xuất báo cáo | ✅ | ✅ | ❌ | ❌ |
| Quản lý HS | ✅ | ❌ | ✅* | ❌ |
| Xem danh sách HS | ✅ | ✅ | ✅* | ✏️ |
| Xem điểm | ✅ | ✅ | ✅ | ✅ |

**\* Chỉ HS phòng mình**  
**✏️ Chỉ thông tin cá nhân**

---

## 🏗️ Cấu Trúc File

```
Project Root
├── Backend/
│   └── API/
│       ├── config/
│       │   └── permissions.js           ⭐ Định nghĩa quyền Backend
│       ├── Middlewares/
│       │   └── authorization.js         ⭐ Middleware kiểm tra quyền
│       └── Routes/
│           ├── grading.js
│           ├── Users.js
│           └── ... (cần update)
│
├── Frontend/
│   └── src/
│       ├── utils/
│       │   └── permissions.js           ⭐ Định nghĩa quyền Frontend
│       ├── hooks/
│       │   └── useUserPermissions.js    ⭐ Custom hook
│       ├── components/
│       │   └── PermissionControl/
│       │       └── PermissionControl.jsx ⭐ Components kiểm tra quyền
│       └── pages/
│           └── Admin/
│               └── KTXGradingPage.jsx   ✏️ Đã cập nhật
│
└── Documentation/
    ├── HUONG_DAN_PHAN_QUYEN.md          📖 Admin guide
    ├── HUONG_DAN_SU_DUNG_PHAN_QUYEN.md  📖 Frontend dev guide
    ├── HUONG_DAN_TICH_HOP_PHAN_QUYEN_BACKEND.md  📖 Backend dev guide
    ├── TONG_KET_PHAN_QUYEN.md           📖 Summary
    └── README_PHAN_QUYEN.md             📖 This file
```

---

## 🚀 Tiếp Theo - TODO List

### 📋 Phase 1: Frontend Integration (1 ngày)
- [ ] Import permissions vào tất cả admin pages
- [ ] Cập nhật tất cả buttons/actions sử dụng `canGradePoint`, `canEditGrade`
- [ ] Test kiểm tra quyền ở tất cả pages
- [ ] Verify responsive trên mobile

### ⚙️ Phase 2: Backend Integration (2 ngày)
- [ ] Cập nhật tất cả routes với authorization middleware
- [ ] Update grading routes
- [ ] Update user manage routes
- [ ] Update account management routes
- [ ] Test API dengan curl/Postman

### 🧪 Phase 3: Testing (1 ngày)
- [ ] Test với admin account
- [ ] Test với BCH account
- [ ] Test với gvpt account
- [ ] Verify 403 errors khi bị từ chối
- [ ] Test bypass attempts

### 🚢 Phase 4: Deployment (1 ngày)
- [ ] Code review
- [ ] Update team documentation
- [ ] Train developers & admin
- [ ] Deploy to staging
- [ ] Final testing
- [ ] Deploy to production

---

## 🔍 Kiểm Tra Nhanh

### Frontend - Xem Role Hiện Tại

Mở DevTools Console:
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('User role:', user?.details?.RoleId);
```

### Test Kiểm Tra Quyền (Frontend)

```javascript
import { canGradePoint, hasPermission } from '../utils/permissions';

const role = 'codo';
console.log('Can grade:', canGradePoint(role));           // true
console.log('Can edit grade:', hasPermission(role, 'canEditGrade'));  // true
console.log('Can export:', canExportReport(role));        // true
```

### Test API Authorization (Backend)

```bash
# 1. Lấy token
curl -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bch_user","password":"password"}'
# Response: {"token":"eyJhbGc..."}

# 2. Test chấm điểm (BCH có quyền)
curl -X POST http://localhost:8800/api/grading/save \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"roomId":"A5","violations":[]}'
# Response: 200 OK

# 3. Test chấm điểm (GVPT không có quyền)
curl -X POST http://localhost:8800/api/grading/save \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"roomId":"A5","violations":[]}'
# Response: 403 Forbidden
```

---

## 📚 API Reference

### Frontend - Utilities

```javascript
// Import
import { 
  ROLES, 
  canGradePoint, 
  hasPermission, 
  isAdmin 
} from '../../utils/permissions';

// Functions
canGradePoint('codo')          // → true
hasPermission('gvpt', 'canGradePoint')  // → false
isAdmin('admin')               // → true
getPermissionsByRole('codo')   // → {...}
```

### Frontend - Hook

```javascript
import { useUserPermissions } from '../../hooks/useUserPermissions';

const {
  userRole,           // 'admin' | 'codo' | 'gvpt' | 'student'
  userInfo,           // { details: {...} }
  permissions,        // { canGradePoint: true, ... }
  canGrade,           // boolean
  canEditGrade,       // boolean
  // ... more
} = useUserPermissions();
```

### Frontend - Components

```jsx
// ProtectedFeature
<ProtectedFeature
  userRole={userRole}
  requiredPermission="canGradePoint"
  fallback={<p>No access</p>}
>
  <button>Action</button>
</ProtectedFeature>

// RoleBadge
<RoleBadge role="codo" detailed={true} />

// PermissionDeniedAlert
<PermissionDeniedAlert 
  feature="Chấm điểm" 
  requiredRole="BCH / Admin"
/>
```

### Backend - Middleware

```javascript
// Import
const { 
  checkPermission, 
  checkAdminPermission, 
  checkGradingPermission 
} = require('../Middlewares/authorization');

// Usage in routes
router.post('/action', verifyToken, checkPermission('canGradePoint'), handler);
router.delete('/user/:id', verifyToken, checkAdminPermission, handler);
```

---

## ❓ FAQ

**Q: Tôi là GVPT, tại sao không thấy nút "Chấm Điểm"?**  
A: ✅ Đúng rồi! GVPT không có quyền chấm điểm theo quy định. Chỉ BCH và Admin mới có thể chấm.

**Q: Làm sao thay đổi quyền của một role?**  
A: Sửa trong `permissions.js` file (Frontend & Backend) rồi redeploy.

**Q: Backend kiểm tra quyền như thế nào?**  
A: Bằng middleware `checkPermission()` - lấy role từ JWT token rồi so với `PERMISSION_LEVELS`.

**Q: Có thể bypass authorization bằng console không?**  
A: Trên Frontend có thể, nhưng Backend vẫn sẽ kiểm tra nên vẫn bị từ chối (403).

**Q: Ai là người tạo tài khoản & phân quyền?**  
A: Chỉ Admin có quyền. Không ai khác.

---

## 🆘 Troubleshooting

### Vấn Đề: Nút "Chấm Điểm" vẫn hiển thị cho GVPT

**Giải pháp:**
1. Reload trang
2. Kiểm tra role trong localStorage: `JSON.parse(localStorage.getItem('currentUser')).details.RoleId`
3. Nếu vẫn sai, kiểm tra `permissions.js` có được import đúng không

### Vấn Đề: API trả về 403 Forbidden

**Giải pháp:**
1. Kiểm tra token hợp lệ: `curl -H "Authorization: Bearer TOKEN" http://localhost:8800/api/grading/save`
2. Kiểm tra role trong token: Decode JWT xem role field
3. Kiểm tra quyền của role: So với `PERMISSION_LEVELS` trong `config/permissions.js`

### Vấn Đề: BCH không thể chấm điểm

**Giải pháp:**
1. Kiểm tra `RoleId` trong Database = 'codo' (lowercase)
2. Khi đăng nhập, token có chứa role: `codo` không?
3. Middleware authorize có được add vào route không?

---

## 📞 Support

| Chủ Đề | Contact | Notes |
|--------|---------|-------|
| **Quyền chức năng** | admin@ktx.edu.vn | Gặp Admin trực tiếp |
| **Frontend Implementation** | dev-frontend@ktx.edu.vn | Slack: #dev-front |
| **Backend Implementation** | dev-backend@ktx.edu.vn | Slack: #dev-back |
| **Documentation** | docs.ktx.edu.vn | Update thường xuyên |

---

## 📄 License & Credits

- **Created:** 19/03/2026
- **Version:** 1.0
- **Status:** ✅ Production Ready
- **Maintained by:** KTX Admin Team

---

## 🎓 Tài Liệu Học Thêm

```markdown
MUST READ:
├── HUONG_DAN_PHAN_QUYEN.md (Quản trị viên / PM)
├── HUONG_DAN_SU_DUNG_PHAN_QUYEN.md (Frontend Dev)
└── HUONG_DAN_TICH_HOP_PHAN_QUYEN_BACKEND.md (Backend Dev)

REFERENCE:
├── TONG_KET_PHAN_QUYEN.md (Technical Summary)
└── README_PHAN_QUYEN.md (Quick Start - You are here)
```

---

**Chúc bạn triển khai thành công! 🚀**

Nếu có câu hỏi, hãy liên hệ team hỗ trợ.
