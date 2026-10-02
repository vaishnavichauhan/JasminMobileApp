/**
 * Auth & Role Helper Utilities
 */

export const getUserRole = (user: any): string => {
  if (!user) return '';
  return String(
    user.role ||
    user.user_role ||
    user.role_name ||
    user.type ||
    user.roleName ||
    user.user_type ||
    user.type_name ||
    ''
  ).trim();
};

/**
 * Checks if the current user has Admin privileges
 * Admin Rule: user.role === 'admin' | 'super admin', or isAdmin === true, or is_admin === true
 */
export const isUserAdmin = (user: any): boolean => {
  if (!user) return false;
  if (
    user.isAdmin === true ||
    user.is_admin === true ||
    user.isSuperAdmin === true ||
    user.is_super_admin === true
  ) {
    return true;
  }
  const roleStr = getUserRole(user).toLowerCase();

  return (
    roleStr === 'admin' ||
    roleStr === 'super admin' ||
    roleStr === 'superadmin' ||
    roleStr === 'administrator' ||
    roleStr === '1'
  );
};

/**
 * Checks if the current user has ABM privileges
 * ABM Rule: user.role === 'abm', or user_role === 'abm', or isAbm === true
 */
export const isUserAbm = (user: any): boolean => {
  if (!user) return false;
  if (user.isAbm === true || user.is_abm === true) {
    return true;
  }
  const roleStr = getUserRole(user).toLowerCase();
  return roleStr === 'abm';
};

/**
 * Checks if user is permitted to view ABM Wise Report in Special TVA
 * Permission Rule:
 * - Admin or ABM user role can view
 * - Other user roles cannot view
 */
export const canUserViewAbmWiseReport = (user: any, userContext?: any): boolean => {
  if (userContext) {
    if (userContext.can_view_abm_tab !== undefined) {
      return Boolean(userContext.can_view_abm_tab);
    }
    if (userContext.is_admin || userContext.is_abm) {
      return true;
    }
  }
  return isUserAdmin(user) || isUserAbm(user);
};

/**
 * Checks if an error or message is an Access Denied / 403 Forbidden error
 */
export const isAccessDeniedError = (err: any): boolean => {
  if (!err) return false;
  if (err.status === 403 || err.statusCode === 403 || err.isAccessDenied === true) {
    return true;
  }
  const msg = String(err.message || err.error || err || '').toLowerCase();
  return (
    msg.includes('access denied') ||
    msg.includes('not authorized') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('permission') ||
    msg.includes('do not have permission') ||
    msg.includes('403')
  );
};
