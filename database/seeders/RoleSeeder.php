<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Get all permissions
        $allPermissions = Permission::all();

        // ==================== SUPER ADMIN ====================
        $superAdmin = Role::updateOrCreate(
            ['name' => 'Super Admin'],
            ['guard_name' => 'web']
        );
        
        // Super Admin has all permissions
        $superAdmin->syncPermissions($allPermissions);

        // ==================== KASIR ====================
        $kasir = Role::updateOrCreate(
            ['name' => 'Kasir'],
            ['guard_name' => 'web']
        );

        // Kasir permissions: invoice, payment, view purchase orders
        $kasirPermissions = [
            'dashboard.view',
            'invoices.view',
            'invoices.create',
            'invoices.edit',
            'invoices.delete',
            'payments.view',
            'payments.create',
            'payments.edit',
            'payments.delete',
            'purchase-orders.view',
            'suppliers.view',
            'reports.view',
        ];
        $kasir->syncPermissions(Permission::whereIn('name', $kasirPermissions)->get());

        // ==================== GUDANG ====================
        $gudang = Role::updateOrCreate(
            ['name' => 'Gudang'],
            ['guard_name' => 'web']
        );

        // Gudang permissions: manage all purchases, tracking, onsite
        $gudangPermissions = [
            'dashboard.view',
            'purchase-requests.view',
            'purchase-requests.create',
            'purchase-requests.edit',
            'purchase-requests.delete',
            'purchase-orders.view',
            'purchase-orders.create',
            'purchase-orders.edit',
            'purchase-orders.delete',
            'purchase-tracking.view',
            'purchase-tracking.update',
            'po-onsite.view',
            'po-onsite.create',
            'po-onsite.edit',
            'po-onsite.delete',
            'suppliers.view',
            'classifications.view',
            'reports.view',
        ];
        $gudang->syncPermissions(Permission::whereIn('name', $gudangPermissions)->get());

        // ==================== MANAGER ====================
        $manager = Role::updateOrCreate(
            ['name' => 'Manager'],
            ['guard_name' => 'web']
        );

        // Manager permissions: approve, view reports, view users
        $managerPermissions = [
            'dashboard.view',
            'purchase-requests.view',
            'purchase-requests.approve',
            'purchase-orders.view',
            'invoices.view',
            'payments.view',
            'reports.view',
            'reports.export',
            'users.view',
            'suppliers.view',
            'locations.view',
            'activity-log.view',
        ];
        $manager->syncPermissions(Permission::whereIn('name', $managerPermissions)->get());

        // ==================== STAFF ====================
        $staff = Role::updateOrCreate(
            ['name' => 'Staff'],
            ['guard_name' => 'web']
        );

        // Staff permissions: basic view and create purchase requests
        $staffPermissions = [
            'dashboard.view',
            'purchase-requests.view',
            'purchase-requests.create',
            'suppliers.view',
        ];
        $staff->syncPermissions(Permission::whereIn('name', $staffPermissions)->get());

        $this->command->info('Roles and permissions assigned successfully!');

        // ==================== CREATE DEFAULT USERS ====================
        
        // Create Super Admin User
        $superAdminUser = User::updateOrCreate(
            ['email' => 'superadmin@purchasing.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'location_id' => null, // Super admin tidak terikat lokasi
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $superAdminUser->assignRole('Super Admin');

        // Create Kasir User
        $kasirUser = User::updateOrCreate(
            ['email' => 'kasir@purchasing.com'],
            [
                'name' => 'Kasir User',
                'password' => Hash::make('password'),
                'location_id' => 1, // Assign to location 1
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $kasirUser->assignRole('Kasir');

        // Create Gudang User
        $gudangUser = User::updateOrCreate(
            ['email' => 'gudang@purchasing.com'],
            [
                'name' => 'Gudang User',
                'password' => Hash::make('password'),
                'location_id' => 1, // Assign to location 1
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $gudangUser->assignRole('Gudang');

        // Create Manager User
        $managerUser = User::updateOrCreate(
            ['email' => 'manager@purchasing.com'],
            [
                'name' => 'Manager User',
                'password' => Hash::make('password'),
                'location_id' => 1, // Assign to location 1
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $managerUser->assignRole('Manager');

        // Create Staff User
        $staffUser = User::updateOrCreate(
            ['email' => 'staff@purchasing.com'],
            [
                'name' => 'Staff User',
                'password' => Hash::make('password'),
                'location_id' => 1, // Assign to location 1
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $staffUser->assignRole('Staff');

        $this->command->info('Default users created successfully!');
        $this->command->info('');
        $this->command->info('Login credentials:');
        $this->command->info('Super Admin: superadmin@purchasing.com / password');
        $this->command->info('Kasir: kasir@purchasing.com / password');
        $this->command->info('Gudang: gudang@purchasing.com / password');
        $this->command->info('Manager: manager@purchasing.com / password');
        $this->command->info('Staff: staff@purchasing.com / password');
    }
}
