<?php

namespace App\Http\Controllers;

use App\Helpers\AuthorizationHelper;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Check if user has permission
     * 
     * @param string|array $permissions
     * @return bool
     */
    protected function hasPermission($permissions): bool
    {
        return AuthorizationHelper::hasPermission($permissions);
    }

    /**
     * Check if user has all permissions
     * 
     * @param array $permissions
     * @return bool
     */
    protected function hasAllPermissions(array $permissions): bool
    {
        return AuthorizationHelper::hasAllPermissions($permissions);
    }

    /**
     * Check if user has role
     * 
     * @param string|array $role
     * @return bool
     */
    protected function hasRole($role): bool
    {
        return AuthorizationHelper::hasRole($role);
    }

    /**
     * Check if user is super admin
     * 
     * @return bool
     */
    protected function isSuperAdmin(): bool
    {
        return AuthorizationHelper::isSuperAdmin();
    }

    /**
     * Check authorization and throw error if not authorized
     * 
     * @param string|array $permissions
     * @param string $message
     * @throws \Illuminate\Auth\AuthorizationException
     */
    protected function authorize($permissions, string $message = 'Unauthorized action.'): void
    {
        if (!$this->hasPermission($permissions)) {
            abort(403, $message);
        }
    }

    /**
     * Check authorization and throw error if not authorized (all permissions)
     * 
     * @param array $permissions
     * @param string $message
     * @throws \Illuminate\Auth\AuthorizationException
     */
    protected function authorizeAll(array $permissions, string $message = 'Unauthorized action.'): void
    {
        if (!$this->hasAllPermissions($permissions)) {
            abort(403, $message);
        }
    }

    /**
     * Get authenticated user's permissions
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    protected function getUserPermissions()
    {
        return AuthorizationHelper::getUserPermissions();
    }

    /**
     * Get authenticated user's roles
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    protected function getUserRoles()
    {
        return AuthorizationHelper::getUserRoles();
    }
}
