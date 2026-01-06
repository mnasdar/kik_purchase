<?php

namespace App\Exports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Border;
use App\Models\Purchase\PurchaseRequestItem;
use App\Models\Purchase\PurchaseRequest;
use App\Models\Purchase\PurchaseOrderItem;
use App\Models\Purchase\PurchaseOrder;
use App\Models\Purchase\PurchaseOrderOnsite;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\Payment;
use Maatwebsite\Excel\Concerns\WithHeadings;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;

class PurchasingDataExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, ShouldAutoSize, WithEvents
{
    protected $startDate;
    protected $endDate;
    protected $userId;
    protected $filterType;

    /**
     * Constructor untuk inisialisasi parameter export
     * 
     * @param string $startDate Tanggal awal filter
     * @param string $endDate Tanggal akhir filter
     * @param int $userId ID user yang melakukan export
     * @param string $filterType Tipe filter: 'pr' atau 'po'
     */
    public function __construct($startDate, $endDate, $userId, $filterType = 'pr')
    {
        $this->startDate = Carbon::parse($startDate)->startOfDay();
        $this->endDate = Carbon::parse($endDate)->endOfDay();
        $this->userId = $userId;
        $this->filterType = $filterType;
    }

    /**
     * Mengambil collection data untuk di-export
     * Query data berdasarkan filter type (PR atau PO approved date)
     * dan location user yang login
     * 
     * @return Collection
     */
    public function collection()
    {
        $user = auth()->user();
        
        $query = PurchaseRequestItem::with([
            'purchaseRequest.location',
            'purchaseRequest.creator',
            'classification',
            'purchaseOrderItems.purchaseOrder.supplier',
            'purchaseOrderItems.onsites.invoice.payments'
        ]);

        // Filter berdasarkan tipe (PR atau PO approved date)
        if ($this->filterType === 'pr') {
            // Filter by PR approved_date
            $query->whereHas('purchaseRequest', function ($q) use ($user) {
                $q->whereBetween('approved_date', [$this->startDate, $this->endDate]);
                
                if ($user && $user->location_id) {
                    $q->where('location_id', $user->location_id);
                }
            });
        } else {
            // Filter by PO approved_date
            $query->whereHas('purchaseOrderItems.purchaseOrder', function ($q) {
                $q->whereBetween('approved_date', [$this->startDate, $this->endDate]);
            })
            ->whereHas('purchaseRequest', function ($q) use ($user) {
                if ($user && $user->location_id) {
                    $q->where('location_id', $user->location_id);
                }
            });
        }

        $query = $query->orderBy('created_at', 'desc')->get();

        $rows = collect([]);
        $no = 1;

        foreach ($query as $prItem) {
            $pr = $prItem->purchaseRequest;
            $poItems = $prItem->purchaseOrderItems;

            if ($poItems->isEmpty()) {
                $rows->push($this->buildRow($no, $prItem, $pr, null, null, null, null, null));
                $no++;
            } else {
                foreach ($poItems as $poItem) {
                    $po = $poItem->purchaseOrder;
                    $onsites = $poItem->onsites;

                    if ($onsites->isEmpty()) {
                        $rows->push($this->buildRow($no, $prItem, $pr, $poItem, $po, null, null, null));
                        $no++;
                    } else {
                        foreach ($onsites as $onsite) {
                            $invoice = $onsite->invoice;
                            $payment = $invoice ? $invoice->payments->first() : null;

                            $rows->push($this->buildRow($no, $prItem, $pr, $poItem, $po, $onsite, $invoice, $payment));
                            $no++;
                        }
                    }
                }
            }
        }

        return $rows;
    }

