<?php

namespace Database\Seeders;

use App\Models\Config\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Class SupplierSeeder
 * Seeder untuk membuat data supplier/vendor
 * 
 * @package Database\Seeders
 */
class SupplierSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data supplier
     * 
     * @return void
     */
    public function run(): void
    {
        // Ambil user pertama untuk created_by
        $user = User::first();

        $suppliers = [
            [
                'supplier_type' => 'Company',
                'name' => 'PT Maju Jaya',
                'contact_person' => 'Budi Santoso',
                'phone' => '021-1234567',
                'email' => 'info@majujaya.com',
                'address' => 'Jl. Sudirman No. 1, Jakarta',
                'tax_id' => '12.345.678.9-123.456',
                'created_by' => $user?->id,
            ],
            [
                'supplier_type' => 'Company',
                'name' => 'PT Sumber Murah',
                'contact_person' => 'Siti Nurhaliza',
                'phone' => '021-9876543',
                'email' => 'contact@sumbermurah.com',
                'address' => 'Jl. Thamrin No. 10, Jakarta',
                'tax_id' => '98.765.432.1-654.321',
                'created_by' => $user?->id,
            ],
            [
                'supplier_type' => 'Individual',
                'name' => 'Ahmad Hidayat',
                'contact_person' => 'Ahmad Hidayat',
                'phone' => '0812-3456789',
                'email' => 'ahmad@gmail.com',
                'address' => 'Jl. Gatot Subroto No. 5, Jakarta',
                'tax_id' => null,
                'created_by' => $user?->id,
            ],
            [
                'supplier_type' => 'Company',
                'name' => 'CV Teknologi Maju',
                'contact_person' => 'Eka Putri',
                'phone' => '031-5555555',
                'email' => 'sales@teknologimaju.co.id',
                'address' => 'Jl. Ahmad Yani No. 20, Surabaya',
                'tax_id' => '55.555.555.5-555.555',
                'created_by' => $user?->id,
            ],
            [
                'supplier_type' => 'Company',
                'name' => 'Toko Elektronik Sukses',
                'contact_person' => 'Rudi Gunawan',
                'phone' => '022-2222222',
                'email' => 'rudi@toko-sukses.com',
                'address' => 'Jl. Merdeka No. 15, Bandung',
                'tax_id' => '22.222.222.2-222.222',
                'created_by' => $user?->id,
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }
    }
}
