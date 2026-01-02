<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Config\Classification;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

/**
 * Class ClassificationSeeder
 * Seeder untuk membuat data klasifikasi barang/jasa
 * 
 * @package Database\Seeders
 */
class ClassificationSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data klasifikasi dari CSV classifficationdata.csv
     * 
     * @return void
     */
    public function run(): void
    {
        // Baca CSV file
        $path = base_path('database/classifficationdata.csv');
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
                $name,
            ] = array_pad($row, 2, null);

            if (empty($name)) {
                continue;
            }

            $name = trim((string) $name);

            Classification::firstOrCreate(
                ['name' => $name],
            );

            $count++;
        }

        fclose($handle);

        $this->command?->info("Classification seeder selesai. Total: {$count} classifications created/updated");
    }
}