    /**
     * Membangun satu baris data untuk export
     * Mengurutkan kolom sesuai struktur yang diinginkan
     * 
     * @param int $no Nomor urut
     * @param PurchaseRequestItem $prItem Item PR
     * @param PurchaseRequest $pr Purchase Request
     * @param PurchaseOrderItem|null $poItem Item PO
     * @param PurchaseOrder|null $po Purchase Order
     * @param PurchaseOrderOnsite|null $onsite PO Onsite
     * @param Invoice|null $invoice Invoice
     * @param Payment|null $payment Payment
     * @return array
     */
    private function buildRow($no, $prItem, $pr, $poItem = null, $po = null, $onsite = null, $invoice = null, $payment = null)
    {
        $stages = PurchaseRequestItem::getStageLabels();
        $currentStage = $stages[$prItem->current_stage] ?? 'Unknown';
        
        // Calculate Cost Saving percentage
        $costSavingPercent = '-';
        if ($poItem && $prItem->amount > 0 && $poItem->cost_saving) {
            $costSavingPercent = round(($poItem->cost_saving / $prItem->amount) * 100, 2);
        }
        
        // Calculate PR to PO SLA percentage
        $prToPoPercent = '-';
        if ($poItem && $prItem->sla_pr_to_po_target > 0 && $poItem->sla_pr_to_po_realization !== null) {
            $prToPoPercent = $poItem->sla_pr_to_po_realization <= $prItem->sla_pr_to_po_target ? 100 : 0;
        }
        
        // Calculate PO to Onsite SLA percentage
        $poToOnsitePercent = '-';
        if ($onsite && $poItem && $poItem->sla_po_to_onsite_target > 0 && $onsite->sla_po_to_onsite_realization !== null) {
            $poToOnsitePercent = $onsite->sla_po_to_onsite_realization <= $poItem->sla_po_to_onsite_target ? 100 : 0;
        }
        
        // Calculate Invoice to Finance SLA percentage
        $invoicePercent = '-';
        if ($invoice && $invoice->sla_invoice_to_finance_target > 0 && $invoice->sla_invoice_to_finance_realization !== null) {
            $invoicePercent = $invoice->sla_invoice_to_finance_realization <= $invoice->sla_invoice_to_finance_target ? 100 : 0;
        }

        return [
            // Info (4 columns)
            $no,
            $pr->creator->name ?? '-',
            $currentStage,
            $prItem->classification->name ?? '-',
            
            // Purchase Request (8 columns)
            $pr->pr_number ?? '-',
            $pr->location->name ?? '-',
            $prItem->item_desc ?? '-',
            $prItem->uom ?? '-',
            $pr->approved_date ? Date::PHPToExcel($pr->approved_date) : '-',
            $prItem->unit_price ?? 0,
            $prItem->quantity ?? 0,
            $prItem->amount ?? 0,
            
            // Purchase Order (6 columns)
            $po ? $po->po_number : '-',
            $po && $po->approved_date ? Date::PHPToExcel($po->approved_date) : '-',
            $po && $po->supplier ? $po->supplier->name : '-',
            $poItem ? $poItem->quantity : '-',
            $poItem ? $poItem->unit_price : '-',
            $poItem ? $poItem->amount : '-',
            
            // Cost Saving (2 columns)
            $poItem ? ($poItem->cost_saving ?? '-') : '-',
            $costSavingPercent,
            
            // PR to PO (3 columns)
            $prItem->sla_pr_to_po_target ?? '-',
            $poItem ? ($poItem->sla_pr_to_po_realization ?? '-') : '-',
            $prToPoPercent,
            
            // PO to Onsite (4 columns)
            $onsite && $onsite->onsite_date ? Date::PHPToExcel($onsite->onsite_date) : '-',
            $poItem ? ($poItem->sla_po_to_onsite_target ?? '-') : '-',
            $onsite ? ($onsite->sla_po_to_onsite_realization ?? '-') : '-',
            $poToOnsitePercent,
            
            // Invoice to Finance (6 columns)
            $invoice ? ($invoice->invoice_number ?? '-') : '-',
            $invoice && $invoice->invoice_received_at ? Date::PHPToExcel($invoice->invoice_received_at) : '-',
            $invoice && $invoice->invoice_submitted_at ? Date::PHPToExcel($invoice->invoice_submitted_at) : '-',
            $invoice ? ($invoice->sla_invoice_to_finance_target ?? '-') : '-',
            $invoice ? ($invoice->sla_invoice_to_finance_realization ?? '-') : '-',
            $invoicePercent,
            
            // Payment (3 columns)
            $payment ? ($payment->payment_number ?? '-') : '-',
            $payment && $payment->payment_date ? Date::PHPToExcel($payment->payment_date) : '-',
            $payment ? ($payment->sla_payment ?? '-') : '-',
        ];
    }

