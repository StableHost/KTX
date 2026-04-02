# 📋 Hướng Dẫn Hệ Thống Phân Quyền KTX

## I. Tổng Quan Hệ Thống Phân Quyền

Hệ thống quản lý Ký Túc Xá (KTX) được chia thành **3 nhóm quyền chính** để kiểm soát truy cập và chức năng của từng nhóm người dùng:

| Vai Trò | Ký Hiệu | Màu | Mô Tả |
|---------|---------|-----|-------|
| **Quản trị viên** | Admin | 🔴 Đỏ | Toàn quyền quản lý hệ thống |
| **Ban Chấp Hành Đoàn** | BCH | 🔵 Xanh | Chấm điểm, sửa vi phạm |
| **Giáo viên phụ trách** | GVPT | 🟢 Xanh lá | Quản lý phòng phụ trách |
| **Học sinh** | Student | 🟣 Tím | Xem thông tin cá nhân |

---

## II. Chi Tiết Quyền từng Vai Trò

### A. ADMIN (Quản Trị Viên) 🔴

**Quyền hạn:**

| Chức Năng | Quyền | Mô Tả |
|-----------|-------|-------|
| 👤 Tạo tài khoản | ✅ **CÓ** | Là người duy nhất có quyền tạo tài khoản mới |
| 🔐 Cấp mật khẩu | ✅ **CÓ** | Cấp tên đăng nhập và mật khẩu cho các nhóm khác |
| 🎯 Phân quyền | ✅ **CÓ** | Phân quyền cho Admin, BCH, GVPT, Student |
| 📝 Quản lý hồ sơ HS | ✅ **CÓ** | Thêm mới, chỉnh sửa, xóa hồ sơ học sinh |
| 🏢 Nhập danh sách HS | ✅ **CÓ** | Nhập danh sách HS vào các phòng (khoảng 60 phòng) |
| 📊 Chấm điểm | ✅ **CÓ** | Chấm điểm thi đua |
| ✏️ Sửa điểm | ✅ **CÓ** | Sửa kết quả chấm điểm và vi phạm |
| 📂 Xuất báo cáo | ✅ **CÓ** | Xuất báo cáo nền nếp hàng tuần, tháng |
| 🚪 Kiểm soát chuyển phòng | ✅ **CÓ** | Phê duyệt, từ chối hoặc xử lý yêu cầu chuyển phòng |

**Truy cập:** Tất cả các trang, tất cả dữ liệu

**Ví dụ:** Nguyễn Xương (Hiệu trưởng / Quản trị viên)

---

### B. BCH (Ban Chấp Hành Đoàn) 🔵

**Quyền hạn:**

| Chức Năng | Quyền | Mô Tả |
|-----------|-------|-------|
| 👤 Tạo tài khoản | ❌ **KHÔNG** | Không được tạo tài khoản |
| 🔐 Cấp mật khẩu | ❌ **KHÔNG** | Không được cấp mật khẩu |
| 🎯 Phân quyền | ❌ **KHÔNG** | Không được phân quyền cho người khác |
| 📝 Quản lý hồ sơ HS | ❌ **KHÔNG** | Không được thêm, sửa, xóa hồ sơ |
| 🏢 Nhập danh sách HS | ❌ **KHÔNG** | Không được nhập danh sách HS |
| 📊 Chấm điểm | ✅ **CÓ** | **Chấm điểm thi đua hàng tuần** |
| ✏️ Sửa điểm | ✅ **CÓ** | **Sửa điểm vi phạm của HS** |
| 📂 Xuất báo cáo | ✅ **CÓ** | **Xuất báo cáo nền nếp tuần để gửi GVPT** |
| 🚪 Kiểm soát chuyển phòng | ❌ **KHÔNG** | Không được phê duyệt chuyển phòng |

**Truy cập:** 
- Trang chấm điểm thi đua
- Trang lịch sử chấm điểm
- Trang xuất báo cáo
- Xem danh sách tất cả phòng (chỉ xem, không sửa)

**Ví dụ:** Bế Anh Đức (Ban chấp hành đoàn trường)

---

### C. GVPT (Giáo Viên Phụ Trách Phòng) 🟢

**Quyền hạn:**

