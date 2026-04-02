# 🔐 Hướng Dẫn Tích Hợp Phân Quyền vào Backend Routes

## I. Giới Thiệu

File này hướng dẫn cách tích hợp authorization middleware vào các routes backend để kiểm tra quyền người dùng.

---

## II. Cấu Trúc Thư Mục

```
Backend/API/
├── config/
│   └── permissions.js          # 🔧 Định nghĩa quyền cho từng role
├── Middlewares/
│   ├── errors.js
│   └── authorization.js        # 🔐 Middleware kiểm tra quyền
├── Routes/
│   ├── admin.js
│   ├── auth.js
│   ├── grading.js             # ⭐ Route chấm điểm cần authorization
│   ├── ...
├── Utils/
│   └── Verifytoken.js          # Middleware xác thực token
```

---

## III. Setup Ban Đầu

### Bước 1: Import Middleware

```javascript
// Backend/API/Routes/grading.js
const express = require('express');
const router = express.Router();

// Import middleware
const verifyToken = require('../Utils/Verifytoken');
const { checkPermission, checkGradingPermission } = require('../Middlewares/authorization');

// Import controller
const gradingController = require('../Controllers/grading');
```

### Bước 2: Thêm Kiểm Tra Quyền vào Route

```javascript
// ✅ Route chỉ CODO và Admin có thể chấm điểm
router.post(
  '/analyze',
  verifyToken,                        // 1. Xác thực token
  checkGradingPermission,             // 2. Kiểm tra quyền chấm điểm
  gradingController.analyze           // 3. Xử lý request
);

// ✅ Route chỉ CODO và Admin có thể lưu điểm
router.post(
  '/save',
  verifyToken,
  checkPermission('canGradePoint'),   // Sử dụng checkPermission với tên quyền
  gradingController.saveGrade
);
```

---

## IV. các Mẫu Sử Dụng Phổ Biến

### 1️⃣ Chấm Điểm (CODO + Admin)

```javascript
// ✅ CODO và Admin được phép
router.post('/grading/save', verifyToken, checkPermission('canGradePoint'), handler);
router.put('/grading/:id', verifyToken, checkPermission('canEditGrade'), handler);
```

### 2️⃣ Xuất Báo Cáo (CODO + Admin)

```javascript
// ✅ Chỉ CODO và Admin được phép
router.get('/grading/export/weekly', verifyToken, checkPermission('canExportReport'), handler);
router.get('/grading/export/monthly', verifyToken, checkPermission('canExportReport'), handler);
```

### 3️⃣ Sửa Thông Tin HS (Admin + GVPT)

```javascript
// ✅ Admin sửa được tất cả HS
// ✅ GVPT chỉ sửa được HS phòng mình
router.put('/user/:id', verifyToken, checkStudentEditPermission, handler);
```

### 4️⃣ Xóa HS (Chỉ Admin)

```javascript
// ✅ Chỉ Admin được phép
router.delete('/user/:id', verifyToken, checkAdminPermission, handler);
```

### 5️⃣ Tạo Tài Khoản (Chỉ Admin)

```javascript
// ✅ Chỉ Admin được phép
router.post('/account/create', verifyToken, checkAdminPermission, handler);
```

### 6️⃣ Xem Danh Sách (Moderation dựa trên role)

```javascript
// ✅ Tất cả đều xem được nhưng kết quả khác nhau:
// - Admin: xem tất cả HS
// - GVPT: xem HS phòng mình
// - Student: xem chỉ thông tin cá nhân
router.get('/students', verifyToken, handler);  // Không cần checkPermission

// Trong controller, lọc kết quả dựa trên role
const fetchStudents = (req, res) => {
  const userRole = req.user?.role?.toLowerCase();
  
  if (userRole === 'admin') {
    // Lấy tất cả HS
  } else if (userRole === 'gvpt') {
    // Lấy HS phòng mình
  } else if (userRole === 'student') {
    // Lấy thông tin cá nhân
  }
};
```

---

## V. Cập Nhật Các Routes Hiện Tại

### Bước 1: Routes Grading (Chấm Điểm)

