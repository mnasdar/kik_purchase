<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoutingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\Access\RolesController;
use App\Http\Controllers\Config\LocationController;
use App\Http\Controllers\Config\SupplierController;
use App\Http\Controllers\Purchase\OnsiteController;
use App\Http\Controllers\Invoice\PengajuanController;
use App\Http\Controllers\Invoice\DariVendorController;
use App\Http\Controllers\Invoice\PembayaranController;
use App\Http\Controllers\Access\LogAktivitasController;
use App\Http\Controllers\Access\ManajemenUserController;
use App\Http\Controllers\Config\ClassificationController;
use App\Http\Controllers\Purchase\PurchaseOrderController;
use App\Http\Controllers\Purchase\PurchaseRequestController;
use App\Http\Controllers\Purchase\PurchaseOrderOnsiteController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

require __DIR__ . '/auth.php';

Route::group(['prefix' => '/', 'middleware' => 'auth'], function () {
    Route::get('', [DashboardController::class, 'index'])->name('root');
    
    /* ================= Dashboard ======================== */
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/data', [DashboardController::class, 'getData'])->name('dashboard.data');
    Route::get('/dashboard/po-analytics', [DashboardController::class, 'getPoAnalytics'])->name('dashboard.po-analytics');
    
    /* ================= Export Data ======================== */
    Route::get('/export', [ExportController::class, 'index'])->name('export.index');
    Route::get('/export/data', [ExportController::class, 'export'])->name('export.data');
    
    /* ================= Purchase Request ======================== */
    Route::get('/purchase-request/data', [PurchaseRequestController::class, 'getData'])->name('purchase-request.data');
    Route::get('/purchase-request/{purchase_request}/detail', [PurchaseRequestController::class, 'detail'])->name('purchase-request.detail');
    Route::post('/purchase-request/check-deleted-item', [PurchaseRequestController::class, 'checkDeletedItem'])->name('purchase-request.checkDeletedItem');
    Route::post('/purchase-request/check-deleted-pr', [PurchaseRequestController::class, 'checkDeletedPR'])->name('purchase-request.checkDeletedPR');
    Route::post('/purchase-request/{id}/restore', [PurchaseRequestController::class, 'restorePR'])->name('purchase-request.restore');
    Route::resource('/purchase-request', PurchaseRequestController::class)->except(['show', 'destroy']);
    Route::delete('/purchase-request', [PurchaseRequestController::class, 'bulkDestroy'])->name('purchase-request.bulkDestroy');

    /* ================= Purchase Order ======================== */
    Route::get('/purchase-order/data', [PurchaseOrderController::class, 'getData'])->name('purchase-order.data');
    Route::get('/purchase-order/{purchase_order}/detail', [PurchaseOrderController::class, 'detail'])->name('purchase-order.detail');
    Route::get('/purchase-order/pr-list', [PurchaseOrderController::class, 'prList'])->name('purchase-order.pr-list');
    Route::post('/purchase-order/check-deleted-item', [PurchaseOrderController::class, 'checkDeletedItem'])->name('purchase-order.checkDeletedItem');
    Route::post('/purchase-order/{purchase_order}/restore', [PurchaseOrderController::class, 'restore'])->name('purchase-order.restore');
    Route::resource('/purchase-order', PurchaseOrderController::class)->except(['show', 'destroy']);
    Route::delete('/purchase-order', [PurchaseOrderController::class, 'bulkDestroy'])->name('purchase-order.bulkDestroy');

    /* ================= PO Onsite ======================== */
    Route::get('/po-onsite/data', [PurchaseOrderOnsiteController::class, 'getData'])->name('po-onsite.data');
    Route::get('/po-onsite/search/{keyword}', [PurchaseOrderOnsiteController::class, 'search'])->name('po-onsite.search');
    Route::get('/po-onsite/bulk-edit', [PurchaseOrderOnsiteController::class, 'bulkEdit'])->name('po-onsite.bulk-edit');
    Route::post('/po-onsite/bulk-update', [PurchaseOrderOnsiteController::class, 'bulkUpdate'])->name('po-onsite.bulk-update');
    Route::delete('/po-onsite', [PurchaseOrderOnsiteController::class, 'bulkDestroy'])->name('po-onsite.bulkDestroy');
    Route::resource('/po-onsite', PurchaseOrderOnsiteController::class)->except(['destroy']);

    Route::prefix('invoice')->group(function () {
        /* ================= Terima Dari Vendor ======================== */
        Route::get('/dari-vendor/data', [DariVendorController::class, 'getData'])->name('dari-vendor.data');
        Route::get('/dari-vendor/search/{keyword}', [DariVendorController::class, 'search'])->name('dari-vendor.search');
        Route::get('/dari-vendor/bulk-edit', [DariVendorController::class, 'bulkEdit'])->name('dari-vendor.bulk-edit');
        Route::post('/dari-vendor/bulk-update', [DariVendorController::class, 'bulkUpdate'])->name('dari-vendor.bulk-update');
        Route::post('/dari-vendor/store-multiple', [DariVendorController::class, 'storeMultiple'])->name('dari-vendor.store-multiple');
        Route::delete('/dari-vendor', [DariVendorController::class, 'bulkDestroy'])->name('dari-vendor.bulkDestroy');
        Route::resource('/dari-vendor', DariVendorController::class)->except(['show', 'destroy']);
        /* ================= Pengajuan ke Finance ======================== */
        Route::get('/pengajuan/data', [PengajuanController::class, 'getData'])->name('pengajuan.data');
        Route::get('/pengajuan/search/{keyword}', [PengajuanController::class, 'search'])->name('pengajuan.search');
        Route::get('/pengajuan/history', [PengajuanController::class, 'history'])->name('pengajuan.history');
        Route::get('/pengajuan/history/data', [PengajuanController::class, 'getHistoryData'])->name('pengajuan.history-data');
        Route::get('/pengajuan/bulk-edit', [PengajuanController::class, 'bulkEditForm'])->name('pengajuan.bulk-edit');
        Route::post('/pengajuan/bulk-submit', [PengajuanController::class, 'bulkSubmit'])->name('pengajuan.bulk-submit');
        Route::post('/pengajuan/bulk-update', [PengajuanController::class, 'bulkUpdate'])->name('pengajuan.bulk-update');
        Route::delete('/pengajuan', [PengajuanController::class, 'bulkDestroy'])->name('pengajuan.bulkDestroy');
        Route::resource('/pengajuan', PengajuanController::class)->except(['show', 'destroy']);
        /* ================= Pembayaran Oleh Finance ======================== */
        Route::get('/pembayaran/get-invoices', [PembayaranController::class, 'getInvoices'])->name('pembayaran.get-invoices');
        Route::get('/pembayaran/data', [PembayaranController::class, 'data'])->name('pembayaran.data');
        Route::delete('/pembayaran/bulk-destroy', [PembayaranController::class, 'bulkDestroy'])->name('pembayaran.bulk-destroy');
        Route::resource('/pembayaran', PembayaranController::class)->except(['show', 'destroy']);
    });
    Route::prefix('config')->group(function () {
        /* ================= Classification ======================== */
        Route::get('/klasifikasi/data', [ClassificationController::class, 'getData'])->name('klasifikasi.data');
        Route::delete('/klasifikasi', [ClassificationController::class, 'bulkDestroy'])->name('klasifikasi.bulkDestroy');
        Route::resource('/klasifikasi', ClassificationController::class)->except(['create']);

        /* ================= Location ======================== */
        Route::get('/unit-kerja/data', [LocationController::class, 'getData'])->name('unit-kerja.data');
        Route::delete('/unit-kerja', [LocationController::class, 'bulkDestroy'])->name('unit-kerja.bulkDestroy');
        Route::resource('/unit-kerja', LocationController::class)->except(['create']);

        /* ================= Supplier ======================== */
        Route::get('/supplier/data', [SupplierController::class, 'getData'])->name('supplier.data');
        Route::delete('/supplier', [SupplierController::class, 'bulkDestroy'])->name('supplier.bulkDestroy');
        Route::resource('/supplier', SupplierController::class)->except(['create']);
    });

    Route::prefix('access')->group(function () {
        /* ================= Roles Management ======================== */
        Route::get('/roles/data', [RolesController::class, 'dataRoles'])->name('roles.data');
        Route::get('/roles/api/permissions', [RolesController::class, 'apiPermissions'])->name('roles.apiPermissions');
        Route::get('/roles/{role}/permissions', [RolesController::class, 'getPermissions'])->name('roles.permissions');
        Route::resource('/roles', RolesController::class)->only(['index', 'store', 'update', 'destroy']);

        /* ================= Users Management ======================== */
        Route::get('/users/data', [ManajemenUserController::class, 'dataUsers'])->name('users.data');
        Route::get('/users/{user}/permissions', [ManajemenUserController::class, 'getUserPermissions'])->name('users.permissions');
        Route::post('/users/{user}/permissions', [ManajemenUserController::class, 'updateUserPermissions'])->name('users.updatePermissions');
        Route::resource('/users', ManajemenUserController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

        /* ================= Activity Log ======================== */
        Route::get('/log-aktivitas', [LogAktivitasController::class, 'index'])->name('log.index');
        Route::get('/log-aktivitas/data', [LogAktivitasController::class, 'data'])->name('log.data');
    });
    Route::get('{first}/{second}/{third}', [RoutingController::class, 'thirdLevel'])->name('third');
    Route::get('{first}/{second}', [RoutingController::class, 'secondLevel'])->name('second');
    Route::get('{any}', [RoutingController::class, 'root'])->name('any');
});
