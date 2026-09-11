const ADMIN_ONLY = ['admin'];
const MANAGE_ROLES = ['admin', 'warehouse_manager'];
const STAFF_WRITE_ROLES = ['admin', 'warehouse_manager', 'warehouse_staff'];
const ALL_ROLES = ['admin', 'warehouse_manager', 'warehouse_staff', 'report_viewer'];

module.exports = { ADMIN_ONLY, MANAGE_ROLES, STAFF_WRITE_ROLES, ALL_ROLES };
