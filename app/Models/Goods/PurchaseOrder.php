<?php

namespace App\Models\Goods;

use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseOrder extends Model
{
    use HasFactory;
    protected $fillable = [
        'purchase_request_id',
        'po_number',
        'status',
        'approved_date',
        'supplier_name',
        'quantity',
        'unit_price',
        'amount',
    ];
    public function status()
    {
        return $this->belongsTo(Status::class);
    }
    public function trackings()
    {
        return $this->hasMany(PurchaseTracking::class);
    }

    protected function approvedDate(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->translatedFormat('d-M-y'),
        );
    }
}
