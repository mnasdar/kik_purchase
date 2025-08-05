<?php

namespace App\Models\Config;

use Illuminate\Support\Carbon;
use App\Models\Barang\PurchaseRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Location extends Model
{
    use HasFactory;
    protected $fillable = ['name'];
    public function purchaseRequests()
    {
        return $this->hasMany(PurchaseRequest::class);
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
