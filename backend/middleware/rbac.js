/**
 * Role-Based Access Control Middleware
 *
 * Usage:
 *   router.get('/', verifyToken, rbac('patients', 'read'), controller)
 *   router.post('/', verifyToken, rbac('patients', 'write'), controller)
 *
 * 'read' = can view the resource
 * 'write' = can create / edit / delete the resource
 */

const permissions = {
  // resource: { role: [actions] }
  patients: {
    admin:        ['read', 'write'],
    doctor:       ['read', 'write'],
    nurse:        ['read', 'write'],
    receptionist: ['read', 'write'],
  },
  appointments: {
    admin:        ['read', 'write'],
    doctor:       ['read', 'write'],
    nurse:        ['read', 'write'],
    receptionist: ['read', 'write'],
  },
  'medical-records': {
    admin:  ['read', 'write'],
    doctor: ['read', 'write'],
    nurse:  ['read'],
  },
  prescriptions: {
    admin:  ['read', 'write'],
    doctor: ['read', 'write'],
  },
  'lab-results': {
    admin:  ['read', 'write'],
    doctor: ['read', 'write'],
    nurse:  ['read'],
  },
  billing: {
    admin:        ['read', 'write'],
    receptionist: ['read', 'write'],
  },
  inventory: {
    admin: ['read', 'write'],
    nurse: ['read', 'write'],
  },
  staff: {
    admin: ['read', 'write'],
  },
  'access-control': {
    admin: ['read', 'write'],
  },
  reports: {
    admin:  ['read'],
    doctor: ['read'],
  },
};

export function rbac(resource, action = 'read') {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return res.status(403).json({ message: 'Role not identified' });
    }

    const resourcePerms = permissions[resource];

    if (!resourcePerms) {
      return res.status(500).json({ message: `Unknown resource: ${resource}` });
    }

    const rolePerms = resourcePerms[role];

    if (!rolePerms || !rolePerms.includes(action)) {
      return res.status(403).json({
        message: `Access denied: ${role} cannot ${action} ${resource}`
      });
    }

    next();
  };
}

// Get all permissions for frontend rendering
export function getAllPermissions() {
  return permissions;
}
