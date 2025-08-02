<?php

namespace Database\Seeders;

use App\Models\Config\Status;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            [
                
                'name' => 'New',
                'type' => 'Barang',
            ],
            [
                
                'name' => 'On Proses',
                'type' => 'Barang',
            ],
            [
                
                'name' => 'Finish',
                'type' => 'Barang',
            ],
            [
                
                'name' => 'New',
                'type' => 'Jasa',
            ],
            [
                
                'name' => 'On Proses',
                'type' => 'Jasa',
            ],
            [
                
                'name' => 'Finish',
                'type' => 'Jasa',
            ],
            // Tambahkan baris lainnya dari tabel Excel yang kamu upload
        ];

        foreach ($data as $row) {
            Status::create([
                'name' => $row['name'],
                'type' => $row['type'],
            ]);
        }
    }
}
