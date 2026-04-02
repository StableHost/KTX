# 👨‍💻 Hướng Dẫn Sử Dụng Hệ Thống Phân Quyền cho Developers

## I. Giới Thiệu

Hệ thống phân quyền hỗ trợ 3 vai trò: **Admin**, **BCH (Ban Chấp Hành Đoàn)**, **GVPT**, **Student**. Tài liệu này hướng dẫn developer cách tích hợp phân quyền vào các component và trang.

---

## II. Các File Liên Quan

| File | Mô Tả | Vị Trí |
|------|-------|--------|
| `permissions.js` | Định nghĩa role và quyền | `Frontend/src/utils/permissions.js` |
| `useUserPermissions.js` | Custom hook lấy thông tin quyền | `Frontend/src/hooks/useUserPermissions.js` |
| `PermissionControl.jsx` | Component kiểm tra quyền | `Frontend/src/components/PermissionControl/PermissionControl.jsx` |
| `KTXGradingPage.jsx` | Ví dụ đã tích hợp phân quyền | `Frontend/src/pages/Admin/KTXGradingPage.jsx` |

---

## III. Cách Sử Dụng Cơ Bản

### 1️⃣ Sử Dụng Function Kiểm Tra Quyền

```jsx
import { canGradePoint, canEditGrade, canExportReport } from '../../utils/permissions';

function MyComponent() {
  const userRole = JSON.parse(localStorage.getItem('currentUser'))?.details?.RoleId;

  if (canGradePoint(userRole)) {
    // Chỉ BCH và Admin thấy được
    return <button>Chấm Điểm</button>;
  }
  
  return <p>Bạn không có quyền chấm điểm</p>;
}
```

### 2️⃣ Sử Dụng Custom Hook (Cách Tốt Nhất)

```jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';

function MyComponent() {
  const { userRole, permissions, canGrade, canEditGrade } = useUserPermissions();

  // Sử dụng ngay từ hook, không cần kiểm tra localStorage
  return (
    <>
      {canGrade && <button>Chấm Điểm</button>}
      {canEditGrade && <button>Sửa Điểm</button>}
    </>
  );
}
```

### 3️⃣ Sử Dụng Component ProtectedFeature (Tái Sử Dụng)

```jsx
import { ProtectedFeature } from '../../components/PermissionControl/PermissionControl';
import { useUserPermissions } from '../../hooks/useUserPermissions';

function MyComponent() {
  const { userRole } = useUserPermissions();

  return (
    <ProtectedFeature
      userRole={userRole}
      requiredPermission="canGradePoint"
      fallback={<p>❌ Bạn không có quyền</p>}
    >
      <button>Chấm Điểm</button>
    </ProtectedFeature>
  );
}
```

---

## IV. Các Pattern Thường Dùng

### Pattern 1: Ẩn/Hiện Nút

```jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';

function GradingForm() {
  const { canGrade } = useUserPermissions();

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Ngôn ngữ tự nhiên" />
      
      {canGrade ? (
        <button type="submit">Phân tích và Lưu Điểm</button>
      ) : (
        <button type="button" disabled>
          Chấm Điểm (Chỉ BCH)
        </button>
      )}
    </form>
  );
}
```

### Pattern 2: Vô Hiệu Hóa Nút với Tooltip

```jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { Lock } from 'lucide-react';

function ActionButton() {
  const { canEditGrade } = useUserPermissions();

  return (
    <button
      disabled={!canEditGrade}
      title={!canEditGrade ? "Bạn không có quyền sửa điểm" : ""}
      className={!canEditGrade ? 'opacity-50 cursor-not-allowed' : ''}
    >
      {!canEditGrade && <Lock size={16} />}
      Sửa Điểm
    </button>
  );
}
```

### Pattern 3: Hiển Thị Cảnh Báo Quyền

```jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { PermissionDeniedAlert } from '../../components/PermissionControl/PermissionControl';

function AdminPanel() {
  const { permissions } = useUserPermissions();

  return (
    <>
      {!permissions.canGradePoint && (
        <PermissionDeniedAlert 
          feature="Chấm điểm thi đua"
          requiredRole="BCH hoặc Admin"
        />
      )}
      
      {/* Nội dung khác */}
    </>
  );
}
```

### Pattern 4: Hiển Thị Badge Vai Trò

```jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { RoleBadge } from '../../components/PermissionControl/PermissionControl';

function UserProfile() {
  const { userRole, userInfo } = useUserPermissions();

  return (
    <div className="profile-header">
      <h2>{userInfo?.details?.HoTen}</h2>
      <RoleBadge role={userRole} detailed={true} />
    </div>
  );
}
```

### Pattern 5: Điều Kiện Hiển Thị Cột Bảng

```jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';

function GradesTable({ data }) {
  const { permissions } = useUserPermissions();

  return (
    <table>
      <thead>
        <tr>
          <th>Phòng</th>
          <th>Điểm</th>
          {/* Chỉ BCH và Admin thấy cột này */}
          {permissions.canEditGrade && <th>Sửa Điểm</th>}
          {permissions.canDeleteStudent && <th>Xóa</th>}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id}>
            <td>{row.roomTitle}</td>
            <td>{row.score}</td>
            {permissions.canEditGrade && (
              <td>
                <button>Sửa</button>
              </td>
            )}
            {permissions.canDeleteStudent && (
              <td>
                <button>Xóa</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Pattern 6: Kiểm Tra Quyền Trước Thao Tác

```jsx
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { toast } from 'react-toastify';

