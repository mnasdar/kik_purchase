<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use App\Models\Config\Location;
use App\Models\Config\Supplier;
use App\Models\Config\Classification;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Purchase\PurchaseRequestItem;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseOrderItem;
use App\Models\Purchase\PurchaseOrderOnsite;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\Payment;

class PurchasingDataImportSeeder extends Seeder
{
    // Statistics tracking
    private $stats = [
        'purchase_requests' => ['created' => 0, 'updated' => 0],
        'purchase_request_items' => ['created' => 0, 'skipped' => 0],
        'purchase_orders' => ['created' => 0, 'updated' => 0],
        'purchase_order_items' => ['created' => 0, 'skipped' => 0],
        'purchase_order_onsites' => ['created' => 0, 'skipped' => 0],
        'invoices' => ['created' => 0, 'skipped' => 0],
        'payments' => ['created' => 0, 'skipped' => 0],
        'locations' => ['created' => 0],
        'suppliers' => ['created' => 0],
        'classifications' => ['found' => 0, 'null' => 0],
        'relationships' => ['pr_to_po' => 0, 'po_to_onsite' => 0, 'onsite_to_invoice' => 0, 'invoice_to_payment' => 0],
        'rows_processed' => 0,
        'rows_skipped' => 0,
    ];

    private $errors = [];

