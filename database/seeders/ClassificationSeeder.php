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
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Perlengkapan Operasional',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Fasilitas Kantor',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Material Pendukung',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Mekanikal Electrical',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Gas Industri',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Lampu',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Pek. Jasa',
                'type' => 'jasa',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Material Chiller',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Tissue',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Part Escalator',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Kebutuhan Event & Marketing',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Part Lift',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Solar',
                'type' => 'barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Material Genset',
                'type' => 'barang',
                'sla' => 7
            ],
        ];
        
        foreach ($data as $row) {
            Classification::create([
                'name' => $row['name'],
                'type' => $row['type'],
                'sla' => $row['sla'],
            ]);
        }
    }
}

