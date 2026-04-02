import React from 'react';
import { AlertCircle } from 'lucide-react';
import { hasPermission } from '../../utils/permissions';

/**
 * Component kiểm tra quyền trước khi hiển thị
 * Ẩn toàn bộ component nếu người dùng không có quyền
 */
export const ProtectedFeature = ({ 
  userRole, 
  requiredPermission, 
  children,
  fallback = null 
}) => {
  if (!hasPermission(userRole, requiredPermission)) {
    return fallback;
  }
  
  return children;
};

/**
 * Component vô hiệu hóa button dựa trên quyền
 * Button vẫn hiển thị nhưng không thể click nếu không có quyền
 */
export const ProtectedButton = ({
  userRole,
  requiredPermission,
  onClick,
  children,
  className = '',
  title = '',
  ...props
}) => {
  const hasAccess = hasPermission(userRole, requiredPermission);
  
  const handleClick = (e) => {
    if (!hasAccess) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={!hasAccess}
      className={`${className} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!hasAccess ? `Bạn không có quyền thực hiện chức năng này` : title}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Component hiển thị thông báo quyền bị từ chối
 */
export const PermissionDeniedAlert = ({ 
  feature, 
  requiredRole = null 
}) => {
  return (
    <div className="permission-denied-alert">
      <AlertCircle size={20} className="icon-warning" />
      <div className="alert-content">
        <h4>❌ Quyền bị từ chối</h4>
        <p>
          {feature ? `Bạn không có quyền thực hiện: ${feature}` : 'Bạn không có quyền truy cập tính năng này'}
        </p>
        {requiredRole && (
          <p className="required-role">
            Yêu cầu quyền: <strong>{requiredRole}</strong>
          </p>
        )}
      </div>
      <style jsx>{`
        .permission-denied-alert {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin-bottom: 20px;
          align-items: flex-start;
        }
        
        .icon-warning {
          color: #dc2626;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .alert-content {
          flex: 1;
        }
        
        .alert-content h4 {
          margin: 0 0 5px 0;
          color: #991b1b;
          font-size: 0.95rem;
        }
        
        .alert-content p {
          margin: 0 0 5px 0;
          color: #7f1d1d;
          font-size: 0.9rem;
        }
        
        .required-role {
          margin-top: 8px !important;
          font-size: 0.85rem !important;
        }
      `}</style>
    </div>
  );
};

/**
 * Thẻ hiển thị role của người dùng
 */
export const RoleBadge = ({ role, detailed = false }) => {
  const roleInfo = {
    admin: { label: 'Admin', color: '#dc2626', bg: '#fee2e2' },
    bch: { label: 'BCH', color: '#1d4ed8', bg: '#dbeafe' },
    gvpt: { label: 'GVPT', color: '#16a34a', bg: '#dcfce7' },
    student: { label: 'Học sinh', color: '#7c3aed', bg: '#f3e8ff' }
  };
  
  const info = roleInfo[role?.toLowerCase()] || roleInfo.student;
  
  return (
    <span
      className="role-badge"
      style={{
        color: info.color,
        backgroundColor: info.bg,
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 600,
        display: 'inline-block'
      }}
      title={detailed ? `Quyền: ${role}` : undefined}
    >
      {info.label}
    </span>
  );
};
