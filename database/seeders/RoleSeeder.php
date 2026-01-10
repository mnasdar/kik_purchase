<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Get all permissions
        $allPermissions = Permission::all();

        // ==================== SUPER ADMIN ====================
        $superAdmin = Role::updateOrCreate(
            ['name' => 'Super Admin'],
            ['guard_name' => 'web']
        );
        
        // Super Admin has all permissions
        $superAdmin->syncPermissions($allPermissions);

        // ==================== STAFF ====================
        $staff = Role::updateOrCreate(
            ['name' => 'Staff'],
            ['guard_name' => 'web']
        );

        // Staff permissions: semua menu kecuali Manajemen Akses (roles, users, activity-log)
        $staffPermissions = [
            'dashboard.view',
            'purchase-requests.view',
            'purchase-requests.create',
            'purchase-requests.edit',
            'purchase-requests.delete',
            'purchase-requests.approve',
            'purchase-orders.view',
            'purchase-orders.create',
            'purchase-orders.edit',
            'purchase-orders.delete',
            'invoices.dari-vendor.view',
            'invoices.dari-vendor.create',
            'invoices.dari-vendor.edit',
            'invoices.dari-vendor.delete',
            'invoices.pengajuan.view',
            'invoices.pengajuan.create',
            'invoices.pengajuan.edit',
            'invoices.pengajuan.delete',
            'invoices.pembayaran.view',
            'invoices.pembayaran.create',
            'invoices.pembayaran.edit',
            'invoices.pembayaran.delete',
            'reports.view',
            'reports.export',
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
        $this->command->info('Staff: staff@purchasing.com / password');
    }
}