    /**
     * Mengembalikan array header kolom untuk row 2
     * 
     * @return array
     */
    public function headings(): array
    {
        return [
            // Info
            'No',
            'Create By',
            'Status',
            'Classification',
            // Purchase Request
            'PR Number',
            'Location',
            'Item Description',
            'UOM',
            'PR Date',
            'Unit Price',
            'Quantity',
            'Amount',
            // Purchase Order
            'PO Number',
            'PO Date',
            'Supplier',
            'Quantity',
            'Unit Price',
            'Amount',
            // Cost Saving
            'Cost Saving',
            '%',
            // PR to PO SLA
            'SLA Target',
            'SLA Realisasi',
            '%',
            // PO to Onsite
            'Onsite Date',
            'SLA Target',
            'SLA Realisasi',
            '%',
            // Invoice to Finance
            'Invoice Number',
            'Received Date',
            'Submitted Date',
            'SLA Target',
            'SLA Realisasi',
            '%',
            // Payment
            'Payment Number',
            'Payment Date',
            'SLA Payment',
        ];
    }

    /**
     * Mengembalikan lebar kolom kustom
     * 
     * @return array
     */
    public function columnWidths(): array
    {
        return [
            'A' => 5,   // No
            'B' => 15,  // Create By
            'C' => 15,  // Status
            'D' => 18,  // Classification
            
            'E' => 15,  // PR Number
            'F' => 15,  // Location
            'G' => 30,  // Item Description
            'H' => 8,   // UOM
            'I' => 12,  // PR Date
            'J' => 12,  // PR Unit Price
            'K' => 10,  // PR Qty
            'L' => 15,  // PR Amount
            'M' => 15,  // PO Number
            'N' => 12,  // PO Date
            'O' => 20,  // Supplier Name
            'P' => 10,  // PO Qty
            'Q' => 12,  // PO Unit Price
            'R' => 15,  // PO Amount
            'S' => 12,  // Selisih
            'T' => 10,  // % Selisih
            'U' => 10,  // SLA Target (PR to PO)
            'V' => 12,  // SLA Realisasi (PR to PO)
            'W' => 8,   // % (PR to PO)
            'X' => 12,  // Onsite Date
            'Y' => 10,  // SLA Target (PO to Onsite)
            'Z' => 12,  // SLA Realisasi (PO to Onsite)
            'AA' => 8,  // % (PO to Onsite)
            'AB' => 15, // Invoice Number
            'AC' => 12, // Received Date
            'AD' => 12, // Submitted Date
            'AE' => 10, // SLA Target (Invoice)
            'AF' => 12, // SLA Realisasi (Invoice)
            'AG' => 8,  // % (Invoice)
            'AH' => 15, // Payment Number
            'AI' => 12, // Payment Date
            'AJ' => 10, // SLA Payment
        ];
    }