    /**
     * Jalankan seeder import CSV purchasing_data_pr_po.csv
     */
    public function run(): void
    {
        $this->command?->info('=== Memulai Import Data Purchasing ===');
        $startTime = microtime(true);

        $path = base_path('database/purchasing_data_pr_po.csv');
        if (!file_exists($path)) {
            $this->command?->warn("File CSV tidak ditemukan: {$path}");
            return;
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            $this->command?->error('Gagal membuka file CSV');
            return;
        }

        // Baca header dan siapkan index kolom berdasarkan nama (dinamis mengikuti CSV)
        $rawHeader = fgetcsv($handle) ?: [];
        $header = array_map(fn ($h) => trim((string) $h), $rawHeader);
        $headerIndex = [];
        foreach ($header as $i => $name) {
            // Hapus BOM (Byte Order Mark) jika ada di kolom pertama
            if ($i === 0) {
                $name = preg_replace('/^\x{FEFF}/u', '', $name); // Remove UTF-8 BOM
                $name = preg_replace('/^[\x00-\x1F\x7F-\xFF]{3}/', '', $name); // Remove other BOMs
            }
            
            $key = strtolower(preg_replace('/\s+/', ' ', trim($name)));
            if ($key !== '') {
                $headerIndex[$key] = $i;
            }
        }

        $this->command?->info("Kolom yang ditemukan: " . count($headerIndex));

        // Helper untuk ambil nilai berdasarkan nama kolom
        $getCell = function (array $row, string $name) use ($headerIndex): ?string {
            $key = strtolower(preg_replace('/\s+/', ' ', trim($name)));
            if (!array_key_exists($key, $headerIndex)) {
                return null;
            }
            $idx = $headerIndex[$key];
            $value = array_key_exists($idx, $row) ? $row[$idx] : null;
            
            // Pastikan return string atau null
            if ($value === null || $value === false) {
                return null;
            }
            
            return is_string($value) ? trim($value) : (string) $value;
        };

        $rowNumber = 1; // Header sudah dibaca

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;

            // Lewati baris kosong
            if (count(array_filter($row, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }

            try {
                $this->processRow($row, $getCell, $rowNumber);
                $this->stats['rows_processed']++;
            } catch (\Exception $e) {
                $this->stats['rows_skipped']++;
                $this->errors[] = "Baris {$rowNumber}: " . $e->getMessage();
                $this->command?->warn("Error pada baris {$rowNumber}: " . $e->getMessage());
            }
        }

        fclose($handle);

        $endTime = microtime(true);
        $executionTime = round($endTime - $startTime, 2);

        $this->printReport($executionTime);
    }

    /**
     * Process single row from CSV
     */
    private function processRow(array $row, callable $getCell, int $rowNumber): void
    {
        // Ambil nilai berdasarkan nama kolom pada CSV agar akurat
        $classificationIdRaw = $getCell($row, 'purchase_request_items~classification_id');
        $prNumber = $getCell($row, 'purchase_requests~pr_number');
        $locationName = $getCell($row, 'purchase_requests~location_id');
        $prApprovedDate = $getCell($row, 'purchase_requests~approved_date');
        
        // Purchase Request Items
        $prItemDesc = $getCell($row, 'purchase_request_items~item_desc');
        $prItemUom = $getCell($row, 'purchase_request_items~uom');
        $prUnitPrice = $getCell($row, 'purchase_request_items~unit_price');
        $prQty = $getCell($row, 'purchase_request_items~quantity');
        $prAmount = $getCell($row, 'purchase_request_items~amount');
        $prSlaTarget = $getCell($row, 'purchase_request_items~sla_pr_to_po_target');
        
        // Purchase Order
        $status = $getCell($row, 'Status');
        $poNumber = $getCell($row, 'purchase_orders~po_number');
        $poApprovedDate = $getCell($row, 'purchase_orders~approved_date');
        $supplierName = $getCell($row, 'purchase_orders~supplier_id');
        
        // Purchase Order Items
        $poQty = $getCell($row, 'purchase_order_items~quantity');
        $poUnitPrice = $getCell($row, 'purchase_order_items~unit_price');
        $poAmount = $getCell($row, 'purchase_order_items~amount');
        $poCostSaving = $getCell($row, 'purchase_order_items~cost_saving');
        $poSlaRealization = $getCell($row, 'purchase_order_items~sla_pr_to_po_realization');
        $poSlaPoToOnsiteTarget = $getCell($row, 'purchase_order_items~sla_po_to_onsite_target');
        
        // Purchase Order Onsite
        $onsiteDate = $getCell($row, 'purchase_order_onsites~onsite_date');
        $onsiteSlaRealization = $getCell($row, 'purchase_order_onsites~sla_po_to_onsite_realization');
        
        // Invoice
        $invoiceReceivedAt = $getCell($row, 'invoices~received_at');
        $invoiceSubmittedAt = $getCell($row, 'invoices~submitted_at');
        $invoiceSlaTarget = $getCell($row, 'invoices~sla_invoice_to_finance_target');
        $invoiceSlaRealization = $getCell($row, 'invoices~sla_invoice_to_finance_realization');
        
        // Payment
        $paymentDate = $getCell($row, 'payments~payment_date');
        $paymentSla = $getCell($row, 'payments~sla_payment');

        // Validasi: PR Number wajib ada
        if (empty($prNumber)) {
            throw new \Exception("PR Number kosong");
        }

        // ===== IMPORT PURCHASE REQUEST =====
        $purchaseRequest = $this->importPurchaseRequest(
            $prNumber,
            $locationName,
            $prApprovedDate
        );

        // ===== IMPORT PURCHASE REQUEST ITEM =====
        $prItem = $this->importPurchaseRequestItem(
            $purchaseRequest,
            $classificationIdRaw,
            $prItemDesc,
            $prItemUom,
            $prUnitPrice,
            $prQty,
            $prAmount,
            $prSlaTarget
        );

        // ===== IMPORT PURCHASE ORDER & ITEMS =====
        $poItem = null;
        if (!empty($poNumber)) {
            $po = $this->importPurchaseOrder(
                $poNumber,
                $supplierName,
                $poApprovedDate
            );

            $poItem = $this->importPurchaseOrderItem(
                $po,
                $prItem,
                $poQty,
                $poUnitPrice,
                $poAmount,
                $poCostSaving,
                $poSlaRealization,
                $poSlaPoToOnsiteTarget
            );

            // Update PR Item stage
            $prItem->current_stage = 2; // PO Created
            $prItem->save();
            
            $this->stats['relationships']['pr_to_po']++;
        }

        // ===== IMPORT PURCHASE ORDER ONSITE =====
        $onsite = null;
        if ($poItem) {
            $onsiteDateParsed = $this->parseDate($onsiteDate);
            if ($onsiteDateParsed) {
                $onsite = $this->importPurchaseOrderOnsite(
                    $poItem,
                    $onsiteDateParsed,
                    $onsiteSlaRealization
                );
                
                // Update PR Item stage
                $prItem->current_stage = 3; // Onsite Done
                $prItem->save();
                
                $this->stats['relationships']['po_to_onsite']++;
            }
        }

        // ===== IMPORT INVOICE =====
        $invoice = null;
        if ($onsite) {
            $receivedAtParsed = $this->parseDate($invoiceReceivedAt);
            $submittedAtParsed = $this->parseDate($invoiceSubmittedAt);
            
            // Jika ada minimal satu tanggal (received atau submitted), buat invoice
            if ($receivedAtParsed || $submittedAtParsed) {
                $invoice = $this->importInvoice(
                    $onsite,
                    $receivedAtParsed,
                    $submittedAtParsed,
                    $invoiceSlaTarget,
                    $invoiceSlaRealization
                );
                
                // Update PR Item stage
                $prItem->current_stage = 4; // Invoice Submitted
                $prItem->save();
                
                $this->stats['relationships']['onsite_to_invoice']++;
            }
        }

        // ===== IMPORT PAYMENT =====
        if ($invoice) {
            $paymentDateParsed = $this->parseDate($paymentDate);
            if ($paymentDateParsed) {
                $this->importPayment(
                    $invoice,
                    $paymentDateParsed,
                    $paymentSla
                );
                
                // Update PR Item stage
                $prItem->current_stage = 5; // Payment Done
                $prItem->save();
                
                $this->stats['relationships']['invoice_to_payment']++;
            }
        }
    }

    /**
     * Import Purchase Request
     */
    private function importPurchaseRequest(
        string $prNumber,
        ?string $locationName,
        ?string $prApprovedDate
    ): PurchaseRequest {
        $normalizedLocation = $this->normalizeLocationName($locationName);
        $location = Location::firstOrCreate(['name' => $normalizedLocation]);
        
        if ($location->wasRecentlyCreated) {
            $this->stats['locations']['created']++;
        }

        $prApprovedDateParsed = $this->parseDate($prApprovedDate) ?? Carbon::today()->toDateString();

        $purchaseRequest = PurchaseRequest::firstOrCreate(
            ['pr_number' => $prNumber],
            [
                'request_type' => 'barang',
                'location_id' => $location->id,
                'approved_date' => $prApprovedDateParsed,
                'notes' => null,
                'created_by' => 1,
            ]
        );

        if ($purchaseRequest->wasRecentlyCreated) {
            $this->stats['purchase_requests']['created']++;
        } else {
            // Update if necessary
            $updated = false;
            if (!$purchaseRequest->location_id && $location->id) {
                $purchaseRequest->location_id = $location->id;
                $updated = true;
            }
            if (!$purchaseRequest->approved_date && $prApprovedDateParsed) {
                $purchaseRequest->approved_date = $prApprovedDateParsed;
                $updated = true;
            }
            if ($updated) {
                $purchaseRequest->save();
                $this->stats['purchase_requests']['updated']++;
            }
        }

        return $purchaseRequest;
    }

    /**
     * Import Purchase Request Item
     */
    private function importPurchaseRequestItem(
        PurchaseRequest $purchaseRequest,
        ?string $classificationIdRaw,
        ?string $itemDesc,
        ?string $uom,
        ?string $unitPrice,
        ?string $qty,
        ?string $amount,
        ?string $slaTarget
    ): PurchaseRequestItem {
        // Parse classification_id - gunakan parseNumber untuk lebih robust
        $classificationId = null;
        if ($classificationIdRaw !== null && $classificationIdRaw !== '') {
            $parsedNum = $this->parseNumber($classificationIdRaw);
            if ($parsedNum !== null && $parsedNum > 0) {
                $classificationId = (int) $parsedNum;
                $this->stats['classifications']['found']++;
            } else {
                $this->stats['classifications']['null']++;
            }
        } else {
            $this->stats['classifications']['null']++;
        }

        $unitPriceNum = $this->parseNumber($unitPrice) ?? 0;
        $qtyNum = (int) ($this->parseNumber($qty) ?? 0);
        $amountNum = $this->parseNumber($amount) ?? ($unitPriceNum * $qtyNum);
        $slaTargetNum = $this->parseNumber($slaTarget);

        $prItem = PurchaseRequestItem::create([
            'classification_id' => $classificationId,
            'purchase_request_id' => $purchaseRequest->id,
            'item_desc' => $itemDesc ?: 'Item',
            'uom' => $uom ?: 'Unit',
            'unit_price' => $unitPriceNum,
            'quantity' => $qtyNum,
            'amount' => $amountNum,
            'current_stage' => 1, // Default stage: PR Created
            'sla_pr_to_po_target' => $slaTargetNum,
        ]);

        $this->stats['purchase_request_items']['created']++;

        return $prItem;
    }

    /**
     * Import Purchase Order
     */
    private function importPurchaseOrder(
        string $poNumber,
        ?string $supplierName,
        ?string $poApprovedDate
    ): PurchaseOrder {
        $supplier = Supplier::firstOrCreate(
            ['name' => $supplierName ?: 'Unknown Supplier'],
            ['supplier_type' => 'Company']
        );
        
        if ($supplier->wasRecentlyCreated) {
            $this->stats['suppliers']['created']++;
        }

        $poApprovedDateParsed = $this->parseDate($poApprovedDate) ?? Carbon::today()->toDateString();

        $po = PurchaseOrder::firstOrCreate(
            ['po_number' => $poNumber],
            [
                'supplier_id' => $supplier->id,
                'approved_date' => $poApprovedDateParsed,
                'notes' => null,
                'created_by' => 1,
            ]
        );

        if ($po->wasRecentlyCreated) {
            $this->stats['purchase_orders']['created']++;
        } else {
            // Update if necessary
            $updated = false;
            if (!$po->supplier_id && $supplier->id) {
                $po->supplier_id = $supplier->id;
                $updated = true;
            }
            if (!$po->approved_date && $poApprovedDateParsed) {
                $po->approved_date = $poApprovedDateParsed;
                $updated = true;
            }
            if ($updated) {
                $po->save();
                $this->stats['purchase_orders']['updated']++;
            }
        }

        return $po;
    }

    /**
     * Import Purchase Order Item
     */
    private function importPurchaseOrderItem(
        PurchaseOrder $po,
        PurchaseRequestItem $prItem,
        ?string $qty,
        ?string $unitPrice,
        ?string $amount,
        ?string $costSaving,
        ?string $slaRealization,
        ?string $slaPoToOnsiteTarget = null
    ): PurchaseOrderItem {
        $qtyNum = (int) ($this->parseNumber($qty) ?? 0);
        $unitPriceNum = $this->parseNumber($unitPrice) ?? 0;
        $amountNum = $this->parseNumber($amount) ?? ($qtyNum * $unitPriceNum);
        $costSavingNum = $this->parseNumber($costSaving);
        $slaRealizationNum = $this->parseNumber($slaRealization);
        $slaPoToOnsiteTargetNum = $this->parseNumber($slaPoToOnsiteTarget);

        $poItem = PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'purchase_request_item_id' => $prItem->id,
            'unit_price' => $unitPriceNum,
            'quantity' => $qtyNum,
            'amount' => $amountNum,
            'cost_saving' => $costSavingNum,
            'sla_pr_to_po_realization' => $slaRealizationNum,
            'sla_po_to_onsite_target' => $slaPoToOnsiteTargetNum,
        ]);

