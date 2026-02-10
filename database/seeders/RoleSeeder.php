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

        $this->command->info('Roles and permissions assigned successfully!');

        // ==================== CREATE DEFAULT USERS ====================
        
        // Create Super Admin User
        $superAdminUser = User::updateOrCreate(
            ['email' => 'procurement.kalla.property@kalla.co.id'],
            [
                'name' => 'Procurement Kalla Property',
                'password' => Hash::make('ProcurementDept26'),
                'location_id' => null, // Super admin tidak terikat lokasi
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $superAdminUser->assignRole('Super Admin');

        $this->command->info('Default users created successfully!');
        $this->command->info('');
        $this->command->info('Login credentials:');
        $this->command->info('Super Admin: procurement.kalla.property@kalla.co.id / ProcurementDept26');
    }
}
