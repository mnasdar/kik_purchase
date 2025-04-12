<?php

namespace Database\Seeders;

use App\Models\Goods\Status;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = ['on process', 'new', 'finish','status1','status2','status3','status4','status5','status6','status7','status8','status9','status9'];

        foreach ($statuses as $status) {
            Status::firstOrCreate(['name' => $status]);
        }
    }
}
