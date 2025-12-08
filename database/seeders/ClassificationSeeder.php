<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Config\Classification;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

/**
 * Class ClassificationSeeder
 * Seeder untuk membuat data klasifikasi barang/jasa
 * 
 * @package Database\Seeders
 */
class ClassificationSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data klasifikasi
     * 
     * @return void
     */
    public function run(): void
    {
        $data = [
            [
                'name' => 'Pengadaan Perlengkapan Kantor',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Perlengkapan Operasional',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Fasilitas Kantor',
                'type' => 'barang',
            ],
            [
                'name' => 'Material Pendukung',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Mekanikal Electrical',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Gas Industri',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Lampu',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Pek. Jasa',
                'type' => 'jasa',
            ],
            [
                'name' => 'Pengadaan Material Chiller',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Tissue',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Part Escalator',
                'type' => 'barang',
            ],
            [
                'name' => 'Kebutuhan Event & Marketing',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Part Lift',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Solar',
                'type' => 'barang',
            ],
            [
                'name' => 'Pengadaan Material Genset',
                'type' => 'barang',
            ],
        ];
        
        foreach ($data as $row) {
            Classification::create([
                'name' => $row['name'],
                'type' => $row['type'],
            ]);
        }
    }
}

