<?php

namespace Database\Seeders;

use App\Models\Config\Location;
use Illuminate\Database\Seeder;

/**
 * Class LocationSeeder
 * Seeder untuk membuat data lokasi/cabang perusahaan
 * 
 * @package Database\Seeders
 */
class LocationSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk membuat data lokasi
     * 
     * @return void
     */
    public function run(): void
    {
        $locations = [
            ['name' => 'Jakarta Pusat'],
            ['name' => 'Jakarta Selatan'],
            ['name' => 'Surabaya'],
            ['name' => 'Bandung'],
            ['name' => 'Medan'],
        ];

        foreach ($locations as $location) {
            Location::create($location);
        }
    }
}
