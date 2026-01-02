<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Class DatabaseSeeder
 * Seeder utama untuk menjalankan semua seeder aplikasi
 * 
 * @package Database\Seeders
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk database
     * Urutan penting: Config data terlebih dahulu, baru Purchase
     * 
     * @return void
     */
    public function run(): void
    {
        // 1. Seed data konfigurasi dasar
        $this->call([
            ClassificationSeeder::class,
            LocationSeeder::class,
            SupplierSeeder::class,
        ]);

        // 2. Seed permissions dan roles dengan users
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class, // Sudah include user creation
        ]);
        // 3. Import dataset dari CSV
        $this->call([
            PurchasingDataImportSeeder::class,
        ]);
    }
}

