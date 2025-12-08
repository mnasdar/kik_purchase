/**
 * Modul Log Detail - Handler untuk modal detail
 * Mengelola tampilan detail aktivitas dengan berbagai format data
 */

import $ from "jquery";

/**
 * Fungsi untuk membuat card detail yang menarik
 */
function createDetailCard(title, content, type = 'info') {
    const colors = {
        info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
        success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
        warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
        danger: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    };

    return `
        <div class="${colors[type]} border rounded-lg p-4 mb-4">
            <h3 class="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <i class="mgc_information_line"></i>
                ${title}
            </h3>
            ${content}
        </div>
    `;
}

/**
 * Fungsi untuk membuat tabel responsive
 */
function createResponsiveTable(headers, rows) {
    if (!rows || rows.length === 0) {
        return '<p class="text-sm text-gray-500">Tidak ada data</p>';
    }

    let html = '<div class="overflow-x-auto -mx-4 px-4"><table class="w-full text-sm">';
    
    html += '<thead class="bg-gray-100 dark:bg-gray-800"><tr>';
    headers.forEach(header => {
        html += `<th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">${header}</th>`;
    });
    html += '</tr></thead>';
    
    html += '<tbody>';
    rows.forEach((row, index) => {
        const bgClass = index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50';
        html += `<tr class="${bgClass} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">`;
        row.forEach(cell => {
            html += `<td class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">${cell || '-'}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    
    return html;
}

/**
 * Fungsi untuk membuat comparison card (old vs new)
 */
function createComparisonCard(field, oldValue, newValue) {
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Sebelum</p>
                <p class="text-sm font-semibold text-gray-800 dark:text-white">${field}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300 mt-2">${oldValue || '-'}</p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Sesudah</p>
                <p class="text-sm font-semibold text-gray-800 dark:text-white">${field}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300 mt-2">${newValue || '-'}</p>
            </div>
        </div>
    `;
}

/**
 * Fungsi untuk format JSON
 */
function formatJSON(obj) {
    if (typeof obj === 'object' && obj !== null) {
        return `<pre class="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">${JSON.stringify(obj, null, 2)}</pre>`;
    }
    return obj;
}

/**
 * Event handler untuk tombol detail
 */
$(document).on("click", ".btn-log-detail", function () {
    const rawData = $(this).attr("data-detail");
    let data;

    try {
        data = JSON.parse(rawData);
        console.log("\ud83d\udcc8 Data parsed:", data);
    } catch (e) {
        console.error("\u274c Gagal parse JSON:", e);
        $("#logDetailContent").html(
            createDetailCard('Error', '<p class="text-sm text-red-600">Data tidak valid atau rusak.</p>', 'danger')
        );
        showModal();
        return;
    }

    let html = '';

    // Handle bulk delete suppliers
    if (data.deleted_suppliers && Array.isArray(data.deleted_suppliers)) {
        const rows = data.deleted_suppliers.map((name, i) => [i + 1, name]);
        html = createDetailCard(
            '🏢 Supplier yang Dihapus',
            createResponsiveTable(['#', 'Nama Supplier'], rows) +
            (data.count ? `<p class="mt-3 text-sm font-medium text-red-600 dark:text-red-400">Total: ${data.count} supplier dihapus</p>` : ''),
            'danger'
        );
    }
    
    // Handle bulk delete locations
    else if (data.deleted_locations && Array.isArray(data.deleted_locations)) {
        const rows = data.deleted_locations.map((name, i) => [i + 1, name]);
        html = createDetailCard(
            '📍 Unit Kerja yang Dihapus',
            createResponsiveTable(['#', 'Nama Unit Kerja'], rows) +
            (data.count ? `<p class="mt-3 text-sm font-medium text-red-600 dark:text-red-400">Total: ${data.count} unit kerja dihapus</p>` : ''),
            'danger'
        );
    }
    
    // Handle single delete supplier
    else if (data.deleted_supplier) {
        html = createDetailCard(
            '🏢 Supplier yang Dihapus',
            `<p class="text-sm text-gray-800 dark:text-white font-medium">${data.deleted_supplier}</p>`,
            'danger'
        );
    }
    
    // Handle single delete location
    else if (data.deleted_location) {
        html = createDetailCard(
            '📍 Unit Kerja yang Dihapus',
            `<p class="text-sm text-gray-800 dark:text-white font-medium">${data.deleted_location}</p>`,
            'danger'
        );
    }
    
    // Handle bulk delete classifications
    else if (data.deleted_classifications && Array.isArray(data.deleted_classifications)) {
        const rows = data.deleted_classifications.map((name, i) => [i + 1, name]);
        html = createDetailCard(
            '📋 Klasifikasi yang Dihapus',
            createResponsiveTable(['#', 'Nama Klasifikasi'], rows) +
            (data.count ? `<p class="mt-3 text-sm font-medium text-red-600 dark:text-red-400">Total: ${data.count} klasifikasi dihapus</p>` : ''),
            'danger'
        );
    }
    
    // Handle single delete classification
    else if (data.deleted_classification) {
        html = createDetailCard(
            '📋 Klasifikasi yang Dihapus',
            `<p class="text-sm text-gray-800 dark:text-white font-medium">${data.deleted_classification}</p>`,
            'danger'
        );
    }
    
    // Handle create with attributes (untuk supplier/location/classification baru)
    else if (data.name && (data.supplier_type || data.location_id !== undefined || data.type || data.sla !== undefined)) {
        let content = '<div class="space-y-2 text-sm">';
        
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'deleted_at' && value !== null) {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                content += `
                    <div class="flex justify-between border-b border-gray-200 dark:border-gray-700 py-2">
                        <span class="font-medium text-gray-600 dark:text-gray-400">${label}:</span>
                        <span class="text-gray-800 dark:text-white">${value}</span>
                    </div>
                `;
            }
        });
        
        content += '</div>';
        html = createDetailCard('✨ Data yang Ditambahkan', content, 'success');
    }
    
    // Handle deleted items array (existing)
    else if (Array.isArray(data) && data.length > 0 && data[0].name && data[0].id) {
        const rows = data.map((item, i) => [
            i + 1,
            item.name || '-',
            item.sku || '-',
            item.kode || '-'
        ]);
        html = createDetailCard(
            '\ud83d\udce6 Item yang Dihapus',
            createResponsiveTable(['#', 'Nama', 'SKU/Kode', 'ID'], rows),
            'danger'
        );
    }
    
    else if (data.old && data.new) {
        html = createDetailCard('\ud83d\udd04 Perubahan Data', '', 'warning');
        
        const oldData = data.old;
        const newData = data.new;
        const allKeys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])];
        
        const excludedKeys = ['id', 'created_at', 'updated_at', 'is_new', 'is_update', 'deleted_at', 'created_by'];
        const filteredKeys = allKeys.filter(key => !excludedKeys.includes(key));
        
        filteredKeys.forEach(key => {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                html += createComparisonCard(
                    key.replace(/_/g, ' ').toUpperCase(),
                    typeof oldData[key] === 'object' ? JSON.stringify(oldData[key]) : oldData[key],
                    typeof newData[key] === 'object' ? JSON.stringify(newData[key]) : newData[key]
                );
            }
        });
    }
    
    else if (data.cleared_products && Array.isArray(data.cleared_products)) {
        data.cleared_products.forEach((produk, i) => {
            const rows = (produk.old_barcodes || []).map((b, idx) => [
                idx + 1,
                b.level || '-',
                b.barcode || '-'
            ]);
            
            html += createDetailCard(
                `\ud83d\udce6 ${i + 1}. ${produk.name || '-'} (${produk.sku || '-'})`,
                createResponsiveTable(['#', 'Level Unit', 'Barcode Lama'], rows),
                'warning'
            );
        });
    }
    
    else if (Array.isArray(data) && data[0] && data[0].changes) {
        data.forEach((entry, i) => {
            const produk = entry.produk || {};
            const rows = entry.changes.map((c, idx) => [
                idx + 1,
                c.level || '-',
                c.old_barcode || '-',
                c.new_barcode || '-'
            ]);
            
            html += createDetailCard(
                `\ud83d\udcdd ${i + 1}. ${produk.name || '-'} (${produk.sku || '-'})`,
                createResponsiveTable(['#', 'Level', 'Barcode Lama', 'Barcode Baru'], rows),
                'info'
            );
        });
    }
    
    else if (data.produk_ids && Array.isArray(data.produk_ids)) {
        const rows = data.produk_ids.map((id, i) => [i + 1, id]);
        html = createDetailCard(
            '\ud83d\udce6 Produk yang Diproses',
            createResponsiveTable(['#', 'Produk ID'], rows) +
            (data.count ? `<p class="mt-3 text-sm font-medium">Total: ${data.count} produk</p>` : ''),
            'info'
        );
    }
    
    else if (data.produk_id && data.produk_name) {
        html = createDetailCard(
            '\ud83d\udce6 Detail Produk',
            `
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-gray-600 dark:text-gray-400 font-medium">Produk ID:</p>
                        <p class="text-gray-800 dark:text-white">${data.produk_id}</p>
                    </div>
                    <div>
                        <p class="text-gray-600 dark:text-gray-400 font-medium">Nama Produk:</p>
                        <p class="text-gray-800 dark:text-white">${data.produk_name}</p>
                    </div>
                </div>
            `,
            'info'
        );
    }
    
    else {
        html = createDetailCard(
            ' Detail Data',
            formatJSON(data),
            'info'
        );
    }

    if (!html) {
        html = createDetailCard(
            'Informasi',
            '<p class="text-sm text-gray-500">Tidak ada detail khusus untuk ditampilkan.</p>',
            'info'
        );
    }

    $("#logDetailContent").html(html);
    showModal();
});

/**
 * Show modal
 */
function showModal() {
    $("#logDetailModal").removeClass("hidden");
    $("body").addClass("overflow-hidden");
}

/**
 * Hide modal
 */
function hideModal() {
    $("#logDetailModal").addClass("hidden");
    $("body").removeClass("overflow-hidden");
}

/**
 * Close modal handlers
 */
$("#closeLogDetailModal, #closeLogDetailModalBtn").on("click", function () {
    hideModal();
});

$("#logDetailModal").on("click", function (e) {
    if ($(e.target).is("#logDetailModal")) {
        hideModal();
    }
});

$(document).on("keydown", function (e) {
    if (e.key === "Escape" && !$("#logDetailModal").hasClass("hidden")) {
        hideModal();
    }
});