function GradeEditor() {
  const { canEditGrade, userRole } = useUserPermissions();

  const handleSaveGrade = async () => {
    if (!canEditGrade) {
      toast.error('❌ Bạn không có quyền sửa điểm. Yêu cầu: BCH/Admin');
      return;
    }

    // Thực hiện logic lưu điểm
    try {
      // ...
      toast.success('✅ Lưu thành công');
    } catch (error) {
      toast.error('❌ Lỗi: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSaveGrade}>
      <input type="number" placeholder="Điểm" />
      <button type="submit" disabled={!canEditGrade}>
        Lưu
      </button>
    </form>
  );
}
```

---

## V. Các Hàm Utility (API Reference)

### permissions.js

```javascript
// Import
import {
  ROLES,
  PERMISSION_LEVELS,
  getPermissionsByRole,
  hasPermission,
  canGradePoint,
  canEditGrade,
  canEditStudentInfo,
  canDeleteStudent,
  canExportReport,
  canManageAllRooms,
  getActivePermissions,
  isAdmin,
  isCODO,
  isGVPT,
  isStudent,
  ROLE_DESCRIPTIONS,
  getRoleDescription
} from '../../utils/permissions';

// Ví dụ sử dụng
console.log(canGradePoint('codo')); // true
console.log(hasPermission('admin', 'canDeleteStudent')); // true
console.log(isGVPT('gvpt')); // true
console.log(getActivePermissions('codo')); 
// ['canGradePoint', 'canEditGrade', 'canExportReport']
```

### useUserPermissions Hook

```javascript
// Import
import { useUserPermissions } from '../../hooks/useUserPermissions';

// Trong Component
const {
  userRole,           // 'admin' | 'codo' | 'gvpt' | 'student'
  userInfo,           // { details: {...}, ... }
  permissions,        // { canGradePoint: true, ... }
  loading,            // boolean
  canGrade,           // boolean
  canEditGrade,       // boolean
  canEditStudentInfo, // boolean
  canDeleteStudent,   // boolean
  canExportReport,    // boolean
  canManageAllRooms,  // boolean
  canCreateAccount,   // boolean
  canAssignRole,      // boolean
  canManageUsers      // boolean
} = useUserPermissions();
```

### PermissionControl Components

```jsx
// Component: ProtectedFeature
<ProtectedFeature
  userRole="admin"
  requiredPermission="canGradePoint"
  fallback={<p>No access</p>}
>
  <button>Action</button>
</ProtectedFeature>

// Component: PermissionDeniedAlert
<PermissionDeniedAlert
  feature="Chấm điểm"
  requiredRole="BCH"
/>

// Component: RoleBadge
<RoleBadge role="codo" detailed={true} />
```

---

## VI. Tích Hợp vào Backend (API)

### Bước 1: Tạo Middleware Authorization

**File:** `Backend/API/Middlewares/authorization.js`

```javascript
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role?.toLowerCase() || 'student';
      
      // Import từ constants hoặc database
      const PERMISSION_LEVELS = {
        admin: { canGradePoint: true, canEditGrade: true, ... },
        codo: { canGradePoint: true, canEditGrade: true, ... },
        gvpt: { canGradePoint: false, canEditGrade: false, ... },
        student: { ... }
      };
      
      const permissions = PERMISSION_LEVELS[userRole];
      
      if (!permissions || !permissions[requiredPermission]) {
        return res.status(403).json({
          success: false,
          message: `❌ Quyền truy cập bị từ chối. Cần: ${requiredPermission}`
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

### Bước 2: Sử Dụng trong Routes

```javascript
// Backend/API/Routes/grading.js
const express = require('express');
const { gradingController } = require('../Controllers/grading');
const verifyToken = require('../Utils/Verifytoken');
const { checkPermission } = require('../Middlewares/authorization');

const router = express.Router();

// Chỉ BCH và Admin có thể chấm điểm
router.post(
  '/analyze',
  verifyToken,
  checkPermission('canGradePoint'),
  gradingController.analyze
);

router.post(
  '/save',
  verifyToken,
  checkPermission('canGradePoint'),
  gradingController.saveGrade
);

// Chỉ BCH và Admin có thể sửa điểm
router.put(
  '/:id',
  verifyToken,
  checkPermission('canEditGrade'),
  gradingController.updateGrade
);

// Chỉ BCH và Admin có thể xuất báo cáo
router.get(
  '/export/weekly',
  verifyToken,
  checkPermission('canExportReport'),
  gradingController.exportWeekly
);

// Bất kỳ ai có token hợp lệ đều có thể xem
router.get(
  '/history/weekly',
  verifyToken,
  gradingController.getWeeklyHistory
);

module.exports = router;
```

---

## VII. Testing Phân Quyền

### Test các hàm Permission

```javascript
// test/permissions.test.js
import { hasPermission, canGradePoint, isAdmin } from '../../utils/permissions';

describe('Permission Utils', () => {
  test('canGradePoint should return true for BCH', () => {
    expect(canGradePoint('codo')).toBe(true);
  });

  test('canGradePoint should return false for GVPT', () => {
    expect(canGradePoint('gvpt')).toBe(false);
  });

  test('isAdmin should identify admin role', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('codo')).toBe(false);
  });
});
```

### Test Component ProtectedFeature

```javascript
import { render, screen } from '@testing-library/react';
import { ProtectedFeature } from '../../components/PermissionControl/PermissionControl';

describe('ProtectedFeature', () => {
  test('should show children when user has permission', () => {
    render(
      <ProtectedFeature
        userRole="codo"
        requiredPermission="canGradePoint"
      >
        <button>Grade Point</button>
      </ProtectedFeature>
    );
    expect(screen.getByText('Grade Point')).toBeInTheDocument();
  });

  test('should show fallback when user does not have permission', () => {
    render(
      <ProtectedFeature
        userRole="gvpt"
        requiredPermission="canGradePoint"
        fallback={<p>No access</p>}
      >
        <button>Grade Point</button>
      </ProtectedFeature>
    );
    expect(screen.getByText('No access')).toBeInTheDocument();
  });
});
```

---

## VIII. Best Practices

### ✅ Làm tốt

1. **Luôn kiểm tra quyền trên cả Frontend và Backend**
   ```jsx
   // Frontend: Check before showing
   {canGradePoint(userRole) && <button />}
   
   // Backend: Check before processing
   router.post('/grading/save', verifyToken, checkPermission('canGradePoint'), handler);
   ```

2. **Sử dụng Custom Hook để tránh lặp code**
   ```jsx
   const { canGrade } = useUserPermissions(); // Tốt
   // thay vì:
   const userRole = JSON.parse(...); // Dùng lặp mà không reusable
   ```

3. **Hiển thị thông báo lỗi rõ ràng**
   ```jsx
   toast.error('❌ Bạn không có quyền: ' + requiredRole);
   ```

4. **Ghi log các hành động nhạy cảm**
   ```javascript
   console.log(`User ${userId} (${role}) attempted to grade room ${roomId}`);
   ```

### ❌ Tránh

1. **Chỉ kiểm tra quyền trên Frontend**
   ```jsx
   // ❌ Rất nguy hiểm - dễ bypass
   if (userRole === 'admin') { ... }
   ```

2. **Lưu quyền plaintext trong localStorage**
   ```jsx
   // ❌ KHÔNG làm
   localStorage.setItem('userRole', 'admin'); // Dễ giả mạo
   ```

3. **Quên check quyền trên một số endpoint**
   ```javascript
   // ❌ Nguy hiểm
   router.post('/grading/delete', handler); // Không có authorization
   ```

4. **Để hardcode role**
   ```jsx
   // ❌ Không linh hoạt
   if (userRole === 'codo') { ... }
   
   // ✅ Tốt hơn
   if (canGradePoint(userRole)) { ... }
   ```

---

## IX. Thêm Quyền Mới

Nếu cần thêm quyền mới:

### Bước 1: Thêm vào permissions.js

```javascript
// Frontend/src/utils/permissions.js
export const PERMISSION_LEVELS = {
  admin: {
    // Quyền mới
    canManagePayment: true,
    ...
  },
  codo: {
    canManagePayment: false,
    ...
  }
};

// Thêm function helper
export const canManagePayment = (userRole) => {
  return hasPermission(userRole, 'canManagePayment');
};
```

### Bước 2: Cập nhật Hook

```javascript
// Frontend/src/hooks/useUserPermissions.js
export const useUserPermissions = () => {
  return {
    ...
    canManagePayment: permissions.canManagePayment
  };
};
```

### Bước 3: Sử dụng trong Component

```jsx
const { canManagePayment } = useUserPermissions();

if (canManagePayment) {
  return <PaymentPanel />;
}
```

---

## X. FAQ (Câu Hỏi Thường Gặp)

**Q: Làm sao lấy role của user hiện tại?**  
A: Sử dụng hook `useUserPermissions()`:
```jsx
const { userRole } = useUserPermissions();
```

**Q: Làm sao kiểm tra quyền sửa điểm?**  
A: 
```jsx
import { canEditGrade } from '../../utils/permissions';
if (canEditGrade(userRole)) { ... }
```

**Q: Tôi có thể tự sửa localStorage để giả mạo role không?**  
A: Có thể sửa Frontend nhưng Backend sẽ kiểm tra token JWT nên vẫn không được. Backend là nơi kiểm tra cuối cùng!

**Q: Ai là người cấp quyền cho các role khác?**  
A: Chỉ Admin có quyền tạo tài khoản và phân quyền.

**Q: Có thể thay đổi quyền của role sau khi tạo không?**  
A: Có, sửa trong `permissions.js` và redeploy. Hoặc lưu vào database để quản lý động.

---

## XI. Support

📧 **Email:** dev@ktx.edu.vn  
📱 **Slack:** #dev-ktx  
📚 **Wiki:** docs.ktx.edu.vn/permissions

---

**Version:** 1.0  
**Updated:** 19/03/2026  
**Author:** Admin Team
