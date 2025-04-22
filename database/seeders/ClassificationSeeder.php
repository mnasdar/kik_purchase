<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Goods\Classification;
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
            ],
            [
                'name' => 'Pengadaan Perlengkapan Operasional',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Fasilitas Kantor',
                'type' => 'Barang',
            ],
            [
                'name' => 'Material Pendukung',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Mekanikal Electrical',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Gas Industri',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Lampu',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Pek. Jasa',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Material Chiller',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Tissue',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Part Escalator',
                'type' => 'Barang',
            ],
            [
                'name' => 'Kebutuhan Event & Marketing',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Part Lift',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Solar',
                'type' => 'Barang',
            ],
            [
                'name' => 'Pengadaan Material Genset',
                'type' => 'Barang',
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
