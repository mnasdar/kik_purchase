<?php

namespace App\Models\Barang;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use App\Models\Config\Status;
use App\Models\Config\Classification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'status_id',
        'classification_id',
        'pr_number',
        'location',
        'item_desc',
        'uom',
        'approved_date',
        'unit_price',
        'quantity',
        'amount',
    ];

    protected $appends = ['working_days', 'sla_badge'];

    public function classification()
    {
        return $this->belongsTo(Classification::class);
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }
    public function tracking()
    {
        return $this->hasMany(PurchaseTracking::class);
    }

    public function getWorkingDaysAttribute()
    {
        $prApproved = $this->getRawOriginal('approved_date'); // tanggal dari DB
        // Ambil tanggal approved_date dari tracking pertama yang memiliki purchase_request valid
        $poApproved = $this->tracking
            ->filter(fn($tracking) => $tracking->purchase_order?->approved_date)
            ->first()?->purchase_order?->getRawOriginal('approved_date');

        if (!$prApproved || !$poApproved) {
            return null;
        }

        $start = Carbon::parse($prApproved);
        $end = Carbon::parse($poApproved);

        return CarbonPeriod::create($start, $end)
            ->filter(fn($date) => $date->isWeekday())
            ->count();
    }


    public function getSlaBadgeAttribute(): string
    {
        $days = $this->working_days;

        if (is_null($days)) {
            return 'bg-gray-400';
        }

        return $days > 7 ? 'bg-red-500' : 'bg-green-500';
    }
    protected function approvedDate(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->translatedFormat('d-M-y'),
        );
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
