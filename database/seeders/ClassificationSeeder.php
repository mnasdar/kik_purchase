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
        $classifications = [
            'Pengadaan Perlengkapan Kantor',
            'Pengadaan Perlengkapan Operasional',
            'Pengadaan Fasilitas Kantor',
            'Material Pendukung',
            'Pengadaan Mekanikal Electrical',
            'Pengadaan Gas Industri',
            'Pengadaan Lampu',
            'Pengadaan Pek. Jasa',
            'Pengadaan Material Chiller',
            'Pengadaan Tissue',
            'Pengadaan Part Escalator',
            'Kebutuhan Event & Marketing',
            'Pengadaan Part Lift',
            'Pengadaan Solar',
            'Pengadaan Material Genset',
        ];

        foreach ($classifications as $classification) {
            Classification::firstOrCreate(['name' => $classification]);
        }
    }
}
