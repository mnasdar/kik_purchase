<?php

namespace Database\Seeders;

use App\Models\Config\Location;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            ['name' => 'Head Office'],
            ['name' => 'Mall MARI'],
            ['name' => 'Mall NIPAH'],
            ['name' => 'Wisma Kalla'],
            // Tambahkan baris lainnya dari tabel Excel yang kamu upload
        ];
        foreach ($data as $row) {
            Location::create([
                'name' => $row['name']
            ]);
        }
    }
}
