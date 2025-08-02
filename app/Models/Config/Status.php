<?php

namespace App\Models\Config;

use App\Models\Barang\PurchaseOrder;
use App\Models\Barang\PurchaseRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Status extends Model
{
    use HasFactory;
    protected $fillable = ['type','name'];

    public function purchaseRequests()
    {
        return $this->hasMany(PurchaseRequest::class);
    }
    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
