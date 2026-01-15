// Role-based permissions configuration for LMS

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CONTENT_MANAGER: 'content_manager',
  INSTRUCTOR: 'instructor',
  SUPPORT_STAFF: 'support_staff',
  FINANCE_MANAGER: 'finance_manager'
};

const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  
  // Courses
  VIEW_COURSES: 'view_courses',
  CREATE_COURSE: 'create_course',
  EDIT_COURSE: 'edit_course',
  DELETE_COURSE: 'delete_course',
  
  // Users
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  DISABLE_USER: 'disable_user',
  
  // Orders
  VIEW_ORDERS: 'view_orders',
  MANAGE_ORDERS: 'manage_orders',
  
  // Contacts
  VIEW_CONTACTS: 'view_contacts',
  DELETE_CONTACTS: 'delete_contacts',
  
  // Certificates
  VIEW_CERTIFICATES: 'view_certificates',
  MANAGE_CERTIFICATES: 'manage_certificates',
  
  // Badges
  VIEW_BADGES: 'view_badges',
  MANAGE_BADGES: 'manage_badges',
  
  // Drive
  VIEW_DRIVE: 'view_drive',
  UPLOAD_FILES: 'upload_files',
  DELETE_FILES: 'delete_files',
  
  // Activity Logs
  VIEW_ACTIVITY: 'view_activity',
  
  // Roles & Permissions
  VIEW_ROLES: 'view_roles',
  MANAGE_ROLES: 'manage_roles',
  
  // Gallery
  VIEW_GALLERY: 'view_gallery',
  MANAGE_GALLERY: 'manage_gallery',
  
  // Coupons
  VIEW_COUPONS: 'view_coupons',
  MANAGE_COUPONS: 'manage_coupons'
};

// Define what each role can do
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Full access to everything
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.EDIT_COURSE,
    PERMISSIONS.DELETE_COURSE,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.DISABLE_USER,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_CONTACTS,
    PERMISSIONS.DELETE_CONTACTS,
    PERMISSIONS.VIEW_CERTIFICATES,
    PERMISSIONS.MANAGE_CERTIFICATES,
    PERMISSIONS.VIEW_BADGES,
    PERMISSIONS.MANAGE_BADGES,
    PERMISSIONS.VIEW_DRIVE,
    PERMISSIONS.UPLOAD_FILES,
    PERMISSIONS.DELETE_FILES,
    PERMISSIONS.VIEW_ACTIVITY,
    PERMISSIONS.VIEW_ROLES,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_GALLERY,
    PERMISSIONS.MANAGE_GALLERY,
    PERMISSIONS.VIEW_COUPONS,
    PERMISSIONS.MANAGE_COUPONS
  ],
  
  [ROLES.CONTENT_MANAGER]: [
    // Can manage courses, certificates, badges, and drive
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.EDIT_COURSE,
    PERMISSIONS.DELETE_COURSE,
    PERMISSIONS.VIEW_CERTIFICATES,
    PERMISSIONS.MANAGE_CERTIFICATES,
    PERMISSIONS.VIEW_BADGES,
    PERMISSIONS.MANAGE_BADGES,
    PERMISSIONS.VIEW_DRIVE,
    PERMISSIONS.UPLOAD_FILES,
    PERMISSIONS.DELETE_FILES,
    PERMISSIONS.VIEW_GALLERY,
    PERMISSIONS.MANAGE_GALLERY,
    PERMISSIONS.VIEW_CONTACTS,
    PERMISSIONS.VIEW_USERS // Read-only
  ],
  
  [ROLES.INSTRUCTOR]: [
    // Can manage own courses and view students
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.EDIT_COURSE,
    PERMISSIONS.VIEW_USERS, // View students
    PERMISSIONS.VIEW_CERTIFICATES,
    PERMISSIONS.VIEW_DRIVE,
    PERMISSIONS.UPLOAD_FILES
  ],
  
  [ROLES.SUPPORT_STAFF]: [
    // Can manage users and contacts
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.VIEW_CONTACTS,
    PERMISSIONS.DELETE_CONTACTS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  
  [ROLES.FINANCE_MANAGER]: [
    // Can manage orders and view dashboard
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_USERS, // Read-only
    PERMISSIONS.VIEW_ACTIVITY,
    PERMISSIONS.VIEW_COUPONS,
    PERMISSIONS.MANAGE_COUPONS
  ]
};

// Helper function to check if a role has a permission
function hasPermission(role, permission) {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Get all permissions for a role
function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

// Get role display name
function getRoleDisplayName(role) {
  const displayNames = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.CONTENT_MANAGER]: 'Content Manager',
    [ROLES.INSTRUCTOR]: 'Instructor',
    [ROLES.SUPPORT_STAFF]: 'Support Staff',
    [ROLES.FINANCE_MANAGER]: 'Finance Manager'
  };
  return displayNames[role] || role;
}

// Get role description
function getRoleDescription(role) {
  const descriptions = {
    [ROLES.SUPER_ADMIN]: 'Full access to all features and settings',
    [ROLES.CONTENT_MANAGER]: 'Manage courses, certificates, badges, and content library',
    [ROLES.INSTRUCTOR]: 'Create and manage courses, view students',
    [ROLES.SUPPORT_STAFF]: 'Manage users, handle support requests and contacts',
    [ROLES.FINANCE_MANAGER]: 'Manage orders, payments, and financial reports'
  };
  return descriptions[role] || '';
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
  getRoleDisplayName,
  getRoleDescription
};
