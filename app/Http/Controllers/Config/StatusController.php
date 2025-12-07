<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * Placeholder StatusController agar route tidak error.
 * Silakan lengkapi sesuai kebutuhan bisnis ketika tabel status sudah tersedia.
 */
class StatusController extends Controller
{
    public function index()
    {
        return response()->json([]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Fitur status belum diimplementasikan'], 501);
    }

    public function update(Request $request)
    {
        return response()->json(['message' => 'Fitur status belum diimplementasikan'], 501);
    }

    public function bulkDestroy()
    {
        return response()->json(['message' => 'Fitur status belum diimplementasikan'], 501);
    }
}
