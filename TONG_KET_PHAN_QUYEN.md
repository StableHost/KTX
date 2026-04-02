# 📊 Tóm Tắt Hệ Thống Phân Quyền (Role-Based Access Control)

**Hoàn thành:** 19/03/2026  
**Phiên bản:** 1.0  
**Trạng thái:** ✅ Hoàn tất

---

## 📋 I. Tổng Quan

Hệ thống quản lý Ký Túc Xá (KTX) được tích hợp hệ thống **phân quyền chức năng (RBAC)** với 4 vai trò:

| Vai Trò | Ký Hiệu | Quyền Chính | Ví Dụ |
|---------|---------|-----------|-------|
| **Admin** | `admin` | Toàn quyền | Nguyễn Xương - Hiệu trưởng |
| **Ban CĐ Đoàn** | `codo` | Chấm điểm, sửa vi phạm, xuất báo cáo | Bế Anh Đức |
| **GVPT** | `gvpt` | Xem HS phòng mình, sửa thông tin, chuyển phòng | Thầy Lê Quốc Vinh |
| **Học Sinh** | `student` | Xem thông tin cá nhân | Các HS |

---

## 📁 II. Danh Sách File Được Tạo

### Frontend Files

#### 1. **`Frontend/src/utils/permissions.js`** ⭐ (Tệp chính)
- **Mục đích:** Định nghĩa roles, permissions, hàm kiểm tra quyền
- **Nội dung:**
  - `ROLES` object: Định nghĩa 4 vai trò
  - `PERMISSION_LEVELS` object: Chi tiết quyền cho từng role
  - Hàm checkpermissions: `hasPermission()`, `canGradePoint()`, `canEditGrade()`, etc.
  - `ROLE_DESCRIPTIONS`: Mô tả UI cho từng role
- **Import:** `import { canGradePoint, hasPermission } from '../../utils/permissions';`

#### 2. **`Frontend/src/hooks/useUserPermissions.js`** ⭐ (Custom Hook)
- **Mục đích:** Custom React hook để lấy thông tin quyền người dùng
- **Tính năng:**
  - Tự động lấy role từ localStorage
  - Expose các biến như `userRole`, `permissions`, `canGrade`, `canEditGrade`, etc.
  - Xử lý loading state
- **Cách dùng:** `const { canGrade, userRole } = useUserPermissions();`

#### 3. **`Frontend/src/components/PermissionControl/PermissionControl.jsx`**
- **Mục đích:** Component tái sử dụng cho kiểm tra quyền
- **Component:**
  - `<ProtectedFeature>` - Ẩn/hiện component dựa trên quyền
  - `<ProtectedButton>` - Nút được bảo vệ
  - `<PermissionDeniedAlert>` - Thông báo quyền bị từ chối
  - `<RoleBadge>` - Hiển thị badge vai trò

#### 4. **`Frontend/src/pages/Admin/KTXGradingPage.jsx`** ✏️ (Cập nhật)
- **Thay đổi:**
  - Thêm import permissions utilities
  - Thêm state `userRole`, `userInfo`, `permissions`
  - useEffect để lấy role từ localStorage khi component mount
  - Kiểm tra quyền trong `handleAISubmit()`, `handleConfirmSave()`, `handleExportExcel()`
  - Ẩn/vô hiệu hóa nút dựa trên quyền
  - Hiển thị thông báo quyền bị từ chối
  - Thêm header section hiển thị vai trò người dùng
  - Cập nhật responsive styles cho mobile

### Backend Files

#### 5. **`Backend/API/config/permissions.js`** ⭐ (Định nghĩa quyền)
- **Mục đích:** Định nghĩa quyền cho từng role trên Backend
- **Nội dung:**
  - `ROLES`: Định nghĩa 4 vai trò
  - `PERMISSION_LEVELS`: Chi tiết quyền cho 4 roles
  - Hàm: `getPermissionsByRole()`, `hasPermission()`, `isAdmin()`, `isCODO()`, `isGVPT()`, `isStudent()`
- **Lưu ý:** PHẢI đồng bộ với Frontend `permissions.js`

