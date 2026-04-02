/**
 * Authorization Middleware - Tái sử dụng Role model hiện tại
 * Kiểm tra quyền của người dùng trước khi thực hiện request
 * 
 * Cách sử dụng:
 * router.post('/action', Verifytoken, checkPermission('canGradePoint'), controller);
 * 
 * Vai trò hỗ trợ:
 * - admin: Quản trị viên (toàn quyền)
 * - bch: Ban Chấp Hành Đoàn - BCH (chấm điểm, sửa vi phạm)
 * - gvpt: Giáo viên phụ trách (quản lý phòng mình)
 * - student: Học sinh (xem thông tin cá nhân)
 */

import Role from '../Models/Role.js';
import Accounts from '../Models/Account.js';
import { createError } from '../Utils/Error.js';

// Permission mapping cho mỗi role
const PERMISSION_MATRIX = {
  admin: {
    canCreateAccount: true,
    canAssignRole: true,
    canDeleteStudent: true,
    canEditStudentInfo: true,
    canManageAllRooms: true,
    canGradePoint: true,
    canEditGrade: true,
    canExportReport: true,
    canManageUsers: true,
    canManageAccountCreation: true
  },
  bch: {
    canCreateAccount: false,
    canAssignRole: false,
    canDeleteStudent: false,
    canEditStudentInfo: false,
    canManageAllRooms: false,
    canGradePoint: true,
    canEditGrade: true,
    canExportReport: true,
    canManageUsers: false,
    canManageAccountCreation: false
  },
  gvpt: {
    canCreateAccount: false,
    canAssignRole: false,
    canDeleteStudent: false,
    canEditStudentInfo: true,
    canManageAllRooms: false,
    canGradePoint: false,
    canEditGrade: false,
    canExportReport: false,
    canManageUsers: false,
    canManageAccountCreation: false
  },
  student: {
    canCreateAccount: false,
    canAssignRole: false,
    canDeleteStudent: false,
    canEditStudentInfo: false,
    canManageAllRooms: false,
    canGradePoint: false,
    canEditGrade: false,
    canExportReport: false,
    canManageUsers: false,
    canManageAccountCreation: false
  }
};

/**
 * Middleware kiểm tra quyền chung - Tái sử dụng Role model từ database
 * @param {string} requiredPermission - Tên quyền cần kiểm tra
 * @returns {function} Middleware function
 */
export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Lấy RoleId từ JWT token (được set bởi Verifytoken middleware)
      const roleId = req.account?.RoleId;
      
      if (!roleId) {
        return res.status(403).json({
          success: false,
          message: '❌ Không tìm thấy thông tin role'
        });
      }

      // Lấy role từ database dựa trên RoleId
      const roleDoc = await Role.findById(roleId);
      if (!roleDoc) {
        return res.status(403).json({
          success: false,
          message: '❌ Role không hợp lệ'
        });
      }

      const roleString = roleDoc.role.toLowerCase(); // 'admin', 'bch', 'gvpt', 'student'
      const permissions = PERMISSION_MATRIX[roleString];

      if (!permissions || !permissions[requiredPermission]) {
        return res.status(403).json({
          success: false,
          message: `❌ Bạn không có quyền thực hiện chức năng này (${requiredPermission}). Vai trò hiện tại: ${roleString}`
        });
      }

      // Lưu thông tin role vào req để dùng trong controller
      req.userRole = roleString;
      req.userPermissions = permissions;
      
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

/**
 * Middleware kiểm tra quyền CODO (Ban chấp hành) - Chấm điểm
 */
export const checkCODOPermission = (req, res, next) => {
  return checkPermission('canGradePoint')(req, res, next);
};

/**
 * Middleware kiểm tra quyền lấy role string từ JWT
 * Tái sử dụng VerifyAdmin hiện tại nhưng thêm role string vào req
 */
export const getRoleFromToken = async (req, res, next) => {
  try {
    const roleId = req.account?.RoleId;
    
    if (roleId) {
      const roleDoc = await Role.findById(roleId);
      if (roleDoc) {
        req.userRole = roleDoc.role.toLowerCase();
      }
    }
    
    next();
  } catch (error) {
    console.error('Error getting role:', error);
    next();
  }
};

export default { checkPermission, checkCODOPermission, getRoleFromToken };
