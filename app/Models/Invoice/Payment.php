<?php

namespace App\Models\Invoice;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;
        protected $fillable = [
        'submission_id',
        'payment_number',
        'type',
        'payment_date',
        'amount',
    ];
    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }
    public function getIsNewAttribute()
    {
        return $this->created_at && Carbon::parse($this->created_at)->greaterThan(Carbon::now()->subMinutes(5));
    }

    public function getIsUpdateAttribute()
    {
        return $this->updated_at && Carbon::parse($this->updated_at)->greaterThan(Carbon::now()->subMinutes(5));
    }
}
