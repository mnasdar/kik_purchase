<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Goods\PurchaseRequest;
use App\Models\Goods\PurchaseTracking;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        \App\Models\User::factory(1)->create([
            'name' => 'Konrix',
            'email' => 'konrix@coderthemes.com',
            'email_verified_at' => now(),
            'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            'remember_token' => Str::random(10),
        ]);

        $this->call([
            StatusSeeder::class,
            ClassificationSeeder::class,
            PurchaseTrackingSeeder::class,
            PurchaseRequestSeeder::class,
            PurchaseOrderSeeder::class,
        ]);
    }
}
