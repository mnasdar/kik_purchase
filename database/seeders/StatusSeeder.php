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
                'type' => 'barang',
            ],
            [
                
                'name' => 'On Proses',
                'type' => 'barang',
            ],
            [
                
                'name' => 'Finish',
                'type' => 'barang',
            ],
            [
                
                'name' => 'New',
                'type' => 'jasa',
            ],
            [
                
                'name' => 'On Proses',
                'type' => 'jasa',
            ],
            [
                
                'name' => 'Finish',
                'type' => 'jasa',
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
