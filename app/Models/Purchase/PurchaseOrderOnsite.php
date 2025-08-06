<?php

namespace App\Models\Purchase;

use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseOrderOnsite extends Model
{
    use HasFactory;
    protected $fillable = [
        'onsite_number',
        'purchase_order_id',
        'tgl_terima',
    ];
    public function purchase_orders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }
    protected function tglTerima(): Attribute
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
