<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

/**
 * Service untuk mengelola menu berdasarkan role & permission
 */
class MenuService
{
    private $user;
    private array $menus = [];

    public function __construct()
    {
        $this->user = Auth::user();
        $this->loadMenus();
    }

    /**
     * Load menu items configuration
     */
    private function loadMenus(): void
    {
        $this->menus = [
            // Dashboard
            [
                'id' => 'dashboard',
                'title' => 'Dashboard',
                'icon' => 'mgc_home_3_line',
                'route' => 'dashboard',
                'permissions' => ['dashboard.view'],
                'order' => 1,
            ],
            // Purchase Menu
            [
                'id' => 'purchase',
                'title' => 'Purchase',
                'icon' => 'mgc_shopping_cart_2_line',
                'route' => null,
                'permissions' => ['purchase-requests.view', 'purchase-orders.view'],
                'order' => 2,
                'children' => [
                    [
                        'id' => 'purchase-request',
                        'title' => 'PR (Purchase Request)',
                        'route' => 'purchase-request.index',
                        'permissions' => ['purchase-requests.view'],
                    ],
                    [
                        'id' => 'purchase-order',
                        'title' => 'PO (Purchase Order)',
                        'route' => 'purchase-order.index',
                        'permissions' => ['purchase-orders.view'],
                    ],
                    [
                        'id' => 'po-onsite',
                        'title' => 'PO On Site',
                        'route' => 'po-onsite.index',
                        'permissions' => ['purchase-orders.view'],
                    ],
                ],
            ],
            // Invoice Menu
            [
                'id' => 'invoice',
                'title' => 'Invoice',
                'icon' => 'mgc_bill_line',
                'route' => null,
                'permissions' => [],
                'order' => 3,
                'children' => [
                    [
                        'id' => 'dari-vendor',
                        'title' => 'Dari Vendor',
                        'route' => 'dari-vendor.index',
                        'permissions' => [],
                    ],
                    [
                        'id' => 'pengajuan',
                        'title' => 'Pengajuan',
                        'route' => 'pengajuan.index',
                        'permissions' => [],
                    ],
                    [
                        'id' => 'pembayaran',
                        'title' => 'Pembayaran',
                        'route' => 'pembayaran.index',
                        'permissions' => [],
                    ],
                ],
            ],
            // Configuration Menu
            [
                'id' => 'configuration',
                'title' => 'Konfigurasi',
                'icon' => 'mgc_settings_1_line',
                'route' => null,
                'permissions' => ['classifications.view', 'locations.view', 'suppliers.view'],
                'order' => 4,
                'children' => [
                    [
                        'id' => 'classification',
                        'title' => 'Klasifikasi',
                        'route' => 'klasifikasi.index',
                        'permissions' => ['classifications.view'],
                    ],
                    [
                        'id' => 'location',
                        'title' => 'Unit Kerja',
                        'route' => 'unit-kerja.index',
                        'permissions' => ['locations.view'],
                    ],
                    [
                        'id' => 'supplier',
                        'title' => 'Supplier',
                        'route' => 'supplier.index',
                        'permissions' => ['suppliers.view'],
                    ],
                ],
            ],
            // Export Menu
            [
                'id' => 'export',
                'title' => 'Export Data',
                'icon' => 'mgc_file_export_line',
                'route' => 'export.index',
                'permissions' => ['reports.export'],
                'order' => 5,
            ],
            // Divider
            [
                'id' => 'access-divider',
                'title' => 'Manajemen Akses',
                'type' => 'divider',
                'permissions' => ['roles.view', 'users.view', 'activity-log.view'],
                'order' => 6,
            ],
            // Roles
            [
                'id' => 'roles',
                'title' => 'Roles',
                'icon' => 'mgc_shield_line',
                'route' => 'roles.index',
                'permissions' => ['roles.view'],
                'order' => 7,
            ],
            // Users
            [
                'id' => 'users',
                'title' => 'Users',
                'icon' => 'mgc_user_3_line',
                'route' => 'users.index',
                'permissions' => ['users.view'],
                'order' => 8,
            ],
            // Activity Log
            [
                'id' => 'activity-log',
                'title' => 'Log Aktivitas',
                'icon' => 'mgc_history_line',
                'route' => 'log.index',
                'permissions' => ['activity-log.view'],
                'order' => 9,
            ],
        ];
    }

    /**
     * Get accessible menu items
     */
    public function getAccessibleMenuItems(): Collection
    {
        if (!$this->user) {
            return collect([]);
        }

        return collect($this->menus)
            ->filter(fn($item) => $this->canAccess($item))
            ->map(function ($item) {
                if (isset($item['children'])) {
                    $item['children'] = array_filter(
                        $item['children'],
                        fn($child) => $this->canAccess($child)
                    );
                }
                return $item;
            })
            ->filter(function ($item) {
                if (isset($item['children'])) {
                    return !empty($item['children']);
                }
                return true;
            })
            ->sortBy('order')
            ->values();
    }

    /**
     * Check if user can access menu item
     */
    public function canAccess(array $item): bool
    {
        if (isset($item['type']) && $item['type'] === 'divider') {
            return $this->hasAnyPermission($item['permissions'] ?? []);
        }

        if (empty($item['permissions'])) {
            return true;
        }

        return $this->hasAnyPermission($item['permissions']);
    }

    /**
     * Check if user has any permission
     */
    private function hasAnyPermission(array $permissions): bool
    {
        if (empty($permissions)) {
            return true;
        }

        foreach ($permissions as $permission) {
            if ($this->user->hasPermissionTo($permission)) {
                return true;
            }
        }

        return false;
    }
}
