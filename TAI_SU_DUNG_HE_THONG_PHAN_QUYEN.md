# ♻️ Tái Sử Dụng Hệ Thống Phân Quyền Backend

**Ngày:** 20/03/2026  
**Version:** 1.0  
**Status:** ✅ Đã tích hợp

---

## 🎯 Tóm Tắt

Thay vì tạo hệ thống phân quyền mới, chúng tôi **tái sử dụng 100%** cơ sở hạ tầng backend hiện tại:

- ✅ Role model (4 roles: admin, gvpt, codo, student)
- ✅ Account model (RoleId reference)
- ✅ JWT token với RoleId
- ✅ Verifytoken middleware
- ✅ Login response trả về role object

**Các cải tiến:**
- ✏️ Middleware authorization mới để kiểm tra quyền chi tiết
- ✏️ PERMISSION_MATRIX bên trong middleware
- ✏️ Frontend hooks & utils tái sử dụng role string từ response

---

## 📊 So Sánh: Cũ vs Tái Sử Dụng

### Backend - Trước

```javascript
// Routes/grading.js
router.post('/save', VerifyAdmin, gradingController.saveGrade);
// ❌ Chỉ check admin, không check BCH
```

### Backend - Sau (Tái Sử Dụng)

```javascript
// Routes/grading.js
import { checkPermission } from '../Middlewares/authorization.js';

router.post('/save', Verifytoken, checkPermission('canGradePoint'), gradingController.saveGrade);
// ✅ Check admin, BCH, không check GVPT/Student
```

### Frontend - Trước

```jsx
// Không có kiểm tra quyền
<button onClick={handleGrade}>Chấm Điểm</button>
```

### Frontend - Sau (Tái Sử Dụng)

```jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';

function GradingPage() {
  const { canGrade } = useUserPermissions();
  
  return canGrade ? <button>Chấm Điểm</button> : null;
}
```

---

## 🏗️ Cấu Trúc Tái Sử Dụng

### Backend

```
Existing Structure:
├── Models/Role.js           (enum: admin, gvpt, codo, student)
├── Models/Account.js        (RoleId reference)
├── Utils/Verifytoken.js     (JWT verification)
├── Controllers/auth.js      (Login: populate role)
└── Routes/roles.js          (CRUD roles)

NEW Addition:
└── Middlewares/authorization.js  (Check permissions)
    ├── PERMISSION_MATRIX: { admin: {...}, codo: {...}, ... }
    ├── checkPermission(permission): middleware
    └── getRoleFromToken(): utility
```

### Frontend

```
Existing Code:
└── localStorage: { currentUser: { role: { role: "admin" }, ... } }

NEW Addition:
├── utils/permissions.js                    (Permission helpers)
├── hooks/useUserPermissions.js             (Get user role & permissions)
└── components/PermissionControl/           (UI components)
    ├── ProtectedFeature: hide component
    ├── RoleBadge: show role badge
    └── PermissionDeniedAlert: show warning
```

---

## 🔄 Luồng Dữ Liệu

### Luồng Login

```
Frontend Login Form
    ↓
Backend: auth.login()
    ├─ Find Account by CMND
    ├─ Verify Password
    ├─ Get Role from DB: Role.findById(account.RoleId)
    ├─ Create JWT Token: { id, CMND, RoleId }
    └─ Return: { details: {...}, role: { role: "codo", ... } }
    ↓
Frontend: localStorage.setItem('currentUser', response)
    ↓
Component: useUserPermissions() hook
    ├─ Get currentUser from localStorage
    ├─ Extract role.role string ("codo", "admin", etc)
    ├─ Load permissions from PERMISSION_LEVELS
    └─ Return: { userRole: "codo", canGrade: true, ... }
```

### Luồng Authorization Check

