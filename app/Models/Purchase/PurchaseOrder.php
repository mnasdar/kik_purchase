<?php

namespace App\Models\Purchase;

use Carbon\CarbonPeriod;
use App\Models\Config\Status;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseOrder extends Model
{
    use HasFactory;
    protected $fillable = [
        'po_number',
        'status_id',
        'approved_date',
        'supplier_name',
        'quantity',
        'unit_price',
        'amount',
    ];
    protected $appends = ['working_days', 'sla_badge'];
    public function status()
    {
        return $this->belongsTo(Status::class);
    }
    public function trackings()
    {
        return $this->hasMany(PurchaseTracking::class);
    }
    public function onsite()
    {
        return $this->hasOne(PurchaseOrderOnsite::class);
    }
    protected function approvedDate(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->translatedFormat('d-M-y'),
        );
    }
    public function getWorkingDaysAttribute()
    {
        // Tanggal PO disetujui (dari field model saat ini)
        $poApproved = $this->getRawOriginal('approved_date');

        // Ambil tanggal terima dari relasi 'onsite'
        $tgl_terima = $this->onsite?->getRawOriginal('tgl_terima');

        if (!$poApproved || !$tgl_terima) {
            return null;
        }

        $start = Carbon::parse($poApproved);
        $end = Carbon::parse($tgl_terima);

        // Hitung jumlah hari kerja (weekday)
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
    public function getIsNewAttribute()
    {
        return $this->created_at && Carbon::parse($this->created_at)->greaterThan(Carbon::now()->subMinutes(5));
    }

    public function getIsUpdateAttribute()
    {
        return $this->updated_at && Carbon::parse($this->updated_at)->greaterThan(Carbon::now()->subMinutes(5));
    }
}
