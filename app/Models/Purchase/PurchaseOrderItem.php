<?php

namespace App\Models\Purchase;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class PurchaseOrderItem
 * Model untuk mengelola item/detail dari purchase order
 * 
 * @package App\Models\Purchase
 */
class PurchaseOrderItem extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Tabel yang terhubung dengan model ini
     * 
     * @var string
     */
    protected $table = 'purchase_order_items';

    /**
     * Kolom yang dapat diisi secara massal
     * 
     * @var array
     */
    protected $fillable = [
        'purchase_order_id',
        'purchase_request_item_id',
        'unit_price',
        'quantity',
        'amount',
        'cost_saving',
        'sla_pr_to_po_realization',
        'sla_po_to_onsite_target',
    ];

    /**
     * Kolom yang disembunyikan dari output
     * 
     * @var array
     */
    protected $hidden = ['deleted_at'];

    /**
     * Kolom yang perlu di-cast ke tipe data tertentu
     * 
     * @var array
     */
    protected $casts = [
        'unit_price' => 'decimal:0',
        'amount' => 'decimal:0',
        'cost_saving' => 'decimal:0',
        'sla_pr_to_po_realization' => 'integer',
        'sla_po_to_onsite_target' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relasi many-to-one dengan PurchaseOrder
     * Setiap item belong to satu purchase order
     * 
     * @return BelongsTo
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    /**
     * Relasi one-to-many dengan PurchaseOrderOnsite
     * Satu item purchase order dapat memiliki banyak onsite record
     * 
     * @return HasMany
     */
    public function onsites(): HasMany
    {
        return $this->hasMany(PurchaseOrderOnsite::class, 'purchase_order_items_id');
    }
    /**
     * Relasi many-to-one dengan PurchaseRequestItem
     * Setiap item belong to satu purchase request item
     * 
     * @return BelongsTo
     */
    public function purchaseRequestItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequestItem::class, 'purchase_request_item_id');
    }
}
