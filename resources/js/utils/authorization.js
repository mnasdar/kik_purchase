/**
 * Authorization Utilities - JavaScript
 * Helper functions untuk authorization di client-side
 */

/**
 * Check if user has permission (gunakan untuk hidden/show elements)
 * @param {string|array} permission - Permission atau array permissions
 * @param {array} userPermissions - User permissions dari server
 * @returns {boolean}
 */
export function hasPermission(permission, userPermissions = []) {
    if (!permission || userPermissions.length === 0) return false;

    const permissions = Array.isArray(permission) ? permission : [permission];
    
    return permissions.some(p => 
        userPermissions.some(up => up.name === p || up.id === p)
    );
}

/**
 * Check if user has all permissions
 * @param {array} permissions - Permissions to check
 * @param {array} userPermissions - User permissions dari server
 * @returns {boolean}
 */
export function hasAllPermissions(permissions, userPermissions = []) {
    if (!Array.isArray(permissions) || permissions.length === 0) return false;
    
    return permissions.every(p => 
        userPermissions.some(up => up.name === p || up.id === p)
    );
}

/**
 * Check if user has role
 * @param {string|array} role - Role atau array roles
 * @param {array} userRoles - User roles dari server
 * @returns {boolean}
 */
export function hasRole(role, userRoles = []) {
    if (!role || userRoles.length === 0) return false;

    const roles = Array.isArray(role) ? role : [role];
    
    return roles.some(r => 
        userRoles.some(ur => ur.name === r || ur.id === r)
    );
}

/**
 * Check if user is super admin
 * @param {array} userRoles - User roles dari server
 * @returns {boolean}
 */
export function isSuperAdmin(userRoles = []) {
    return hasRole('Super Admin', userRoles);
}

/**
 * Toggle element visibility based on permission
 * @param {string} selector - Element CSS selector
 * @param {string|array} permission - Permission(s) required
 * @param {array} userPermissions - User permissions dari server
 */
export function toggleElementByPermission(selector, permission, userPermissions = []) {
    const element = document.querySelector(selector);
    if (!element) return;

    if (hasPermission(permission, userPermissions)) {
        element.classList.remove('hidden');
        element.style.display = '';
    } else {
        element.classList.add('hidden');
        element.style.display = 'none';
    }
}

/**
 * Hide element if user doesn't have permission
 * @param {string} selector - Element CSS selector
 * @param {string|array} permission - Permission(s) required
 * @param {array} userPermissions - User permissions dari server
 */
export function hideIfNoPermission(selector, permission, userPermissions = []) {
    if (!hasPermission(permission, userPermissions)) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    }
}

/**
 * Show element if user has permission
 * @param {string} selector - Element CSS selector
 * @param {string|array} permission - Permission(s) required
 * @param {array} userPermissions - User permissions dari server
 */
export function showIfHasPermission(selector, permission, userPermissions = []) {
    if (hasPermission(permission, userPermissions)) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.remove('hidden');
            element.style.display = '';
        }
    }
}

/**
 * Disable button if user doesn't have permission
 * @param {string} selector - Button CSS selector
 * @param {string|array} permission - Permission(s) required
 * @param {array} userPermissions - User permissions dari server
 */
export function disableButtonIfNoPermission(selector, permission, userPermissions = []) {
    const button = document.querySelector(selector);
    if (!button) return;

    if (!hasPermission(permission, userPermissions)) {
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');
        button.title = 'Anda tidak memiliki permission untuk action ini';
    }
}
