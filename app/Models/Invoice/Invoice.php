<?php

namespace App\Models\Invoice;

use App\Models\User;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseOrderOnsite;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class Invoice
 * Model untuk mengelola data invoice dari supplier
 * 
 * @package App\Models\Invoice
 */
class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Tabel yang terhubung dengan model ini
     * 
     * @var string
     */
    protected $table = 'invoices';

    /**
     * Kolom yang dapat diisi secara massal
     * 
     * @var array
     */
    protected $fillable = [
        'purchase_order_onsite_id',
        'invoice_number',
        'invoice_received_at',
        'sla_invoice_to_finance_target',
        'invoice_submitted_at',
        'sla_invoice_to_finance_realization',
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
        'invoice_received_at' => 'date',
        'invoice_submitted_at' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relasi many-to-one dengan PurchaseOrderOnsite
     * Satu invoice untuk satu PO onsite
     * 
     * @return BelongsTo
     */
    public function purchaseOrderOnsite(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderOnsite::class, 'purchase_order_onsite_id');
    }

    /**
     * Relasi many-to-one dengan PurchaseOrder (via PO Onsite)
     * Satu invoice untuk satu purchase order
     * 
     * @return BelongsTo
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    /**
     * Relasi many-to-one dengan User
     * Invoice dibuat oleh satu user
     * 
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relasi one-to-many dengan Payment
     * Satu invoice dapat memiliki banyak pembayaran
     * 
     * @return HasMany
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'invoice_id');
    }
}