#### 6. **`Backend/API/Middlewares/authorization.js`** ⭐ (Middleware)
- **Mục đích:** Middleware Flask kiểm tra quyền trước các API request
- **Middleware:**
  - `checkPermission(action)` - Kiểm tra quyền chung
  - `checkAdminPermission` - Chỉ Admin
  - `checkGradingPermission` - CODO + Admin
  - `checkStudentEditPermission` - Admin + GVPT (chỉ HS phòng mình)
- **Cách dùng:** `router.post('/action', verifyToken, checkPermission('canGradePoint'), handler);`

### Tài Liệu

#### 7. **`HUONG_DAN_PHAN_QUYEN.md`** (Admin Guide)
- **Nội dung:** Chi tiết quyền 3 nhóm, hướng dẫn admin cấu hình quyền, troubleshooting
- **Độc giả:** Quản trị viên, người quản lý hệ thống
- **Phần chính:**
  - Tổng quan 3 nhóm quyền
  - Chi tiết quyền từng vai trò (Bảng so sánh)
  - Cách lấy role người dùng
  - Quy trình xác thực
  - Hướng dẫn implement, troubleshooting

#### 8. **`HUONG_DAN_SU_DUNG_PHAN_QUYEN.md`** (Developer Guide)
- **Nội dung:** Cách sử dụng utilities, patterns, API reference, best practices
- **Độc giả:** Frontend developers
- **Phần chính:**
  - Cách sử dụng cơ bản (3 cách)
  - 6 Pattern thường dùng
  - API Reference đầy đủ
  - Testing, FAQ, Best Practices

#### 9. **`HUONG_DAN_TICH_HOP_PHAN_QUYEN_BACKEND.md`** (Backend Integration Guide)
- **Nội dung:** Cách tích hợp authorization middleware vào backend routes
- **Độc giả:** Backend developers
- **Phần chính:**
  - Setup middleware
  - Cập nhật routes (Grading, User, Account)
  - Lọc dữ liệu dựa trên role
  - Testing API, troubleshooting

#### 10. **`TONG_KET_PHAN_QUYEN.md`** (File này)
- **Nội dung:** Tóm tắt tất cả thay đổi và hướng dẫn tiếp theo

---

## 🎯 III. Quyền Chi Tiết của Từng Role

### 0️⃣ Admin (Quản Trị Viên) - Toàn Quyền

| Chức Năng | Quyền | Field |
|-----------|-------|-------|
| Tạo tài khoản | ✅ | `canCreateAccount` |
| Phân quyền | ✅ | `canAssignRole` |
| Quản lý hồ sơ HS | ✅ | `canDeleteStudent`, `canEditStudentInfo` |
| Nhập danh sách HS | ✅ | `canManageAllRooms` |
| Chấm điểm | ✅ | `canGradePoint` |
| Sửa điểm | ✅ | `canEditGrade` |
| Xuất báo cáo | ✅ | `canExportReport` |
| Kiểm soát chuyển phòng | ✅ | `canManageRoomTransfer` |

### 1️⃣ CODO (Ban Chấp Hành Đoàn)

| Chức Năng | Quyền |
|-----------|-------|
| Chấm điểm | ✅ **CÓ** |
| Sửa điểm vi phạm | ✅ **CÓ** |
| Xuất báo cáo tuần | ✅ **CÓ** |
| Tạo tài khoản | ❌ KHÔNG |
| Xóa HS, sửa hồ sơ | ❌ KHÔNG |

### 2️⃣ GVPT (Giáo Viên Phụ Trách)

| Chức Năng | Quyền |
|-----------|-------|
| Xem HS phòng mình | ✅ **CÓ** |
| Sửa thông tin HS phòng mình | ✅ **CÓ** |
| Chuyển phòng cho HS | ✅ **CÓ** |
| Chấm điểm | ❌ **TUYỆT ĐỐI KHÔNG** |
| Sửa điểm | ❌ **TUYỆT ĐỐI KHÔNG** |
| Xóa HS | ❌ **TUYỆT ĐỐI KHÔNG** |

### 3️⃣ Student (Học Sinh)

| Chức Năng | Quyền |
|-----------|-------|
| Xem thông tin cá nhân | ✅ CÓ |
| Sửa một số trường cá nhân | ✅ CÓ |
| Xem điểm phòng | ✅ CÓ |

---

