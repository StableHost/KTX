/**
 * Permission Management Utilities
 * Quản lý phân quyền cho các chức năng của hệ thống KTX
 */

export const ROLES = {
  ADMIN: 'admin',
  GVPT: 'gvpt', // Giáo viên phụ trách
  BCH: 'bch',  // Ban Chấp Hành Đoàn
  STUDENT: 'student'
};

export const PERMISSION_LEVELS = {
  // Admin quyền
  ADMIN: {
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
  
  // BCH (Ban Chấp Hành Đoàn) quyền
  BCH: {
    canCreateAccount: false,
    canAssignRole: false,
    canDeleteStudent: false,
    canEditStudentInfo: false,
    canManageAllRooms: false,
    canGradePoint: true,        // ✓ Chấm điểm
    canEditGrade: true,         // ✓ Sửa điểm vi phạm
    canExportReport: true,      // ✓ Xuất báo cáo nền nếp tuần
    canManageUsers: false,
    canManageAccountCreation: false
  },
  
  // GVPT (Giáo viên phụ trách) quyền
  GVPT: {
    canCreateAccount: false,
    canAssignRole: false,
    canDeleteStudent: false,    // ✗ Không được xóa
    canEditStudentInfo: true,   // ✓ Chỉnh sửa thông tin cá nhân HS phòng mình
    canManageAllRooms: false,   // Chỉ xem phòng phụ trách
    canGradePoint: false,       // ✗ Không được chấm điểm
    canEditGrade: false,        // ✗ Không được sửa điểm
    canExportReport: false,     // ✗ Không được xuất báo cáo
    canManageUsers: false,
    canManageAccountCreation: false
  },
  
  // Student quyền
  STUDENT: {
    canCreateAccount: false,
    canAssignRole: false,
    canDeleteStudent: false,
    canEditStudentInfo: false,  // Chỉ xem thông tin cá nhân
    canManageAllRooms: false,
    canGradePoint: false,
    canEditGrade: false,
    canExportReport: false,
    canManageUsers: false,
    canManageAccountCreation: false
  }
};

/**
 * Lấy quyền của người dùng dựa trên role
 * @param {string} role - Vai trò người dùng (admin, gvpt, bch, student)
 * @returns {object} Đối tượng chứa các quyền
 */
export const getPermissionsByRole = (role) => {
  return PERMISSION_LEVELS[role?.toUpperCase()] || PERMISSION_LEVELS.STUDENT;
};

/**
 * Kiểm tra xem người dùng có quyền thực hiện chức năng không
 * @param {string} userRole - Vai trò người dùng
 * @param {string} action - Tên chức năng cần kiểm tra
 * @returns {boolean} True nếu có quyền, False nếu không
 */
export const hasPermission = (userRole, action) => {
  const permissions = getPermissionsByRole(userRole);
  return permissions[action] === true;
};

/**
 * Kiểm tra xem người dùng có thể chấm điểm không
 * @param {string} userRole - Vai trò người dùng
 * @returns {boolean}
 */
export const canGradePoint = (userRole) => {
  return hasPermission(userRole, 'canGradePoint');
};

/**
 * Kiểm tra xem người dùng có thể sửa điểm không
 * @param {string} userRole - Vai trò người dùng
 * @returns {boolean}
 */
export const canEditGrade = (userRole) => {
  return hasPermission(userRole, 'canEditGrade');
};

/**
 * Kiểm tra xem người dùng có thể sửa thông tin HS không
 * @param {string} userRole - Vai trò người dùng
 * @returns {boolean}
 */
export const canEditStudentInfo = (userRole) => {
  return hasPermission(userRole, 'canEditStudentInfo');
};

/**
 * Kiểm tra xem người dùng có thể xóa HS không
 * @param {string} userRole - Vai trò người dùng
 * @returns {boolean}
 */
export const canDeleteStudent = (userRole) => {
  return hasPermission(userRole, 'canDeleteStudent');
};

/**
 * Kiểm tra xem người dùng có thể xuất báo cáo không
 * @param {string} userRole - Vai trò người dùng
 * @returns {boolean}
 */
export const canExportReport = (userRole) => {
  return hasPermission(userRole, 'canExportReport');
};

/**
 * Kiểm tra xem người dùng có thể quản lý tất cả phòng không
 * @param {string} userRole - Vai trò người dùng
 * @returns {boolean}
 */
export const canManageAllRooms = (userRole) => {
  return hasPermission(userRole, 'canManageAllRooms');
};

/**
 * Lấy danh sách các quyền mà người dùng có
 * @param {string} userRole - Vai trò người dùng
 * @returns {array} Mảng tên các quyền
 */
export const getActivePermissions = (userRole) => {
  const permissions = getPermissionsByRole(userRole);
  return Object.keys(permissions).filter(key => permissions[key] === true);
};

/**
 * Kiểm tra xem role có phải là Admin không
 * @param {string} role - Vai trò người dùng
 * @returns {boolean}
 */
export const isAdmin = (role) => {
  return role?.toLowerCase() === ROLES.ADMIN;
};

/**
 * Kiểm tra xem role có phải là BCH không
 * @param {string} role - Vai trò người dùng
 * @returns {boolean}
 */
export const isBCH = (role) => {
  return role?.toLowerCase() === ROLES.BCH;
};

/**
 * Kiểm tra xem role có phải là GVPT không
 * @param {string} role - Vai trò người dùng
 * @returns {boolean}
 */
export const isGVPT = (role) => {
  return role?.toLowerCase() === ROLES.GVPT;
};

/**
 * Kiểm tra xem role có phải là Student không
 * @param {string} role - Vai trò người dùng
 * @returns {boolean}
 */
export const isStudent = (role) => {
  return role?.toLowerCase() === ROLES.STUDENT;
};

/**
 * Mô tả các vai trò cho giao diện
 */
export const ROLE_DESCRIPTIONS = {
  admin: {
    name: 'Quản trị viên',
    description: 'Toàn quyền quản lý hệ thống',
    color: '#dc2626', // Red
    bgColor: '#fee2e2'
  },
  bch: {
    name: 'Ban Chấp Hành Đoàn',
    description: 'Chấm điểm, sửa vi phạm',
    color: '#1d4ed8', // Blue
    bgColor: '#dbeafe'
  },
  gvpt: {
    name: 'Giáo viên phụ trách',
    description: 'Quản lý phòng mình',
    color: '#16a34a', // Green
    bgColor: '#dcfce7'
  },
  student: {
    name: 'Học sinh',
    description: 'Xem thông tin cá nhân',
    color: '#7c3aed', // Purple
    bgColor: '#f3e8ff'
  }
};

/**
 * Lấy thông tin mô tả role
 * @param {string} role - Vai trò
 * @returns {object} Thông tin role
 */
export const getRoleDescription = (role) => {
  return ROLE_DESCRIPTIONS[role?.toLowerCase()] || ROLE_DESCRIPTIONS.student;
};
