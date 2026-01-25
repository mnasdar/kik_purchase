<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Auth;

/**
 * Authorization Helper
 * Helper functions untuk authorization/permission checks
 */
class AuthorizationHelper
{
    /**
     * Check if authenticated user has permission
     * 
     * @param string|array $permission Permission(s) to check
     * @return bool
     */
    public static function hasPermission($permissions): bool
    {
        if (!Auth::check()) {
            return false;
        }

        $user = Auth::user();
        $permissions = is_array($permissions) ? $permissions : [$permissions];

        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if authenticated user has all permissions
     * 
     * @param array $permissions Permissions to check
     * @return bool
     */
    public static function hasAllPermissions(array $permissions): bool
    {
        if (!Auth::check()) {
            return false;
        }

        $user = Auth::user();

        foreach ($permissions as $permission) {
            if (!$user->hasPermissionTo($permission)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if authenticated user has role
     * 
     * @param string|array $role Role(s) to check
     * @return bool
     */
    public static function hasRole($roles): bool
    {
        if (!Auth::check()) {
            return false;
        }

        $user = Auth::user();
        $roles = is_array($roles) ? $roles : [$roles];

        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if authenticated user is super admin
     * 
     * @return bool
     */
    public static function isSuperAdmin(): bool
    {
        return self::hasRole('Super Admin');
    }

    /**
     * Get user's permissions
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getUserPermissions()
    {
        if (!Auth::check()) {
            return collect();
        }

        return Auth::user()->getAllPermissions();
    }

    /**
     * Get user's roles
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getUserRoles()
    {
        if (!Auth::check()) {
            return collect();
        }

        return Auth::user()->roles;
    }

    /**
     * Check if user can access menu item
     * 
     * @param array $permissions Menu permissions
     * @return bool
     */
    public static function canAccessMenu(array $permissions): bool
    {
        return self::hasPermission($permissions);
    }
}
