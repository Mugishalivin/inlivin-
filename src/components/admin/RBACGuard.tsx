import React, { ReactNode } from 'react';

// Define granular permissions for the ilivin system
export type AdminPermission = 
  | 'manage_users' 
  | 'moderate_content' 
  | 'view_analytics' 
  | 'system_config' 
  | 'terminate_sessions';

interface RBACGuardProps {
  requiredPermission: AdminPermission;
  userPermissions: AdminPermission[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * RBACGuard ensures only admins with the correct granular permissions
 * can see or interact with specific UI modules.
 */
export const RBACGuard: React.FC<RBACGuardProps> = ({
  requiredPermission,
  userPermissions,
  children,
  fallback = null,
}) => {
  const hasAccess = userPermissions.includes(requiredPermission);

  if (!hasAccess) {
    return (
      <>
        {fallback || (
          <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
            Insufficient permissions to access this module.
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};