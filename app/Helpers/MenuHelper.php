<?php

namespace App\Helpers;

use App\Services\MenuService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class MenuHelper
{
    /**
     * Get all accessible menu items for current user
     */
    public static function getMenuItems(): Collection
    {
        $menuService = app(MenuService::class);
        return $menuService->getAccessibleMenuItems();
    }

    /**
     * Check if user can access specific menu by ID
     */
    public static function canAccessMenu(string $menuId): bool
    {
        $items = self::getMenuItems();
        return $items->contains(fn($item) => $item['id'] === $menuId);
    }

    /**
     * Get menu item by ID
     */
    public static function getMenuItem(string $menuId)
    {
        return self::getMenuItems()->firstWhere('id', $menuId);
    }

    /**
     * Get all menu permissions mapped with routes
     * Untuk digunakan di form role/user management
     */
    public static function getMenuPermissionsMapping(): array
    {
        $menuService = app(MenuService::class);
        
        return [
            [
                'category' => 'Dashboard',
                'permissions' => [
                    [
                        'id' => 'dashboard.view',
                        'name' => 'dashboard.view',
                        'display_name' => 'View Dashboard',
                        'route' => 'dashboard',
                        'menu' => 'Dashboard',
                    ]
                ]
            ],
            [
                'category' => 'Purchase Management',
                'permissions' => [
                    [
                        'id' => 'purchase-requests.view',
                        'name' => 'purchase-requests.view',
                        'display_name' => 'View Purchase Requests',
                        'route' => 'purchase-request.index',
                        'menu' => 'Purchase - PR',
                    ],
                    [
                        'id' => 'purchase-requests.create',
                        'name' => 'purchase-requests.create',
                        'display_name' => 'Create Purchase Requests',
                        'route' => 'purchase-request.create',
                        'menu' => 'Purchase - PR',
                    ],
                    [
                        'id' => 'purchase-requests.edit',
                        'name' => 'purchase-requests.edit',
                        'display_name' => 'Edit Purchase Requests',
                        'route' => 'purchase-request.edit',
                        'menu' => 'Purchase - PR',
                    ],
                    [
                        'id' => 'purchase-requests.delete',
                        'name' => 'purchase-requests.delete',
                        'display_name' => 'Delete Purchase Requests',
                        'route' => 'purchase-request.destroy',
                        'menu' => 'Purchase - PR',
                    ],
                    [
                        'id' => 'purchase-requests.approve',
                        'name' => 'purchase-requests.approve',
                        'display_name' => 'Approve Purchase Requests',
                        'route' => 'purchase-request.update',
                        'menu' => 'Purchase - PR',
                    ],
                    [
                        'id' => 'purchase-orders.view',
                        'name' => 'purchase-orders.view',
                        'display_name' => 'View Purchase Orders',
                        'route' => 'purchase-order.index',
                        'menu' => 'Purchase - PO',
                    ],
                    [
                        'id' => 'purchase-orders.create',
                        'name' => 'purchase-orders.create',
                        'display_name' => 'Create Purchase Orders',
                        'route' => 'purchase-order.create',
                        'menu' => 'Purchase - PO',
                    ],
                    [
                        'id' => 'purchase-orders.edit',
                        'name' => 'purchase-orders.edit',
                        'display_name' => 'Edit Purchase Orders',
                        'route' => 'purchase-order.edit',
                        'menu' => 'Purchase - PO',
                    ],
                    [
                        'id' => 'purchase-orders.delete',
                        'name' => 'purchase-orders.delete',
                        'display_name' => 'Delete Purchase Orders',
                        'route' => 'purchase-order.destroy',
                        'menu' => 'Purchase - PO',
                    ],
                ]
            ],
            [
                'category' => 'Configuration',
                'permissions' => [
                    [
                        'id' => 'classifications.view',
                        'name' => 'classifications.view',
                        'display_name' => 'View Classifications',
                        'route' => 'klasifikasi.index',
                        'menu' => 'Konfigurasi - Klasifikasi',
                    ],
                    [
                        'id' => 'classifications.create',
                        'name' => 'classifications.create',
                        'display_name' => 'Create Classifications',
                        'route' => 'klasifikasi.create',
                        'menu' => 'Konfigurasi - Klasifikasi',
                    ],
                    [
                        'id' => 'classifications.edit',
                        'name' => 'classifications.edit',
                        'display_name' => 'Edit Classifications',
                        'route' => 'klasifikasi.edit',
                        'menu' => 'Konfigurasi - Klasifikasi',
                    ],
                    [
                        'id' => 'classifications.delete',
                        'name' => 'classifications.delete',
                        'display_name' => 'Delete Classifications',
                        'route' => 'klasifikasi.destroy',
                        'menu' => 'Konfigurasi - Klasifikasi',
                    ],
                    [
                        'id' => 'locations.view',
                        'name' => 'locations.view',
                        'display_name' => 'View Locations',
                        'route' => 'unit-kerja.index',
                        'menu' => 'Konfigurasi - Unit Kerja',
                    ],
                    [
                        'id' => 'locations.create',
                        'name' => 'locations.create',
                        'display_name' => 'Create Locations',
                        'route' => 'unit-kerja.create',
                        'menu' => 'Konfigurasi - Unit Kerja',
                    ],
                    [
                        'id' => 'locations.edit',
                        'name' => 'locations.edit',
                        'display_name' => 'Edit Locations',
                        'route' => 'unit-kerja.edit',
                        'menu' => 'Konfigurasi - Unit Kerja',
                    ],
                    [
                        'id' => 'locations.delete',
                        'name' => 'locations.delete',
                        'display_name' => 'Delete Locations',
                        'route' => 'unit-kerja.destroy',
                        'menu' => 'Konfigurasi - Unit Kerja',
                    ],
                    [
                        'id' => 'suppliers.view',
                        'name' => 'suppliers.view',
                        'display_name' => 'View Suppliers',
                        'route' => 'supplier.index',
                        'menu' => 'Konfigurasi - Supplier',
                    ],
                    [
                        'id' => 'suppliers.create',
                        'name' => 'suppliers.create',
                        'display_name' => 'Create Suppliers',
                        'route' => 'supplier.create',
                        'menu' => 'Konfigurasi - Supplier',
                    ],
                    [
                        'id' => 'suppliers.edit',
                        'name' => 'suppliers.edit',
                        'display_name' => 'Edit Suppliers',
                        'route' => 'supplier.edit',
                        'menu' => 'Konfigurasi - Supplier',
                    ],
                    [
                        'id' => 'suppliers.delete',
                        'name' => 'suppliers.delete',
                        'display_name' => 'Delete Suppliers',
                        'route' => 'supplier.destroy',
                        'menu' => 'Konfigurasi - Supplier',
                    ],
                ]
            ],
            [
                'category' => 'Reports',
                'permissions' => [
                    [
                        'id' => 'reports.view',
                        'name' => 'reports.view',
                        'display_name' => 'View Reports',
                        'route' => 'dashboard',
                        'menu' => 'Dashboard',
                    ],
                    [
                        'id' => 'reports.export',
                        'name' => 'reports.export',
                        'display_name' => 'Export Data',
                        'route' => 'export.index',
                        'menu' => 'Export Data',
                    ],
                ]
            ],
            [
                'category' => 'Access Control',
                'permissions' => [
                    [
                        'id' => 'roles.view',
                        'name' => 'roles.view',
                        'display_name' => 'View Roles',
                        'route' => 'roles.index',
                        'menu' => 'Manajemen Akses - Roles',
                    ],
                    [
                        'id' => 'roles.create',
                        'name' => 'roles.create',
                        'display_name' => 'Create Roles',
                        'route' => 'roles.store',
                        'menu' => 'Manajemen Akses - Roles',
                    ],
                    [
                        'id' => 'roles.edit',
                        'name' => 'roles.edit',
                        'display_name' => 'Edit Roles',
                        'route' => 'roles.update',
                        'menu' => 'Manajemen Akses - Roles',
                    ],
                    [
                        'id' => 'roles.delete',
                        'name' => 'roles.delete',
                        'display_name' => 'Delete Roles',
                        'route' => 'roles.destroy',
                        'menu' => 'Manajemen Akses - Roles',
                    ],
                    [
                        'id' => 'users.view',
                        'name' => 'users.view',
                        'display_name' => 'View Users',
                        'route' => 'users.index',
                        'menu' => 'Manajemen Akses - Users',
                    ],
                    [
                        'id' => 'users.create',
                        'name' => 'users.create',
                        'display_name' => 'Create Users',
                        'route' => 'users.store',
                        'menu' => 'Manajemen Akses - Users',
                    ],
                    [
                        'id' => 'users.edit',
                        'name' => 'users.edit',
                        'display_name' => 'Edit Users',
                        'route' => 'users.update',
                        'menu' => 'Manajemen Akses - Users',
                    ],
                    [
                        'id' => 'users.delete',
                        'name' => 'users.delete',
                        'display_name' => 'Delete Users',
                        'route' => 'users.destroy',
                        'menu' => 'Manajemen Akses - Users',
                    ],
                    [
                        'id' => 'activity-log.view',
                        'name' => 'activity-log.view',
                        'display_name' => 'View Activity Logs',
                        'route' => 'log.index',
                        'menu' => 'Manajemen Akses - Activity Log',
                    ],
                ]
            ],
        ];
    }

    /**
     * Get permissions available for Staff role
     * (semua permissions kecuali yang di Manajemen Akses)
     */
    public static function getStaffPermissions(): array
    {
        $allPermissions = self::getMenuPermissionsMapping();
        
        // Filter out Access Control category
        return array_filter($allPermissions, function ($category) {
            return $category['category'] !== 'Access Control';
        });
    }

    /**
     * Get permissions available for Super Admin role
     * (semua permissions)
     */
    public static function getSuperAdminPermissions(): array
    {
        return self::getMenuPermissionsMapping();
    }
}
