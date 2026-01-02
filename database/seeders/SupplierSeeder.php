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
     * Jalankan seeder untuk membuat data supplier dari CSV supplierdata.csv
     * 
     * @return void
     */
    public function run(): void
    {
        // Ambil user pertama untuk created_by
        $user = User::first();

        // Baca CSV file
        $path = base_path('database/supplierdata.csv');
        if (!file_exists($path)) {
            $this->command?->warn("File CSV tidak ditemukan: {$path}");
            return;
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            $this->command?->error('Gagal membuka file CSV');
            return;
        }

        // Skip header row
        $header = fgetcsv($handle);
        $count = 0;

        while (($row = fgetcsv($handle)) !== false) {
            // Lewati baris kosong
            if (count(array_filter($row, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }

            [
                $id,
                $name,
            ] = array_pad($row, 2, null);

            if (empty($name)) {
                continue;
            }

            $name = trim((string) $name);

            Supplier::firstOrCreate(
                ['name' => $name],
                [
                    'supplier_type' => 'Company',
                    'contact_person' => null,
                    'phone' => null,
                    'email' => null,
                    'address' => null,
                    'tax_id' => null,
                    'created_by' => $user?->id,
                ]
            );

            $count++;
        }

        fclose($handle);

        $this->command?->info("Supplier seeder selesai. Total: {$count} suppliers created/updated");
    }
}