| Chức Năng | Quyền | Mô Tả |
|-----------|-------|-------|
| 👤 Tạo tài khoản | ❌ **KHÔNG** | Không được tạo tài khoản |
| 🔐 Cấp mật khẩu | ❌ **KHÔNG** | Không được cấp mật khẩu |
| 🎯 Phân quyền | ❌ **KHÔNG** | Không được phân quyền |
| 📝 Quản lý hồ sơ HS | ✏️ **GIỚI HẠN** | Chỉ sửa thông tin cá nhân (địa chỉ, SĐT) HS phòng mình |
| 🏢 Nhập danh sách HS | ❌ **KHÔNG** | Không được nhập danh sách |
| 📊 Chấm điểm | ❌ **KHÔNG** | **Tuyệt đối không được chấm điểm** |
| ✏️ Sửa điểm | ❌ **KHÔNG** | **Tuyệt đối không được sửa điểm** |
| 📂 Xuất báo cáo | ❌ **KHÔNG** | Không được xuất báo cáo |
| 🚪 Kiểm soát chuyển phòng | ✅ **CÓ** | Được thao tác chức năng "Chuyển phòng" cho HS |
| 👁️ Xem danh sách | ✅ **CÓ** | **Chỉ xem được danh sách HS phòng mình phụ trách** |
| 📄 Xem kết quả chấm | ✏️ **CHẢy LẠI** | Có thể xem phòng khác nhưng **tuyệt đối không được sửa/xóa** |

**Truy cập:** 
- Trang danh sách HS phòng mình
- Trang chấm điểm (chỉ xem, không chấm)
- Trang chuyển phòng
- Trang sửa thông tin HS phòng mình

**Hạn chế:**
- ❌ KHÔNG nhìn thấy nút "Chấm điểm"
- ❌ KHÔNG nhìn thấy nút "Sửa điểm"
- ❌ KHÔNG nhìn thấy nút "Xuất báo cáo"
- ❌ KHÔNG nhìn thấy nút "Xóa HS"

**Ví dụ:** Thầy Lê Quốc Vinh (GVPT phòng A5)

---

### D. STUDENT (Học Sinh) 🟣

**Quyền hạn:**

| Chức Năng | Quyền | Mô Tả |
|-----------|-------|-------|
| 📋 Xem hồ sơ cá nhân | ✅ **CÓ** | Xem thông tin cá nhân của mình |
| 📱 Sửa thông tin | ✅ **GIỚI HẠN** | Chỉ sửa một số trường (SĐT, địa chỉ) |
| 📊 Xem điểm | ✅ **CÓ** | Xem kết quả chấm điểm phòng mình |

**Truy cập:** 
- Trang hồ sơ cá nhân
- Trang kết quả chấm điểm phòng mình

---

## III. Cấu Hình Phân Quyền Trong Hệ Thống

### 1. Cấu Trúc File Phân Quyền

**File chính:** `Frontend/src/utils/permissions.js`

```javascript
export const ROLES = {
  ADMIN: 'admin',
  GVPT: 'gvpt',
  CODO: 'codo',
  STUDENT: 'student'
};

export const PERMISSION_LEVELS = {
  ADMIN: {
    canCreateAccount: true,
    canAssignRole: true,
    canDeleteStudent: true,
    canEditStudentInfo: true,
    canManageAllRooms: true,
    canGradePoint: true,
    canEditGrade: true,
    canExportReport: true,
    canManageUsers: true
  },
  CODO: {
    canGradePoint: true,
    canEditGrade: true,
    canExportReport: true,
    // ... các quyền khác = false
  },
  GVPT: {
    canEditStudentInfo: true,
    // ... các quyền khác = false
  },
  STUDENT: {
    // Tất cả = false
  }
};
```

### 2. Các Hàm Kiểm Tra Quyền

| Hàm | Mô Tả | Ví Dụ |
|-----|-------|-------|
| `hasPermission(role, action)` | Kiểm tra quyền chung | `hasPermission('codo', 'canGradePoint')` → `true` |
| `canGradePoint(role)` | Kiểm tra quyền chấm điểm | `canGradePoint('codo')` → `true` |
| `canEditGrade(role)` | Kiểm tra quyền sửa điểm | `canEditGrade('gvpt')` → `false` |
| `canEditStudentInfo(role)` | Kiểm tra quyền sửa thông tin | `canEditStudentInfo('gvpt')` → `true` |
| `canDeleteStudent(role)` | Kiểm tra quyền xóa HS | `canDeleteStudent('admin')` → `true` |
| `canExportReport(role)` | Kiểm tra quyền xuất báo cáo | `canExportReport('codo')` → `true` |
| `isAdmin(role)` | Kiểm tra role admin | `isAdmin('admin')` → `true` |
| `isCODO(role)` | Kiểm tra role CODO | `isCODO('codo')` → `true` |
| `isGVPT(role)` | Kiểm tra role GVPT | `isGVPT('gvpt')` → `true` |

