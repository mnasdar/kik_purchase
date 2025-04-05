<?php

namespace App\Models\Goods;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    public function classification()
    {
        return $this->belongsTo(Classification::class);
    }
    public function status()
    {
        return $this->belongsTo(Status::class);
    }
}