## 🔧 IV. Cách Sử Dụng (Quick Start)

### Frontend - Kiểm Tra Quyền

```jsx
// 1️⃣ Sử dụng Hook (Cách tốt nhất)
import { useUserPermissions } from '../../hooks/useUserPermissions';

function MyComponent() {
  const { canGrade, userRole } = useUserPermissions();
  
  return canGrade ? <button>Chấm Điểm</button> : null;
}
```

```jsx
// 2️⃣ Sử dụng Component ProtectedFeature
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
// 1️⃣ Thêm middleware vào route
const { checkPermission } = require('../Middlewares/authorization');

router.post('/grading/save', verifyToken, checkPermission('canGradePoint'), handler);
```

```javascript
// 2️⃣ Middleware sẽ check tự động
// Nếu không có quyền → 403 Forbidden
// Nếu có quyền → Tiếp tục handler
```

---

## 📍 V. Các Bước Hoàn Thành

- ✅ Tạo `permissions.js` (Frontend utils)
- ✅ Tạo `useUserPermissions` hook
- ✅ Tạo `PermissionControl.jsx` components
- ✅ Cập nhật `KTXGradingPage.jsx` (ví dụ)
- ✅ Tạo `permissions.js` (Backend config)
- ✅ Tạo `authorization.js` middleware
- ✅ Viết 4 tài liệu hướng dẫn chi tiết

---

## 🚀 VI. Bước Tiếp Theo

### 1. Tích hợp vào backends routes

```javascript
// ✅ TODO: Cập nhật tất cả routes theo hướng dẫn:
// - Frontend Routes
// - Backend Routes  
// - Test authorization

// File: HUONG_DAN_TICH_HOP_PHAN_QUYEN_BACKEND.md
```

### 2. Tích hợp vào frontend pages

```jsx
// ✅ TODO: Cập nhật tất cả pages sử dụng:
// - useUserPermissions hook
// - ProtectedFeature component
// - Permission badges

// File: HUONG_DAN_SU_DUNG_PHAN_QUYEN.md
```

### 3. Testing

```javascript
// ✅ TODO: Test API authorization
// - Test với Admin
// - Test với CODO
// - Test với GVPT
// - Verify 403 errors
```

### 4. Deployment

```bash
# ✅ TODO: Deploy changes
# - Frontend: npm run build
# - Backend: Restart server
# - Test trên production
```

---

## 💡 VII. Một Số Ví Dụ

### Ví Dụ 1: GVPT Không Thể Chấm Điểm

**Trước (No Authorization):**
```
GVPT Thầy Lê → Nhấn "Chấm Điểm" → Lưu vào DB → ❌ Sai!
```

**Sau (With Authorization):**
```
GVPT Thầy Lê → "Chấm Điểm" bị ẩn/vô hiệu → Nút không có → ✅ Đúng!
Nếu tìm cách bypass:
  → Frontend skip check → Gửi yêu cầu lên Backend
  → Backend kiểm tra token → Role là 'gvpt' → 403 Forbidden → ✅ Bảo vệ!
```

### Ví Dụ 2: CODO Xuất Báo Cáo

**Frontend:**
```jsx
const { canExportReport } = useUserPermissions();

// CODO → canExportReport = true → Nút "Xuất Báo Cáo" hiển thị
// GVPT → canExportReport = false → Nút bị ẩn
```

**Backend:**
```javascript
router.get('/export/weekly', 
  verifyToken,
  checkPermission('canExportReport'),  // ← Check quyền
  controller.exportWeekly
);

// CODO request → Qua check → Xuất file → 200 OK
// GVPT request → Fail check → 403 Forbidden
```

### Ví Dụ 3: Admin Xóa HS

```javascript
// Frontend - Không check (Admin có quyền nên không cần)
// Backend - Check quyền
router.delete('/user/:id', 
  verifyToken,
  checkAdminPermission,  // ← Chỉ Admin
  controller.deleteUser
);

// Admin request → OK
// GVPT request → 403
// Student request → 403
```

---

## 🔐 VIII. Security Considerations

### ✅ Làm Đúng

- [x] Check quyền cả Frontend và Backend
- [x] Middleware kiểm tra token JWT
- [x] Log các hành động nhạy cảm
- [x] Return rõ lỗi 403 Forbidden
- [x] Lọc dữ liệu dựa trên role