### 3. Cách Sử Dụng Trong Component

#### Ví dụ 1: Ẩn/Hiện Nút Chấm Điểm

```jsx
import { canGradePoint } from '../../utils/permissions';

function KTXGradingPage() {
  const [userRole, setUserRole] = useState('student');

  return (
    <>
      {canGradePoint(userRole) ? (
        <button onClick={handleGrade}>Chấm Điểm</button>
      ) : (
        <button disabled>Chấm Điểm (Bạn không có quyền)</button>
      )}
    </>
  );
}
```

#### Ví dụ 2: Vô Hiệu Hóa Nút

```jsx
<button disabled={!canGradePoint(userRole)}>
  Chấm Điểm
</button>
```

#### Ví dụ 3: Hiển Thị Thông Báo Lỗi

```jsx
if (!canGradePoint(userRole)) {
  return (
    <PermissionDeniedAlert 
      feature="Chấm điểm thi đua" 
      requiredRole="CODO / Admin"
    />
  );
}
```

#### Ví dụ 4: Component ProtectedFeature

```jsx
<ProtectedFeature
  userRole={userRole}
  requiredPermission="canGradePoint"
  fallback={<p>Bạn không có quyền chấm điểm</p>}
>
  <button onClick={handleGrade}>Chấm Điểm</button>
</ProtectedFeature>
```

---

## IV. Cách Lấy Role Người Dùng Từ localStorage

```jsx
import { useEffect, useState } from 'react';

function Component() {
  const [userRole, setUserRole] = useState('student');

  useEffect(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser) {
        const role = currentUser.details?.RoleId?.toLowerCase() || 'student';
        setUserRole(role);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }, []);

  // ... sử dụng userRole
}
```

---

## V. Backend - Kiểm Tra Quyền trong API

### Middleware Xác Thực Quyền

**File:** `Backend/API/Middlewares/authorization.js` (cần tạo)

```javascript
const { PERMISSION_LEVELS } = require('../Models/permissions'); // Cần import từ utility

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role?.toLowerCase() || 'student';
      const permissions = PERMISSION_LEVELS[userRole];
      
      if (!permissions || !permissions[requiredPermission]) {
        return res.status(403).json({
          success: false,
          message: `❌ Bạn không có quyền thực hiện chức năng này. Yêu cầu: ${requiredPermission}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền'
      });
    }
  };
};

module.exports = { checkPermission };
```

### Sử Dụng Middleware trong Route

```javascript
// Backend/API/Routes/grading.js
const express = require('express');
const { checkPermission } = require('../Middlewares/authorization');
const verifyToken = require('../Utils/Verifytoken');

const router = express.Router();

// Chỉ BCH và Admin có thể chấm điểm
router.post(
  '/grading/save',
  verifyToken,
  checkPermission('canGradePoint'),
  gradingController.saveGrade
);

// Chỉ BCH và Admin có thể sửa điểm
router.put(
  '/grading/:id',
  verifyToken,
  checkPermission('canEditGrade'),
  gradingController.updateGrade
);

// Chỉ BCH và Admin có thể xuất báo cáo
router.get(
  '/grading/export/weekly',
  verifyToken,
  checkPermission('canExportReport'),
  gradingController.exportWeekly
);

module.exports = router;
```

---

## VI. Quy Trình Xác Thực Phân Quyền

### Trên Frontend:

```
1. Người dùng đăng nhập
   ↓
2. Lưu currentUser vào localStorage (bao gồm RoleId)
   ↓
3. Component mount → Lấy role từ localStorage
   ↓
4. Kiểm tra quyền bằng hasPermission()
   ↓
5a. CÓ QUYỀN: Hiển thị nút / cho phép thao tác
5b. KHÔNG QUYỀN: Ẩn nút / vô hiệu hóa / hiển thị thông báo lỗi
```

### Trên Backend:

```
1. Client gửi request với JWT token
   ↓
2. verifyToken() xác thực token → lấy userId, role
   ↓
3. checkPermission() kiểm tra quyền
   ↓
