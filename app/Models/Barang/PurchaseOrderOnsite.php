<?php

namespace App\Models\Barang;

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
}