```
Frontend Button Click
    ↓
Check: canGradePoint(userRole) → true/false
    ├─ IF true:  Gửi API request
    ├─ IF false: Ẩn nút hoặc show error message
    ↓
(IF Request)
Backend: API Endpoint
    ├─ Middleware: Verifytoken → Extract JWT
    ├─ Middleware: checkPermission('canGradePoint')
    │   ├─ Get RoleId from JWT token
    │   ├─ Lookup Role from DB
    │   ├─ Get role string ("codo")
    │   ├─ Check PERMISSION_MATRIX["codo"]["canGradePoint"]
    │   ├─ IF true:  Set req.userRole, req.userPermissions → next()
    │   └─ IF false: Return 403 Forbidden
    ├─ (IF Allowed) Execute Controller
    └─ Return Response
```

---

## 📝 Code Examples

### Backend - Setup Route

```javascript
// Routes/grading.js
import express from 'express';
import { Verifytoken } from '../Utils/Verifytoken.js';
import { checkPermission } from '../Middlewares/authorization.js';
import * as gradingController from '../Controllers/grading.js';

const router = express.Router();

// Chỉ CODO + Admin có thể chấm điểm
router.post(
  '/save',
  Verifytoken,
  checkPermission('canGradePoint'),
  gradingController.saveGrade
);

// Chỉ CODO + Admin có thể sửa điểm
router.put(
  '/:id',
  Verifytoken,
  checkPermission('canEditGrade'),
  gradingController.updateGrade
);

// Chỉ CODO + Admin có thể xuất báo cáo
router.get(
  '/export/weekly',
  Verifytoken,
  checkPermission('canExportReport'),
  gradingController.exportWeekly
);

export default router;
```

### Backend - Controller (Không cần thay đổi)

```javascript
// Controllers/grading.js
export const saveGrade = async (req, res) => {
  try {
    // Authorization đã được check bởi middleware
    // req.userRole = 'codo' hoặc 'admin'
    // req.userPermissions = { canGradePoint: true, ... }
    
    const grade = await Grading.create({
      ...req.body,
      createdBy: req.account.id, // từ JWT token
      createdByRole: req.userRole  // từ middleware
    });
    
    res.json({ success: true, data: grade });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Frontend - Component

```jsx
// pages/Admin/KTXGradingPage.jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { canGradePoint, hasPermission } from '../../utils/permissions';

function KTXGradingPage() {
  const { userRole, permissions, canGrade, canEditGrade } = useUserPermissions();

  const handleGrade = async () => {
    if (!canGrade) {
      toast.error('❌ Bạn không có quyền chấm điểm');
      return;
    }
    
    // Call API
    await axios.post('/api/grading/save', { ... });
  };

  return (
    <>
      <h2>Vai trò: {userRole}</h2>
      
      {canGrade ? (
        <button onClick={handleGrade}>Chấm Điểm</button>
      ) : (
        <button disabled>Chấm Điểm (Bạn không có quyền)</button>
      )}
    </>
  );
}
```

---

## ✨ Thay Đổi được Tạo vs Tái Sử Dụng

### ✅ Tái Sử Dụng (Không tạo mới)

| Component | Vị Trí | Mô Tả |
|-----------|--------|-------|
| **Role Model** | Backend/API/Models/Role.js | 4 roles: admin, gvpt, codo, student |
| **Account Model** | Backend/API/Models/Account.js | RoleId reference |
| **JWT Mechanism** | Utils/Verifytoken.js, auth.js | Token cùng RoleId |
| **Login Response** | Controllers/auth.js | Trả về role object với role string |

### 🆕 Tạo Mới (Để Hỗ Trợ Tái Sử Dụng)

| Component | Vị Trí | Mô Tả |
|-----------|--------|-------|
| **Authorization Middleware** | Middlewares/authorization.js | Middleware + PERMISSION_MATRIX |
| **Frontend Utils** | utils/permissions.js | Permission helpers & descriptors |
| **Custom Hook** | hooks/useUserPermissions.js | Hook để lấy role & permissions |
| **UI Components** | components/PermissionControl/ | Reusable components |
| **KTXGradingPage Update** | pages/Admin/KTXGradingPage.jsx | Tích hợp permissions |

---

## 🔧 Hướng Dẫn Tích Hợp

### Step 1: Backend Routes

Thêm middleware `checkPermission` vào các routes:

```javascript
import { checkPermission } from '../Middlewares/authorization.js';