4a. CÓ QUYỀN: Tiếp tục xử lý request
4b. KHÔNG QUYỀN: Return 403 Forbidden
```

---

## VII. Bảng So Sánh Quyền Tổng Hợp

| Chức Năng | Admin | BCH | GVPT | Student |
|-----------|:-----:|:----:|:----:|:-------:|
| **Tạo tài khoản** | ✅ | ❌ | ❌ | ❌ |
| **Phân quyền** | ✅ | ❌ | ❌ | ❌ |
| **Quản lý hồ sơ HS** | ✅ | ❌ | ✏️ | ❌ |
| **Nhập danh sách HS** | ✅ | ❌ | ❌ | ❌ |
| **Chấm điểm** | ✅ | ✅ | ❌ | ❌ |
| **Sửa điểm** | ✅ | ✅ | ❌ | ❌ |
| **Xuất báo cáo** | ✅ | ✅ | ❌ | ❌ |
| **Chuyển phòng** | ✅ | ❌ | ✅ | ❌ |
| **Xem danh sách HS** | ✅ | ✅ | ✅ | ✏️ |
| **Xem điểm** | ✅ | ✅ | ✅ | ✏️ |

**Ký hiệu:**
- ✅ = Toàn quyền
- ❌ = Không quyền
- ✏️ = Quyền giới hạn

---

## VIII. Hướng Dẫn Admin Cấu Hình Quyền

### Bước 1: Tạo Tài Khoản và Gán Role

1. Admin đăng nhập hệ thống
2. Vào **"Quản lý tài khoản"** → **"Tạo tài khoản mới"**
3. Nhập thông tin:
   - **Tên đăng nhập**: VD: `cogvpt_anhle`
   - **Mật khẩu**: Tạo ngẫu nhiên hoặc do admin cấp
   - **Vai trò**: Chọn từ danh sách:
     - `admin` - Quản trị viên
     - `codo` - Ban Chấp Hành Đoàn (BCH)
     - `gvpt` - Giáo viên phụ trách
     - `student` - Học sinh
4. Nhấn **"Lưu"**

### Bước 2: Phân Công GVPT cho Phòng

1. Admin vào **"Quản lý phòng"**
2. Chọn phòng (VD: A5)
3. Nhấn **"Phân công GVPT"**
4. Chọn giáo viên từ danh sách GVPT
5. Nhấn **"Lưu"**

### Bước 3: Kiểm Tra Quyền

Để kiểm tra xem các quyền đã được áp dụng đúng:

1. Admin vào **"Kiểm tra quyền"**
2. Chọn vai trò cần kiểm tra
3. Xem danh sách quyền được cấp
4. Nếu cần điều chỉnh: Sửa trong `permissions.js` và redeploy

---

## IX. Troubleshooting (Xử Lý Sự Cố)

### Vấn Đề 1: GVPT vẫn nhìn thấy nút "Chấm điểm"

**Nguyên nhân:** Quyền chưa được áp dụng

**Giải pháp:**
1. Kiểm tra role được lưu trong localStorage
2. Đảm bảo function `canGradePoint()` được gọi đúng
3. Reload trang và đăng nhập lại

```jsx
// Debug: In ra role hiện tại
console.log('User role:', userRole);
console.log('Can grade:', canGradePoint(userRole));
```

### Vấn Đề 2: BCH không thể chấm điểm

**Nguyên nhân:** API trả về 403 Forbidden

**Giải pháp:**
1. Kiểm tra middleware `checkPermission` trên Backend
2. Đảm bảo token JWT hợp lệ
3. Kiểm tra role trong token khớp với BCH

```javascript
// Debug Backend
console.log('User role from token:', req.user?.role);
console.log('Permission check:', permissions[requiredPermission]);
```

### Vấn Đề 3: Không có quyền được giải phóng

**Nguyên nhân:** Role không được set đúng

**Giải pháp:**
```jsx
// Kiểm tra role từ localStorage
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('Full user object:', user);
console.log('Role field path:', user.details?.RoleId);
```

---

## X. Best Practices (Các Thực Hành Tốt)

✅ **NÊN:**
- Kiểm tra quyền cả trên Frontend và Backend
- Hiển thị thông báo lỗi rõ ràng khi bị từ chối
- Sử dụng component ProtectedFeature để tái sử dụng
- Ghi log các hành động nhạy cảm (chấm điểm, sửa, xóa)

❌ **KHÔNG NÊN:**
- Chỉ kiểm tra quyền trên Frontend (dễ bị bypass)
- Lưu trữ role plaintext trong localStorage
- Cho phép người dùng tự sửa role trong localStorage
- Quên check quyền trên một số hành động

---

## XI. Liên Hệ Hỗ Trợ

Nếu có câu hỏi về phân quyền:
- 📧 Email: admin@ktx.edu.vn
- 📱 Điện thoại: (Chi tiết cụ thể)
- 💬 Slack: #support-ktx

---

**Cập nhật lần cuối:** 19/03/2026  
**Phiên bản:** 1.0