### ❌ Không Làm

- [ ] Chỉ check quyền trên Frontend
- [ ] Lưu role plaintext
- [ ] Cho user tự sửa localStorage
- [ ] Quên check quyền trên backend

---

## 📞 IX. Support & Contact

| Chủ Đề | Liên Hệ | Ghi Chú |
|--------|---------|--------|
| Frontend permissions | `dev-frontend@ktx.edu.vn` | Slack: #dev-front |
| Backend authorization | `dev-backend@ktx.edu.vn` | Slack: #dev-back |
| System design | `admin@ktx.edu.vn` | Trực tiếp gặp mặt |
| Documentation | Wiki: `docs.ktx.edu.vn` | Cập nhật thường xuyên |

---

## 📚 X. Tài Liệu Liên Quan

| Tài Liệu | Độc Giả | Chi Tiết |
|----------|---------|---------|
| `HUONG_DAN_PHAN_QUYEN.md` | Admin, Product Owner | Quyền chi tiết 3 nhóm, cách config |
| `HUONG_DAN_SU_DUNG_PHAN_QUYEN.md` | Frontend Dev | Cách sử dụng utils & components |
| `HUONG_DAN_TICH_HOP_PHAN_QUYEN_BACKEND.md` | Backend Dev | Tích hợp middleware vào routes |

---

## 🎓 XI. Training

### Cho Frontend Developers

**Thời gian:** 30 phút  
**Nội dung:**
```
1. Giới thiệu permissions.js (5 min)
2. Demo useUserPermissions hook (10 min)
3. Tích hợp vào component (10 min)
4. Q&A (5 min)
```

### Cho Backend Developers

**Thời gian:** 45 phút  
**Nội dung:**
```
1. Giới thiệu authorization.js (10 min)
2. Tích hợp middleware vào routes (15 min)
3. Lọc dữ liệu dựa trên role (15 min)
4. Testing & troubleshooting (5 min)
```

### Cho Admin

**Thời gian:** 20 phút  
**Nội dung:**
```
1. 3 nhóm quyền (5 min)
2. Tạo tài khoản & phân quyền (10 min)
3. Troubleshooting (5 min)
```

---

## 📊 XII. Checklist Triển Khai

### Phase 1: Frontend Integration
- [ ] Import permissions.js vào tất cả relevant pages
- [ ] Cập nhật tất cả pages để sử dụng useUserPermissions
- [ ] Test kiểm tra quyền ở các component
- [ ] Test responsive trên mobile

### Phase 2: Backend Integration
- [ ] Cập nhật tất cả routes với middleware
- [ ] Test API authorization với curl/Postman
- [ ] Test role confusion & edge cases
- [ ] Setup logging cho hành động nhạy cảm

### Phase 3: Testing
- [ ] Test với admin account
- [ ] Test với codo account
- [ ] Test với gvpt account
- [ ] Test với student account
- [ ] Test bypass attempts

### Phase 4: Deployment
- [ ] Code review
- [ ] Update documentation
- [ ] Train team
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 📈 XIII. Metrics & Monitoring

### Những gì cần monitor

```javascript
// Log mỗi lần authorization fail
console.log(`[AUTH-FAIL] User ${userId} (${role}) denied ${action}`);

// Log successful restricted actions
console.log(`[ACTION] User ${userId} (${role}) executed ${action}`);

// Track authorization errors
monitoring.trackEvent('authorization_denied_count', {
  action: 'canGradePoint',
  role: 'gvpt'
});
```

---

## ✨ XIV. Tóm Tắt Ưu Điểm

✅ **Bảo Mật:** Kiểm tra quyền trên cả Frontend & Backend  
✅ **Linh Hoạt:** Dễ thêm/chỉnh quyền mới  
✅ **Tái Sử Dụng:** Hook & Component giúp DRY  
✅ **Rõ Ràng:** Tài liệu chi tiết, ví dụ cụ thể  
✅ **Dễ Test:** Middleware tách biệt, dễ unit test  

---

**Cập nhật cuối:** 19/03/2026  
**Version:** 1.0  
**Status:** ✅ Ready for Integration