    /**
     * Styling untuk worksheet Excel
     * Mengatur format header, borders, number format, dan date format
     * 
     * @param Worksheet $worksheet
     * @return void
     */
    public function styles(Worksheet $worksheet)
    {
        $highestRow = $worksheet->getHighestRow();
        $highestColumn = $worksheet->getHighestColumn();

        $worksheet->getStyle('A1:' . $highestColumn . '1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true
            ]
        ]);

        $worksheet->getStyle('A1:' . $highestColumn . $highestRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        for ($row = 2; $row <= $highestRow; $row++) {
            // Number format for quantities and amounts
            $worksheet->getStyle('J' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $worksheet->getStyle('K' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $worksheet->getStyle('L' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $worksheet->getStyle('P' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $worksheet->getStyle('Q' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $worksheet->getStyle('R' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $worksheet->getStyle('S' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $worksheet->getStyle('T' . $row)->getNumberFormat()->setFormatCode('0.00"%"');
            
            // Percentage format for SLA columns
            $worksheet->getStyle('W' . $row)->getNumberFormat()->setFormatCode('0"%"');
            $worksheet->getStyle('AA' . $row)->getNumberFormat()->setFormatCode('0"%"');
            $worksheet->getStyle('AG' . $row)->getNumberFormat()->setFormatCode('0"%"');
            
            // Date format for date columns (dd-mmm-yy)
            $worksheet->getStyle('I' . $row)->getNumberFormat()->setFormatCode('dd-mmm-yy');
            $worksheet->getStyle('N' . $row)->getNumberFormat()->setFormatCode('dd-mmm-yy');
            $worksheet->getStyle('X' . $row)->getNumberFormat()->setFormatCode('dd-mmm-yy');
            $worksheet->getStyle('AC' . $row)->getNumberFormat()->setFormatCode('dd-mmm-yy');
            $worksheet->getStyle('AD' . $row)->getNumberFormat()->setFormatCode('dd-mmm-yy');
            $worksheet->getStyle('AI' . $row)->getNumberFormat()->setFormatCode('dd-mmm-yy');
        }

        $worksheet->getStyle('A:A')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $worksheet->getStyle('J:L')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $worksheet->getStyle('P:T')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
    }

    /**
     * Register event handlers untuk modifikasi worksheet
     * Menambahkan merged header di row 1 dan autofilter di row 2
     * 
     * @return array
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Insert new row at the top for merged headers
                $sheet->insertNewRowBefore(1, 1);
                
                $headerGroups = [
                    ['range' => 'A1:D1', 'title' => 'Info', 'color' => '7030A0'],
                    ['range' => 'E1:L1', 'title' => 'Purchase Request', 'color' => '4472C4'],
                    ['range' => 'M1:R1', 'title' => 'Purchase Order', 'color' => '70AD47'],
                    ['range' => 'S1:T1', 'title' => 'Cost Saving', 'color' => 'E67E22'],
                    ['range' => 'U1:W1', 'title' => 'PR to PO', 'color' => '9B59B6'],
                    ['range' => 'X1:AA1', 'title' => 'PO to Onsite', 'color' => 'FFC000'],
                    ['range' => 'AB1:AG1', 'title' => 'Invoice to Finance', 'color' => '5B9BD5'],
                    ['range' => 'AH1:AJ1', 'title' => 'Payment', 'color' => 'C00000'],
                ];
                
                foreach ($headerGroups as $group) {
                    // Get the first cell of the range
                    $firstCell = explode(':', $group['range'])[0];
                    
                    // Set the text value
                    $sheet->setCellValue($firstCell, $group['title']);
                    
                    // Merge cells
                    $sheet->mergeCells($group['range']);
                    
                    // Apply styling
                    $sheet->getStyle($group['range'])->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'color' => ['rgb' => 'FFFFFF'],
                            'size' => 11
                        ],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => $group['color']]
                        ],
                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_CENTER,
                            'vertical' => Alignment::VERTICAL_CENTER,
                            'wrapText' => true
                        ],
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => '000000']
                            ]
                        ]
                    ]);
                    
                    // Set row height for header
                    $sheet->getRowDimension(1)->setRowHeight(30);
                }
                
                // Add autofilter to row 2 (header row)
                $highestColumn = $sheet->getHighestColumn();
                $sheet->setAutoFilter('A2:' . $highestColumn . '2');
                
                // Update freeze pane to freeze both header rows (row 1 and 2)
                $sheet->freezePane('A3');
            },
        ];
    }
}