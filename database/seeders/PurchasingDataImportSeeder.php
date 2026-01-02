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

class PurchasingDataImportSeeder extends Seeder
{
    /**
     * Jalankan seeder import CSV purchasing_data_pr_po.csv
     */
    public function run(): void
    {
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
            $key = strtolower(preg_replace('/\s+/', ' ', trim($name)));
            if ($key !== '') {
                $headerIndex[$key] = $i;
            }
        }

        // Helper untuk ambil nilai berdasarkan nama kolom
        $getCell = function (array $row, string $name) use ($headerIndex): ?string {
            $key = strtolower(preg_replace('/\s+/', ' ', trim($name)));
            if (!array_key_exists($key, $headerIndex)) {
                return null;
            }
            $idx = $headerIndex[$key];
            return array_key_exists($idx, $row) ? (is_string($row[$idx]) ? trim($row[$idx]) : $row[$idx]) : null;
        };
        $imported = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            // Lewati baris kosong
            if (count(array_filter($row, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }

            // Ambil nilai berdasarkan nama kolom pada CSV agar akurat
            $classificationIdRaw = $getCell($row, 'classifications~classification_id');
            $prNumber = $getCell($row, 'purchase_requests~pr_number');
            $locationName = $getCell($row, 'purchase_requests~location_id');
            $prItemDesc = $getCell($row, 'purchase_request_items~item_desc');
            $prItemUom = $getCell($row, 'purchase_request_items~uom');
            $prApprovedDate = $getCell($row, 'purchase_requests~approved_date');
            $prUnitPrice = $getCell($row, 'purchase_request_items~unit_price');
            $prQty = $getCell($row, 'purchase_request_items~quantity');
            $prAmount = $getCell($row, 'purchase_request_items~amount');
            $status = $getCell($row, 'Status');
            $poNumber = $getCell($row, 'purchase_orders~po_number');
            $poApprovedDate = $getCell($row, 'purchase_orders~approved_date');
            $supplierName = $getCell($row, 'purchase_orders~supplier_id');
            $poQty = $getCell($row, 'purchase_order_items~quantity');
            $poUnitPrice = $getCell($row, 'purchase_order_items~unit_price');
            $poAmount = $getCell($row, 'purchase_order_items~amount');
            $poCostSaving = $getCell($row, 'purchase_order_items~cost_saving');
            $prSlaTarget = $getCell($row, 'purchase_request_items~sla_pr_to_po_target');
            $poSlaRealization = $getCell($row, 'purchase_order_items~sla_pr_to_po_realization');

            if (empty($prNumber)) {
                $skipped++;
                continue;
            }

            // Prepare master data
            // Parse classification_id from CSV
            $classificationId = null;
            if ($classificationIdRaw !== null && $classificationIdRaw !== '') {
                $trimmed = trim((string) $classificationIdRaw);
                if ($trimmed !== '' && is_numeric($trimmed)) {
                    $classificationId = (int) $trimmed;
                }
            }

            $normalizedLocation = $this->normalizeLocationName($locationName);
            $location = Location::firstOrCreate(['name' => $normalizedLocation]);

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

            // Sinkronkan lokasi/tanggal jika sebelumnya kosong
            $purchaseRequest->location_id = $purchaseRequest->location_id ?: $location->id;
            $purchaseRequest->approved_date = $purchaseRequest->approved_date ?: $prApprovedDateParsed;
            $purchaseRequest->save();

            // Buat item PR
            $prUnitPriceNum = $this->parseNumber($prUnitPrice) ?? 0;
            $prQtyNum = (int) ($this->parseNumber($prQty) ?? 0);
            $prAmountNum = $this->parseNumber($prAmount) ?? ($prUnitPriceNum * $prQtyNum);

            $prItem = PurchaseRequestItem::create([
                'classification_id' => $classificationId,
                'purchase_request_id' => $purchaseRequest->id,
                'item_desc' => $prItemDesc ?: 'Item',
                'uom' => $prItemUom ?: 'Unit',
                'unit_price' => $prUnitPriceNum,
                'quantity' => $prQtyNum,
                'amount' => $prAmountNum,
                'current_stage' => 1, // Default stage: PR Created
            ]);

            // Simpan SLA target PR->PO ke tabel PR items jika tersedia di CSV
            $prSlaTargetNum = $this->parseNumber($prSlaTarget);
            if ($prSlaTargetNum !== null) {
                $prItem->sla_pr_to_po_target = (int) $prSlaTargetNum;
                $prItem->save();
            }

            $po = null;
            $poItem = null;

            if (!empty($poNumber)) {
                $supplier = Supplier::firstOrCreate(
                    ['name' => $supplierName ?: 'Unknown Supplier'],
                    ['supplier_type' => 'Company']
                );

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

                // Update supplier/tanggal jika belum terisi
                if (!$po->supplier_id && $supplier->id) {
                    $po->supplier_id = $supplier->id;
                }
                if (!$po->approved_date && $poApprovedDateParsed) {
                    $po->approved_date = $poApprovedDateParsed;
                }
                $po->save();

                $poQtyNum = (int) ($this->parseNumber($poQty) ?? 0);
                $poUnitPriceNum = $this->parseNumber($poUnitPrice) ?? 0;
                $poAmountNum = $this->parseNumber($poAmount) ?? ($poQtyNum * $poUnitPriceNum);
                $poCostSavingNum = $this->parseNumber($poCostSaving);
                $poSlaRealizationNum = $this->parseNumber($poSlaRealization);

                $poItem = PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'purchase_request_item_id' => $prItem->id,
                    'unit_price' => $poUnitPriceNum,
                    'quantity' => $poQtyNum,
                    'amount' => $poAmountNum,
                    'cost_saving' => $poCostSavingNum,
                    // Sesuai CSV: realisasi SLA PR->PO disimpan di PO items
                    'sla_pr_to_po_realization' => $poSlaRealizationNum,
                ]);
            }

            // Update PR Item current_stage based on PO status
            if ($po && $poItem) {
                // If PO exists, stage is at least 2 (PO Linked)
                $prItem->current_stage = 2;
                $prItem->save();
            }

            $imported++;
        }

        fclose($handle);

        $this->command?->info("Import selesai. Rows imported: {$imported}, skipped: {$skipped}");
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
