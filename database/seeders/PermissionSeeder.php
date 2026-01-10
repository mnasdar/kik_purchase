<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions with categories - aligned with MenuService & Routes
        $permissions = [
            // ======================== Dashboard ========================
            [
                'name' => 'dashboard.view',
                'display_name' => 'View Dashboard',
                'description' => 'Can view dashboard page',
                'category' => 'Dashboard',
                'guard_name' => 'web',
            ],

            // ======================== Purchase - Purchase Request ========================
            [
                'name' => 'purchase-requests.view',
                'display_name' => 'View Purchase Requests',
                'description' => 'Can view purchase requests list',
                'category' => 'Purchase',
                'guard_name' => 'web',
            ],
            [
                'name' => 'purchase-requests.create',
                'display_name' => 'Create Purchase Requests',
                'description' => 'Can create new purchase requests',
                'category' => 'Purchase',
                'guard_name' => 'web',
            ],
            [
                'name' => 'purchase-requests.edit',
                'display_name' => 'Edit Purchase Requests',
                'description' => 'Can edit existing purchase requests',
                'category' => 'Purchase',
                'guard_name' => 'web',
            ],
            [
                'name' => 'purchase-requests.delete',
                'display_name' => 'Delete Purchase Requests',
                'description' => 'Can delete purchase requests',
                'category' => 'Purchase',
                'guard_name' => 'web',
            ],
            [
                'name' => 'purchase-requests.approve',
                'display_name' => 'Approve Purchase Requests',
                'description' => 'Can approve purchase requests',
                'category' => 'Purchase',
                'guard_name' => 'web',
            ],

            // ======================== Purchase - Purchase Order ========================
            [
                'name' => 'purchase-orders.view',
                'display_name' => 'View Purchase Orders',
                'description' => 'Can view purchase orders list',
                'category' => 'Purchase',
                'guard_name' => 'web',
            ],
            [
                'name' => 'purchase-orders.create',
                'display_name' => 'Create Purchase Orders',
                'description' => 'Can create new purchase orders',
                'category' => 'Purchase',
                'guard_name' => 'web',
            ],
            [
                'name' => 'purchase-orders.edit',
                'display_name' => 'Edit Purchase Orders',
                'description' => 'Can edit existing purchase orders',
                'category' => 'Purchase',
                'guard_name' => 'web',
            ],
            [
                'name' => 'purchase-orders.delete',
                'display_name' => 'Delete Purchase Orders',
                'description' => 'Can delete purchase orders',
                'category' => 'Purchase',
                'guard_name' => 'web',
            ],

            // ======================== Invoice - Dari Vendor ========================
            [
                'name' => 'invoices.dari-vendor.view',
                'display_name' => 'View Dari Vendor',
                'description' => 'Can view vendor invoices',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],
            [
                'name' => 'invoices.dari-vendor.create',
                'display_name' => 'Create Dari Vendor',
                'description' => 'Can create vendor invoices',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],
            [
                'name' => 'invoices.dari-vendor.edit',
                'display_name' => 'Edit Dari Vendor',
                'description' => 'Can edit vendor invoices',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],
            [
                'name' => 'invoices.dari-vendor.delete',
                'display_name' => 'Delete Dari Vendor',
                'description' => 'Can delete vendor invoices',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],

            // ======================== Invoice - Pengajuan ========================
            [
                'name' => 'invoices.pengajuan.view',
                'display_name' => 'View Pengajuan',
                'description' => 'Can view invoice submissions',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],
            [
                'name' => 'invoices.pengajuan.create',
                'display_name' => 'Create Pengajuan',
                'description' => 'Can create invoice submissions',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],
            [
                'name' => 'invoices.pengajuan.edit',
                'display_name' => 'Edit Pengajuan',
                'description' => 'Can edit invoice submissions',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],
            [
                'name' => 'invoices.pengajuan.delete',
                'display_name' => 'Delete Pengajuan',
                'description' => 'Can delete invoice submissions',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],

            // ======================== Invoice - Pembayaran ========================
            [
                'name' => 'invoices.pembayaran.view',
                'display_name' => 'View Pembayaran',
                'description' => 'Can view payments',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],
            [
                'name' => 'invoices.pembayaran.create',
                'display_name' => 'Create Pembayaran',
                'description' => 'Can create payments',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],
            [
                'name' => 'invoices.pembayaran.edit',
                'display_name' => 'Edit Pembayaran',
                'description' => 'Can edit payments',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],
            [
                'name' => 'invoices.pembayaran.delete',
                'display_name' => 'Delete Pembayaran',
                'description' => 'Can delete payments',
                'category' => 'Invoice',
                'guard_name' => 'web',
            ],

            // ======================== Configuration - Classifications ========================
            [
                'name' => 'classifications.view',
                'display_name' => 'View Classifications',
                'description' => 'Can view classifications list',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'classifications.create',
                'display_name' => 'Create Classifications',
                'description' => 'Can create new classifications',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'classifications.edit',
                'display_name' => 'Edit Classifications',
                'description' => 'Can edit existing classifications',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'classifications.delete',
                'display_name' => 'Delete Classifications',
                'description' => 'Can delete classifications',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],

            // ======================== Configuration - Locations ========================
            [
                'name' => 'locations.view',
                'display_name' => 'View Unit Kerja',
                'description' => 'Can view locations/unit kerja list',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'locations.create',
                'display_name' => 'Create Unit Kerja',
                'description' => 'Can create new locations/unit kerja',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'locations.edit',
                'display_name' => 'Edit Unit Kerja',
                'description' => 'Can edit existing locations/unit kerja',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'locations.delete',
                'display_name' => 'Delete Unit Kerja',
                'description' => 'Can delete locations/unit kerja',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],

            // ======================== Configuration - Suppliers ========================
            [
                'name' => 'suppliers.view',
                'display_name' => 'View Suppliers',
                'description' => 'Can view suppliers list',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'suppliers.create',
                'display_name' => 'Create Suppliers',
                'description' => 'Can create new suppliers',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'suppliers.edit',
                'display_name' => 'Edit Suppliers',
                'description' => 'Can edit existing suppliers',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'suppliers.delete',
                'display_name' => 'Delete Suppliers',
                'description' => 'Can delete suppliers',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],

            // ======================== Reports - Export Data ========================
            [
                'name' => 'reports.export',
                'display_name' => 'Export Data',
                'description' => 'Can export purchasing data',
                'category' => 'Reports',
                'guard_name' => 'web',
            ],

            // ======================== Access Control - Roles ========================
            [
                'name' => 'roles.view',
                'display_name' => 'View Roles',
                'description' => 'Can view roles list',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],
            [
                'name' => 'roles.create',
                'display_name' => 'Create Roles',
                'description' => 'Can create new roles',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],
            [
                'name' => 'roles.edit',
                'display_name' => 'Edit Roles',
                'description' => 'Can edit existing roles',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],
            [
                'name' => 'roles.delete',
                'display_name' => 'Delete Roles',
                'description' => 'Can delete roles',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],

            // ======================== Access Control - Users ========================
            [
                'name' => 'users.view',
                'display_name' => 'View Users',
                'description' => 'Can view users list',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],
            [
                'name' => 'users.create',
                'display_name' => 'Create Users',
                'description' => 'Can create new users',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],
            [
                'name' => 'users.edit',
                'display_name' => 'Edit Users',
                'description' => 'Can edit existing users',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],
            [
                'name' => 'users.delete',
                'display_name' => 'Delete Users',
                'description' => 'Can delete users',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],
            [
                'name' => 'users.permissions',
                'display_name' => 'Manage User Permissions',
                'description' => 'Can manage custom user permissions',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],

            // ======================== Access Control - Activity Log ========================
            [
                'name' => 'activity-log.view',
                'display_name' => 'View Activity Log',
                'description' => 'Can view system activity logs',
                'category' => 'Access Control',
                'guard_name' => 'web',
            ],
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        $this->command->info('Permissions seeded successfully!');
    }
}
