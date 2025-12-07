<?php

namespace App\Models\Purchase;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class PurchaseTracking
 * Model untuk mengelola tracking/relasi antara purchase request dan purchase order
 * 
 * @package App\Models\Purchase
 */
class PurchaseTracking extends Model
{
    use HasFactory;

    /**
     * Tabel yang terhubung dengan model ini
     * 
     * @var string
     */
    protected $table = 'purchase_trackings';

    /**
     * Kolom yang dapat diisi secara massal
     * 
     * @var array
     */
    protected $fillable = [
        'purchase_request_id',
        'purchase_order_id',
    ];

    /**
     * Update timestamp disabled untuk tabel ini
     * 
     * @var bool
     */
    public $timestamps = true;

    /**
     * Kolom yang perlu di-cast ke tipe data tertentu
     * 
     * @var array
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi many-to-one dengan PurchaseRequest
     * Tracking belong to satu purchase request
     * 
     * @return BelongsTo
     */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class, 'purchase_request_id');
    }

    /**
     * Relasi many-to-one dengan PurchaseOrder
     * Tracking belong to satu purchase order
     * 
     * @return BelongsTo
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }
}
