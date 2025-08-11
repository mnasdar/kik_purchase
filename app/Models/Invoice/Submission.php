<?php

namespace App\Models\Invoice;

use Carbon\Carbon;
use App\Models\Purchase\PurchaseOrder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Submission extends Model
{
    use HasFactory;
    protected $fillable = [
        'invoice_number',
        'received_at',
        'invoice_date',
    ];
    public function purchase_orders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }
    protected function receivedAt(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->translatedFormat('d-M-y'),
        );
    }
    protected function invoiceDate(): Attribute
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