```javascript
// Backend/API/Routes/grading.js (cần tạo mới)
const express = require('express');
const router = express.Router();
const verifyToken = require('../Utils/Verifytoken');
const { 
  checkPermission, 
  checkGradingPermission 
} = require('../Middlewares/authorization');
const gradingController = require('../Controllers/grading');

// Phân tích (CODO + Admin)
router.post('/analyze', verifyToken, checkGradingPermission, gradingController.analyze);

// Lưu điểm (CODO + Admin)
router.post('/save', verifyToken, checkPermission('canGradePoint'), gradingController.saveGrade);

// Sửa điểm (CODO + Admin)
router.put('/:id', verifyToken, checkPermission('canEditGrade'), gradingController.updateGrade);

// Xuất báo cáo (CODO + Admin)
router.get('/export/weekly', verifyToken, checkPermission('canExportReport'), gradingController.exportWeekly);
router.get('/export/monthly', verifyToken, checkPermission('canExportReport'), gradingController.exportMonthly);

// Xem lịch sử (Ai cũng xem được nhưng lọc dữ liệu)
router.get('/history/weekly', verifyToken, gradingController.getWeeklyHistory);

// Xóa bản ghi (Chỉ CODO + Admin)
router.delete('/:id', verifyToken, checkPermission('canEditGrade'), gradingController.deleteGrade);

module.exports = router;
```

### Bước 2: Routes User (Quản Lý Học Sinh)

```javascript
// Backend/API/Routes/Users.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../Utils/Verifytoken');
const {
  checkAdminPermission,
  checkPermission,
  checkStudentEditPermission
} = require('../Middlewares/authorization');
const userController = require('../Controllers/user');

// Lấy danh sách HS (Ai cũng xem được, lọc dữ liệu)
router.get('/', verifyToken, userController.getUsers);

// Tạo HS (Chỉ Admin)
router.post('/', verifyToken, checkAdminPermission, userController.createUser);

// Sửa thông tin HS (Admin + GVPT - chỉ HS phòng mình)
router.put('/:id', verifyToken, checkStudentEditPermission, userController.updateUser);

// Xóa HS (Chỉ Admin)
router.delete('/:id', verifyToken, checkAdminPermission, userController.deleteUser);

module.exports = router;
```

### Bước 3: Routes Tài Khoản

```javascript
// Backend/API/Routes/accounts.js (cần tạo mới)
const express = require('express');
const router = express.Router();
const verifyToken = require('../Utils/Verifytoken');
const { checkAdminPermission } = require('../Middlewares/authorization');
const accountController = require('../Controllers/account');

// Tạo tài khoản (Chỉ Admin)
router.post('/', verifyToken, checkAdminPermission, accountController.createAccount);

// Cấp mật khẩu (Chỉ Admin)
router.put('/:id/password', verifyToken, checkAdminPermission, accountController.resetPassword);

// Phân quyền (Chỉ Admin)
router.put('/:id/role', verifyToken, checkAdminPermission, accountController.assignRole);

module.exports = router;
```

### Bước 4: Mount Routes trong Index.js

```javascript
// Backend/API/Index.js
const express = require('express');
const app = express();

// ...existing code...

// Mount routes
app.use('/api/grading', require('./Routes/grading'));      // ⭐ Route chấm điểm
app.use('/api/users', require('./Routes/Users'));          // Route quản lý HS
app.use('/api/accounts', require('./Routes/accounts'));    // Route tài khoản
app.use('/api/auth', require('./Routes/auth'));
app.use('/api/dormitorys', require('./Routes/dormitorys'));
// ... routes khác

module.exports = app;
```

---

## VI. Xử Lý Lỗi trong Controller

Khi authorization middleware cho qua, controller không cần kiểm tra lại quyền, nhưng có thể log thông tin:

```javascript
// Backend/API/Controllers/grading.js
const saveGrade = async (req, res) => {
  try {
    // User đã được xác thực quyền bởi middleware
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Log hành động nhạy cảm
    console.log(`[GRADING] User ${userId} (${userRole}) saved grade for room ${req.body.roomId}`);
    
    // Xử lý lưu điểm
    const result = await Grading.create({
      ...req.body,
      createdBy: userId,
      supervisor: userRole
    });
    
    res.json({
      success: true,
      message: '✅ Lưu điểm thành công',
      data: result
    });
  } catch (error) {
    console.error('Error saving grade:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lưu điểm'
    });
  }
};

module.exports = { saveGrade };
```

---

## VII. Lọc Dữ liệu Dựa trên Role

