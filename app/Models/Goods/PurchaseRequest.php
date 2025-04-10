<?php

namespace App\Models\Goods;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class PurchaseRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'status',
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

    // Format tanggal approve
    protected function approvedDate(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->translatedFormat('d-M-y'),
        );
    }

    public function tracking()
    {
        return $this->hasOne(PurchaseTracking::class, 'pr_number', 'pr_number');
    }

    public function purchaseOrder()
    {
        return $this->hasOneThrough(
            PurchaseOrder::class,
            PurchaseTracking::class,
            'pr_number',        // Foreign key on PurchaseTracking
            'po_number',        // Foreign key on PurchaseOrder
            'pr_number',        // Local key on PurchaseRequest
            'po_number'         // Local key on PurchaseTracking
        );
    }

    public function getWorkingDaysAttribute()
    {
        $prApproved = $this->getRawOriginal('approved_date'); // tanggal dari DB
        $poApproved = $this->purchaseOrder?->getRawOriginal('approved_date');

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
}
