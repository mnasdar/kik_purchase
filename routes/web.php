<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoutingController;
use App\Http\Controllers\Goods\StatusController;
use App\Http\Controllers\Goods\PurchaseOrderController;
use App\Http\Controllers\Goods\ClassificationController;
use App\Http\Controllers\Goods\PurchaseRequestController;

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

Route::group(['prefix' => '/', 'middleware'=>'auth'], function () {
    Route::get('', [RoutingController::class, 'index'])->name('root');
    Route::get('/home', fn()=>view('index'))->name('home');
    /* ================= Goods ======================== */
    Route::prefix('goods')->group(function () {
        Route::get('/purchase-request/search', [PurchaseRequestController::class, 'search'])->name('purchase-request.search');
        Route::resource('/purchase-request', PurchaseRequestController::class)->except(['create','show']);
        Route::get('/purchase-order/search', [PurchaseOrderController::class, 'search'])->name('purchase-order.search');
        Route::resource('/purchase-order', PurchaseOrderController::class)->except(['create','show']);
        Route::get('/status/search', [StatusController::class, 'search'])->name('status.search');
        Route::resource('/status', StatusController::class)->except(['create','show']);
        Route::get('/classification/search', [ClassificationController::class, 'search'])->name('classification.search');
        Route::resource('/classification', ClassificationController::class)->except(['create','show']);
    });
    
    
    Route::get('{first}/{second}/{third}', [RoutingController::class, 'thirdLevel'])->name('third');
    Route::get('{first}/{second}', [RoutingController::class, 'secondLevel'])->name('second');
    Route::get('{any}', [RoutingController::class, 'root'])->name('any');
});
