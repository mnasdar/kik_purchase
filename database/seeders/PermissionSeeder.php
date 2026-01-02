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

        // Define permissions with categories
        $permissions = [
            // Dashboard
            [
                'name' => 'dashboard.view',
                'display_name' => 'View Dashboard',
                'description' => 'Can view dashboard page',
                'category' => 'Dashboard',
                'guard_name' => 'web',
            ],

            // User Management
            [
                'name' => 'users.view',
                'display_name' => 'View Users',
                'description' => 'Can view users list',
                'category' => 'User Management',
                'guard_name' => 'web',
            ],
            [
                'name' => 'users.create',
                'display_name' => 'Create Users',
                'description' => 'Can create new users',
                'category' => 'User Management',
                'guard_name' => 'web',
            ],
            [
                'name' => 'users.edit',
                'display_name' => 'Edit Users',
                'description' => 'Can edit existing users',
                'category' => 'User Management',
                'guard_name' => 'web',
            ],
            [
                'name' => 'users.delete',
                'display_name' => 'Delete Users',
                'description' => 'Can delete users',
                'category' => 'User Management',
                'guard_name' => 'web',
            ],
            [
                'name' => 'users.permissions',
                'display_name' => 'Manage User Permissions',
                'description' => 'Can manage custom user permissions',
                'category' => 'User Management',
                'guard_name' => 'web',
            ],

            // Role Management
            [
                'name' => 'roles.view',
                'display_name' => 'View Roles',
                'description' => 'Can view roles list',
                'category' => 'Role Management',
                'guard_name' => 'web',
            ],
            [
                'name' => 'roles.create',
                'display_name' => 'Create Roles',
                'description' => 'Can create new roles',
                'category' => 'Role Management',
                'guard_name' => 'web',
            ],
            [
                'name' => 'roles.edit',
                'display_name' => 'Edit Roles',
                'description' => 'Can edit existing roles',
                'category' => 'Role Management',
                'guard_name' => 'web',
            ],
            [
                'name' => 'roles.delete',
                'display_name' => 'Delete Roles',
                'description' => 'Can delete roles',
                'category' => 'Role Management',
                'guard_name' => 'web',
            ],

            // Location Management
            [
                'name' => 'locations.view',
                'display_name' => 'View Locations',
                'description' => 'Can view locations list',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'locations.create',
                'display_name' => 'Create Locations',
                'description' => 'Can create new locations',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'locations.edit',
                'display_name' => 'Edit Locations',
                'description' => 'Can edit existing locations',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],
            [
                'name' => 'locations.delete',
                'display_name' => 'Delete Locations',
                'description' => 'Can delete locations',
                'category' => 'Configuration',
                'guard_name' => 'web',
            ],

            // Supplier Management
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

            // Classification Management
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

            // Purchase Request
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

            // Purchase Order
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

            // PO Onsite


            // Reports
            [
                'name' => 'reports.view',
                'display_name' => 'View Reports',
                'description' => 'Can view reports',
                'category' => 'Reports',
                'guard_name' => 'web',
            ],
            [
                'name' => 'reports.export',
                'display_name' => 'Export Reports',
                'description' => 'Can export reports',
                'category' => 'Reports',
                'guard_name' => 'web',
            ],

            // Activity Log
            [
                'name' => 'activity-log.view',
                'display_name' => 'View Activity Log',
                'description' => 'Can view system activity logs',
                'category' => 'System',
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