        $this->stats['purchase_order_items']['created']++;

        return $poItem;
    }

    /**
     * Import Purchase Order Onsite
     */
    private function importPurchaseOrderOnsite(
        PurchaseOrderItem $poItem,
        string $onsiteDate,
        ?string $slaRealization
    ): PurchaseOrderOnsite {
        $slaRealizationNum = $this->parseNumber($slaRealization);

        $onsite = PurchaseOrderOnsite::create([
            'purchase_order_items_id' => $poItem->id,
            'onsite_date' => $onsiteDate,
            'sla_po_to_onsite_realization' => $slaRealizationNum,
            'created_by' => 1,
        ]);

        $this->stats['purchase_order_onsites']['created']++;

        return $onsite;
    }

    /**
     * Import Invoice
     */
    private function importInvoice(
        PurchaseOrderOnsite $onsite,
        ?string $receivedAt,
        ?string $submittedAt,
        ?string $slaTarget,
        ?string $slaRealization
    ): Invoice {
        $slaTargetNum = $this->parseNumber($slaTarget) ?? 5; // Default 5 hari
        $slaRealizationNum = $this->parseNumber($slaRealization);

        $invoice = Invoice::create([
            'purchase_order_onsite_id' => $onsite->id,
            // Biarkan kosong sesuai permintaan
            'invoice_number' => null,
            'invoice_received_at' => $receivedAt,
            'invoice_submitted_at' => $submittedAt,
            'sla_invoice_to_finance_target' => $slaTargetNum,
            'sla_invoice_to_finance_realization' => $slaRealizationNum,
            'created_by' => 1,
        ]);

        $this->stats['invoices']['created']++;

        return $invoice;
    }

    /**
     * Import Payment
     */
    private function importPayment(
        Invoice $invoice,
        string $paymentDate,
        ?string $sla
    ): Payment {
        $slaNum = $this->parseNumber($sla);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            // Biarkan kosong sesuai permintaan
            'payment_number' => null,
            'payment_date' => $paymentDate,
            'sla_payment' => $slaNum,
            'created_by' => 1,
        ]);

        $this->stats['payments']['created']++;

        return $payment;
    }

    /**
     * Print comprehensive report
     */
    private function printReport(float $executionTime): void
    {
        $this->command?->newLine();
        $this->command?->info('=== LAPORAN IMPORT DATA PURCHASING ===');
        $this->command?->newLine();
        
        $this->command?->info("⏱️  Waktu Eksekusi: {$executionTime} detik");
        $this->command?->info("📊 Total Baris Diproses: {$this->stats['rows_processed']}");
        $this->command?->info("⚠️  Total Baris Dilewati: {$this->stats['rows_skipped']}");
        $this->command?->newLine();

        $this->command?->info('--- MASTER DATA ---');
        $this->command?->info("📍 Locations Created: {$this->stats['locations']['created']}");
        $this->command?->info("🏢 Suppliers Created: {$this->stats['suppliers']['created']}");
        $this->command?->info("🏷️  Classifications Found: {$this->stats['classifications']['found']}");
        $this->command?->info("⚠️  Classifications Null: {$this->stats['classifications']['null']}");
        $this->command?->newLine();

        $this->command?->info('--- PURCHASE REQUESTS ---');
        $this->command?->info("✅ PR Created: {$this->stats['purchase_requests']['created']}");
        $this->command?->info("♻️  PR Updated: {$this->stats['purchase_requests']['updated']}");
        $this->command?->info("📝 PR Items Created: {$this->stats['purchase_request_items']['created']}");
        $this->command?->newLine();

        $this->command?->info('--- PURCHASE ORDERS ---');
        $this->command?->info("✅ PO Created: {$this->stats['purchase_orders']['created']}");
        $this->command?->info("♻️  PO Updated: {$this->stats['purchase_orders']['updated']}");
        $this->command?->info("📝 PO Items Created: {$this->stats['purchase_order_items']['created']}");
        $this->command?->newLine();

        $this->command?->info('--- ONSITE & DELIVERIES ---');
        $this->command?->info("✅ Onsites Created: {$this->stats['purchase_order_onsites']['created']}");
        $this->command?->info("⚠️  Onsites Skipped: {$this->stats['purchase_order_onsites']['skipped']}");
        $this->command?->newLine();

        $this->command?->info('--- INVOICES & PAYMENTS ---');
        $this->command?->info("✅ Invoices Created: {$this->stats['invoices']['created']}");
        $this->command?->info("⚠️  Invoices Skipped: {$this->stats['invoices']['skipped']}");
        $this->command?->info("✅ Payments Created: {$this->stats['payments']['created']}");
        $this->command?->info("⚠️  Payments Skipped: {$this->stats['payments']['skipped']}");
        $this->command?->newLine();

        $this->command?->info('--- RELASI YANG TERBENTUK ---');
        $this->command?->info("🔗 PR → PO: {$this->stats['relationships']['pr_to_po']}");
        $this->command?->info("🔗 PO → Onsite: {$this->stats['relationships']['po_to_onsite']}");
        $this->command?->info("🔗 Onsite → Invoice: {$this->stats['relationships']['onsite_to_invoice']}");
        $this->command?->info("🔗 Invoice → Payment: {$this->stats['relationships']['invoice_to_payment']}");
        $this->command?->newLine();

        if (count($this->errors) > 0) {
            $this->command?->warn('--- ERROR LOG (10 terakhir) ---');
            $errorCount = count($this->errors);
            $displayErrors = array_slice($this->errors, -10);
            foreach ($displayErrors as $error) {
                $this->command?->error($error);
            }
            if ($errorCount > 10) {
                $this->command?->warn("... dan " . ($errorCount - 10) . " error lainnya");
            }
            $this->command?->newLine();
        }

        $this->command?->info('=== IMPORT SELESAI ===');
    }

    /**
     * Check if date string is valid
     */
    private function isValidDate(?string $value): bool
    {
        if ($value === null || trim($value) === '') {
            return false;
        }
        return $this->parseDate($value) !== null;
    }

    private function parseNumber($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_numeric($value)) {
            return (float) $value;
        }

        $str = (string) $value;
        $clean = preg_replace('/[^\d\.-]/', '', $str);
        // Perlakukan nilai seperti '-' atau '--' sebagai null
        if ($clean === '' || $clean === null || preg_match('/^-+$/', $clean)) {
            return null;
        }

        return (float) $clean;
    }

    private function parseDate($value): ?string
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }

        $value = trim((string) $value);
        
        // Cek jika adalah Excel serial number (numeric)
        if (is_numeric($value)) {
            $excelSerialNumber = (int) $value;
            // Excel serial number 0 = 1900-01-00 (invalid)
            // Excel serial number 1 = 1900-01-01
            if ($excelSerialNumber > 0) {
                // Basis Excel serial number adalah 1900-01-01
                $baseDate = new \DateTime('1899-12-30');
                $baseDate->add(new \DateInterval('P' . $excelSerialNumber . 'D'));
                return $baseDate->format('Y-m-d');
            }
        }
        
        // Coba format tanggal standar
        $formats = [
            'Y-m-d', 'd-m-Y', 'd/m/Y', 'm/d/Y', 'd-M-y', 'd-M-Y', 'j-M-y', 'j-M-Y',
        ];

        foreach ($formats as $format) {
            try {
                return Carbon::createFromFormat($format, $value)->toDateString();
            } catch (\Throwable $e) {
                // try next
            }
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function normalizeLocationName(?string $name): string
    {
        if (!$name) {
            return 'Head Office KIK';
        }

        $normalized = trim($name);
        $normalized = rtrim($normalized, '.');
        
        // Mapping dari CSV location names ke location master
        $locationMap = [
            'HEAD OFFICE KIK' => 'Head Office KIK',
            'KIK WISMA KALLA' => 'Wisma Kalla',
            'KIK BRANCH MALL NIPAH' => 'Nipah Mall',
            'KIK BRANCH MALL RATU INDAH' => 'Mall Ratu Indah',
        ];
        
        $upperNormalized = strtoupper($normalized);
        return $locationMap[$upperNormalized] ?? 'Head Office KIK';
    }

}
