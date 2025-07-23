<?php

namespace App\Models\Barang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classification extends Model
{
    use HasFactory;
    protected $fillable = ['type','name'];

    public function purchaseRequests()
    {
        return $this->hasMany(PurchaseRequest::class);
    }
}
