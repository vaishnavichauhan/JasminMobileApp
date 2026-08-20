/**
 * Auth & Role Helper Utilities
 */

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
  const roleStr = String(
    user.role ||
    user.user_role ||
    user.role_name ||
    user.type ||
    user.roleName ||
    ''
  )
    .toLowerCase()
    .trim();

  return (
    roleStr === 'admin' ||
    roleStr === 'super admin' ||
    roleStr === 'superadmin' ||
    roleStr === 'administrator' ||
    roleStr === '1'
  );
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
