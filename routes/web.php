<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoutingController;
use App\Http\Controllers\Access\RolesController;
use App\Http\Controllers\Access\ManajemenUserController;
use App\Http\Controllers\Access\LogAktivitasController;
use App\Http\Controllers\Config\LocationController;
use App\Http\Controllers\Config\SupplierController;
use App\Http\Controllers\Config\ClassificationController;
use App\Http\Controllers\Purchase\OnsiteController;
use App\Http\Controllers\Invoice\PengajuanController;
use App\Http\Controllers\Invoice\DariVendorController;
use App\Http\Controllers\Invoice\PembayaranController;
use App\Http\Controllers\Purchase\PurchaseOrderController;
use App\Http\Controllers\Purchase\PurchaseRequestController;
use App\Http\Controllers\Purchase\PurchaseTrackingController;

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
    Route::get('', [RoutingController::class, 'index'])->name('root');
    Route::get('/home', fn() => view('index'))->name('home');
    Route::prefix('{prefix}')->group(function () {
        /* ================= Purchase Request ======================== */
        Route::get('/purchase-request/data', [PurchaseRequestController::class, 'getData'])->name('purchase-request.data');
        Route::resource('/purchase-request', PurchaseRequestController::class)->except(['show', 'destroy']);
        Route::delete('/purchase-request', [PurchaseRequestController::class, 'bulkDestroy'])->name('purchase-request.bulkDestroy');

        /* ================= Purchase Order ======================== */
        Route::get('/purchase-order/data', [PurchaseOrderController::class, 'getData'])->name('purchase-order.data');
        Route::get('/purchase-order/showpr', [PurchaseOrderController::class, 'showpr'])->name('purchase-order.showpr');
        Route::resource('/purchase-order', PurchaseOrderController::class)->except(['destroy']);
        Route::delete('/purchase-order', [PurchaseOrderController::class, 'bulkDestroy'])->name('purchase-order.bulkDestroy');

        /* ================= Purchase Tracking ======================== */
        Route::resource('/purchase-tracking', PurchaseTrackingController::class)->only('store');
        Route::delete('/purchase-tracking', [PurchaseTrackingController::class, 'bulkDestroy'])->name('purchase-tracking.bulkDestroy');

        /* ================= PO Onsite ======================== */
        Route::get('/po-onsite/search/{keyword}', [OnsiteController::class, 'search'])->name('po-onsite.search');
        Route::delete('/po-onsite', [OnsiteController::class, 'bulkDestroy'])->name('po-onsite.bulkDestroy');
        Route::resource('/po-onsite', OnsiteController::class)->except(['destroy']);
    });
    Route::prefix('invoice')->group(function () {
        /* ================= Terima Dari Vendor ======================== */
        Route::delete('/dari-vendor', [DariVendorController::class, 'bulkDestroy'])->name('dari-vendor.bulkDestroy');
        Route::resource('/dari-vendor', DariVendorController::class)->except(['show', 'destroy']);
        Route::get('/dari-vendor/{keyword}', [DariVendorController::class, 'search'])->name('dari-vendor.search');
        /* ================= Pengajuan ke Finance ======================== */
        Route::get('/pengajuan/search/{keyword}', [PengajuanController::class, 'search'])->name('pengajuan.search');
        Route::delete('/pengajuan', [PengajuanController::class, 'bulkDestroy'])->name('pengajuan.bulkDestroy');
        Route::resource('/pengajuan', PengajuanController::class)->except(['show', 'destroy']);
        /* ================= Pembayaran Oleh Finance ======================== */
        Route::get('/pembayaran/search/{keyword}', [PembayaranController::class, 'search'])->name('pembayaran.search');
        Route::delete('/pembayaran', [PembayaranController::class, 'bulkDestroy'])->name('pembayaran.bulkDestroy');
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