// Routes/grading.js
router.post('/analyze', Verifytoken, checkPermission('canGradePoint'), handler);
router.post('/save', Verifytoken, checkPermission('canGradePoint'), handler);
router.put('/:id', Verifytoken, checkPermission('canEditGrade'), handler);
router.get('/export/weekly', Verifytoken, checkPermission('canExportReport'), handler);
```

### Step 2: Frontend Pages

Cập nhật pages để sử dụng `useUserPermissions` hook:

```jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';

function AdminPage() {
  const { canGrade, canEditGrade, canExportReport } = useUserPermissions();
  
  // Render dựa trên permissions
}
```

### Step 3: Test

```bash
# Test với CODO
curl -H "Authorization: Bearer TOKEN" \
  -X POST http://localhost:8800/api/grading/save
# ✅ 200 OK

# Test với GVPT
curl -H "Authorization: Bearer TOKEN" \
  -X POST http://localhost:8800/api/grading/save
# ❌ 403 Forbidden
```

---

## 📊 Permission Matrix

```javascript
// Embedded in Middlewares/authorization.js
const PERMISSION_MATRIX = {
  admin: {
    canCreateAccount: true,
    canAssignRole: true,
    canDeleteStudent: true,
    canEditStudentInfo: true,
    canGradePoint: true,
    canEditGrade: true,
    canExportReport: true,
    // ... toàn bộ = true
  },
  codo: {
    canGradePoint: true,      ✅
    canEditGrade: true,        ✅
    canExportReport: true,     ✅
    // ... phần còn lại = false
  },
  gvpt: {
    canEditStudentInfo: true,  ✅
    // ... phần còn lại = false
    // canGradePoint: false,   ❌❌❌
  },
  student: {
    // toàn bộ = false
  }
};
```

---

## 📈 Lợi Ích Tái Sử D

ụng

✅ **Tối thiểu hóa thay đổi:** Không cần refactor cấu trúc backend  
✅ **An toàn:** Sử dụng Role model đã kiểm chứng  
✅ **Dễ bảo trì:** Chỉ cần cập nhật PERMISSION_MATRIX  
✅ **Hiệu suất:** Không query thêm, chỉ lookup Role bằng RoleId  
✅ **Scalable:** Dễ thêm role mới vào enum Role + PERMISSION_MATRIX  

---

## 🆘 Troubleshooting

### Q: Middleware không check quyền?

A: Kiểm tra xem route có import middleware?
```javascript
// ✅ Đúng
import { checkPermission } from '../Middlewares/authorization.js';
router.post('/save', Verifytoken, checkPermission('canGradePoint'), handler);

// ❌ Sai
router.post('/save', Verifytoken, handler);  // Quên middleware
```

### Q: Frontend hiển thị quyền sai?

A: Kiểm tra localStorage có chứa role.role không?
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('Role:', user?.role?.role);  // ✅ Phải là "codo", "admin", etc
```

### Q: 403 Forbidden từ API?

A: Middleware kiểm tra quyền đúng, bạn có thể không có quyền.
```javascript
// Kiểm tra Permission Matrix
// admin: canGradePoint = true ✅
// codo:  canGradePoint = true ✅
// gvpt:  canGradePoint = false ❌
```

---

## 📚 Tài Liệu Liên Quan

- `HUONG_DAN_PHAN_QUYEN.md` - Chi tiết quyền 3 nhóm  
- `HUONG_DAN_SU_DUNG_PHAN_QUYEN.md` - Frontend usage guide  
- `README_PHAN_QUYEN.md` - Quick start guide  
- `Frontend/src/utils/permissions.js` - Permission utils  
- `Backend/API/Middlewares/authorization.js` - Authorization middleware  

---

**Version:** 1.0  
**Status:** ✅ Ready for Integration  
**Last Updated:** 20/03/2026
