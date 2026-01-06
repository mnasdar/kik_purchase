<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Exports\PurchasingDataExport;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class ExportController extends Controller
{
    public function index()
    {
        return view('menu.export.index');
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'filter_type' => 'required|in:pr,po',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $user = auth()->user();

        $filterTypeLabel = $validated['filter_type'] === 'pr' ? 'PR' : 'PO';
        $filename = 'Purchasing_Data_' . $filterTypeLabel . '_' . $startDate->format('Ymd') . '_to_' . $endDate->format('Ymd') . '.xlsx';

        $export = new PurchasingDataExport(
            $validated['start_date'],
            $validated['end_date'],
            $user->id,
            $validated['filter_type']
        );

        return Excel::download($export, $filename);
    }
}
