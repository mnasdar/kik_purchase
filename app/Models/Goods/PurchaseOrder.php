<?php

namespace App\Models\Goods;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory;
    protected $fillable = [
        'po_number',
        'status',
        'location',
        'item_desc',
        'uom',
        'approved_date',
        'unit_price',
        'quantity',
        'amount',
    ];
    public function status()
    {
        return $this->belongsTo(Status::class);
    }
}
