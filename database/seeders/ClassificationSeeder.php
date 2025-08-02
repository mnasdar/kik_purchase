<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Config\Classification;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class ClassificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            [
                'name' => 'Pengadaan Perlengkapan Kantor',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Perlengkapan Operasional',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Fasilitas Kantor',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Material Pendukung',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Mekanikal Electrical',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Gas Industri',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Lampu',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Pek. Jasa',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Material Chiller',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Tissue',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Part Escalator',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Kebutuhan Event & Marketing',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Part Lift',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Solar',
                'type' => 'Barang',
                'sla' => 7
            ],
            [
                'name' => 'Pengadaan Material Genset',
                'type' => 'Barang',
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
