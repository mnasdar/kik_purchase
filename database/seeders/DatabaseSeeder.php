<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Goods\PurchaseRequest;
use App\Models\Goods\PurchaseTracking;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Buat role "Super Admin"
        $role1 = Role::create(['name' => 'Super Admin']);
        $role2 = Role::create(['name' => 'Admin']);

        // Buat user dan langsung assign role
        $user = User::factory()->create([
            'name' => 'Konrix',
            'email' => 'konrix@coderthemes.com',
            'email_verified_at' => now(),
            'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            'remember_token' => Str::random(10),
        ]);

        $user2 = User::factory()->create([
            'name' => 'M.Nasdar',
            'email' => 'mnasdar@gmail.com',
            'email_verified_at' => now(),
            'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            'remember_token' => Str::random(10),
        ]);


        // Assign role ke user
        $user->assignRole($role1);
        $user2->assignRole($role2);


        $this->call([
            StatusSeeder::class,
            ClassificationSeeder::class,
            PurchaseRequestSeeder::class,
            PurchaseOrderSeeder::class,
            PurchaseTrackingSeeder::class,
        ]);
    }
}
