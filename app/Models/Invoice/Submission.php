<?php

namespace App\Models\Invoice;

use Carbon\Carbon;
use App\Models\Purchase\PurchaseOrder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Submission extends Model
{
    use HasFactory;
     protected $fillable = [
        'purchase_order_id',
        'invoice_number',
        'received_at',
        'invoice_date',
    ];
    public function purchase_orders()
    {
        return $this->hasMany(PurchaseOrder::class);
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
