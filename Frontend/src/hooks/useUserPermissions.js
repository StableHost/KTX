import { useEffect, useState } from 'react';
import { getPermissionsByRole, ROLES } from '../utils/permissions';

/**
 * Custom Hook để lấy thông tin quyền người dùng
 * @returns {object} Đối tượng chứa userRole, permissions, user info
 */
export const useUserPermissions = () => {
  const [userRole, setUserRole] = useState(ROLES.STUDENT);
  const [userInfo, setUserInfo] = useState(null);
  const [permissions, setPermissions] = useState(getPermissionsByRole(ROLES.STUDENT));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser) {
        // Tái sử dụng role.role từ backend login response
        const role = currentUser.role?.role?.toLowerCase() || 
                     currentUser.details?.role?.toLowerCase() || 
                     'student';
        setUserRole(role);
        setUserInfo(currentUser);
        setPermissions(getPermissionsByRole(role));
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    userRole,
    userInfo,
    permissions,
    loading,
    canGrade: permissions.canGradePoint,
    canEditGrade: permissions.canEditGrade,
    canEditStudentInfo: permissions.canEditStudentInfo,
    canDeleteStudent: permissions.canDeleteStudent,
    canExportReport: permissions.canExportReport,
    canManageAllRooms: permissions.canManageAllRooms,
    canCreateAccount: permissions.canCreateAccount,
    canAssignRole: permissions.canAssignRole,
    canManageUsers: permissions.canManageUsers
  };
};

/**
 * Custom Hook để kiểm tra một quyền cụ thể
 * @param {string} requiredPermission - Tên quyền cần kiểm tra
 * @returns {boolean} True nếu có quyền
 */
export const useHasPermission = (requiredPermission) => {
  const { permissions } = useUserPermissions();
  return permissions[requiredPermission] === true;
};
