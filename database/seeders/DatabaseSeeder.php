<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Purchase\PurchaseTracking;
use App\Models\Config\Location;
use Spatie\Permission\Models\Role;

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
     * Urutan penting: Config data terlebih dahulu, baru Purchase dan Invoice
     * 
     * @return void
     */
    public function run(): void
    {
        // 1. Buat data klasifikasi dan lokasi terlebih dahulu
        $this->call([
            ClassificationSeeder::class,
            LocationSeeder::class,
        ]);

        // 2. Seed permissions dan roles dengan users
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class, // Sudah include user creation
        ]);

        // 3. Buat supplier, purchase request, dan purchase order
        $this->call([
            SupplierSeeder::class,
            PurchaseRequestSeeder::class,
            PurchaseOrderSeeder::class,
        ]);

        // 4. Buat item dari purchase request dan purchase order
        $this->call([
            PurchaseRequestItemSeeder::class,
            PurchaseOrderItemSeeder::class,
        ]);

        // 5. Buat purchase tracking dan onsite
        $this->call([
            PurchaseTrackingSeeder::class,
            PurchaseOrderOnsiteSeeder::class,
        ]);

        // 6. Buat invoice dan payment
        $this->call([
            InvoiceSeeder::class,
            PaymentSeeder::class,
        ]);
    }
}

