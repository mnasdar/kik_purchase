<?php

namespace App\Models\Purchase;

use App\Models\User;
use App\Models\Config\Supplier;
use App\Models\Invoice\Invoice;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class PurchaseOrder
 * Model untuk mengelola data purchase order (pesanan pembelian)
 * 
 * @package App\Models\Purchase
 */
class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Tabel yang terhubung dengan model ini
     * 
     * @var string
     */
    protected $table = 'purchase_orders';

    /**
     * Kolom yang dapat diisi secara massal
     * 
     * @var array
     */
    protected $fillable = [
        'po_number',
        'approved_date',
        'supplier_id',
        'notes',
        'created_by',
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
        'approved_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relasi many-to-one dengan Supplier
     * Satu purchase order untuk satu supplier
     * 
     * @return BelongsTo
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    /**
     * Relasi many-to-one dengan User
     * Purchase order dibuat oleh satu user
     * 
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relasi one-to-many dengan PurchaseOrderItem
     * Satu purchase order dapat memiliki banyak item
     * 
     * @return HasMany
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class, 'purchase_order_id');
    }

    /**
     * Relasi one-to-many dengan Invoice
     * Satu purchase order dapat memiliki banyak invoice
     * 
     * @return HasMany
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'purchase_order_id');
    }
}
