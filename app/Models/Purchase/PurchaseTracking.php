<?php

namespace App\Models\Purchase;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseTracking extends Model
{
    use HasFactory;
    protected $fillable = [
        'purchase_request_id',
        'purchase_order_id',
    ];
    public function purchase_request()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function purchase_order()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
    
}