### Ví Dụ: Lấy Danh Sách HS

```javascript
// Backend/API/Controllers/user.js
const getUsers = async (req, res) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    let query = {};
    
    if (userRole === 'admin') {
      // Admin thấy tất cả HS
      query = {};
    } else if (userRole === 'gvpt') {
      // GVPT chỉ thấy HS phòng mình
      const assignedRooms = req.user?.assignedRooms || [];
      query = { roomId: { $in: assignedRooms } };
    } else if (userRole === 'codo') {
      // CODO thấy tất cả nhưng không được chỉnh sửa
      query = {};
    } else if (userRole === 'student') {
      // Student chỉ thấy thông tin cá nhân
      query = { _id: req.user?.userId };
    }
    
    const users = await User.find(query);
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách HS'
    });
  }
};
```

---

## VIII. Testing API với Authorization

### Test với Postman

```bash
# Bước 1: Lấy Token (Đăng nhập)
POST http://localhost:8800/api/auth/login
{
  "username": "codo_user",
  "password": "password"
}
# Response: { token: "eyJhbGc..." }

# Bước 2: Chấm Điểm (Với Authorization)
POST http://localhost:8800/api/grading/save
Headers:
  Authorization: Bearer eyJhbGc...
Body:
{
  "roomId": "A5",
  "date": "2026-03-19",
  "violations": [...]
}
# Response: 200 OK - Thành công (nếu role là CODO/Admin)
#           403 Forbidden - Bị từ chối (nếu role là GVPT/Student)
```

---

## IX. Checklist Tích Hợp Phân Quyền

- [ ] Tạo file `Backend/API/config/permissions.js`
- [ ] Tạo/Cập nhật file `Backend/API/Middlewares/authorization.js`
- [ ] Cập nhật route grading để sử dụng middleware
- [ ] Cập nhật route user để sử dụng middleware
- [ ] Tạo route account với authorization
- [ ] Mount tất cả routes trong Index.js
- [ ] Test các endpoint với các role khác nhau
- [ ] Kiểm tra log để xác nhận authorization hoạt động
- [ ] Cập nhật tài liệu API
- [ ] Thông báo cho team về thay đổi

---

## X. Best Practices Backend

1. **Luôn kiểm tra quyền trên Backend**
   ```javascript
   // ✅ Luôn có middleware check
   router.post('/action', verifyToken, checkPermission('canAction'), handler);
   ```

2. **Log các hành động nhạy cảm**
   ```javascript
   console.log(`[ACTION] User ${userId} (${role}) did important action`);
   ```

3. **Lọc dữ liệu dựa trên role**
   ```javascript
   const query = userRole === 'admin' ? {} : { owner: userId };
   ```

4. **Trả về lỗi rõ ràng**
   ```javascript
   res.status(403).json({
     success: false,
     message: '❌ Bạn không có quyền'
   });
   ```

5. **Không dựa vào Frontend**
   ```javascript
   // ❌ KHÔNG làm cái này - Frontend có thể bypass
   // Luôn check trên Backend
   ```

---

## XI. Troubleshooting

### Vấn Đề: "❌ Bạn không có quyền" mặc dù có token

**Nguyên nhân:** Role trong token không đúng

**Giải pháp:**
```javascript
// Debug: In ra role từ token
console.log('User role:', req.user?.role);
// Kiểm tra lại quyền của role đó
```

### Vấn Đề: Middleware không được gọi

**Nguyên nhân:** Quên thêm middleware vào route

**Giải pháp:**
```javascript
// ❌ Lỗi - quên middleware
router.post('/action', handler);

// ✅ Đúng
router.post('/action', verifyToken, checkPermission('...'), handler);
```

### Vấn Đề: GVPT vẫn xóa được HS khác

**Nguyên nhân:** Không kiểm tra xem HS thuộc phòng mình không

**Giải pháp:**
```javascript
// Thêm check trong controller
if (userRole === 'gvpt') {
  const student = await User.findById(req.params.id);
  if (!req.user.assignedRooms.includes(student.roomId)) {
    return res.status(403).json({ message: 'Không quyền' });
  }
}
```

---

## XII. Support

📧 **Email:** dev@ktx.edu.vn  
📱 **Slack:** #dev-backend  

---

**Version:** 1.0  
**Updated:** 19/03/2026
