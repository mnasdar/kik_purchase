<?php

namespace App\Models\Config;

use App\Models\Barang\PurchaseRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Classification extends Model
{
    use HasFactory;
    protected $fillable = ['type','name','sla'];

    public function purchaseRequests()
    {
        return $this->hasMany(PurchaseRequest::class);
    }
}
