// Import dependensi utama
import $ from 'jquery';
import { Grid, h, html } from 'gridjs';
import { route } from 'ziggy-js';
import Swal from 'sweetalert2';

// Konstanta ID tabel dan tombol aksi
const tableId = "#show_pr-table";         // Tabel untuk daftar PR
const tablePO = "#purchase_order-table";  // Tabel untuk daftar PO
const $saveprBtn = $(".btn-savepr");      // Tombol untuk simpan PR ke PO
const $deleteprBtn = $(".btn-deletepr");      // Tombol untuk simpan PR ke PO

// Variabel global untuk menyimpan PO yang dipilih
let selectedPoId = null;

// ============================================
// Kosongkan tabel PR ketika modal ditutup
// ============================================
$('[modal-close]').on('click', () => {
    $(tableId).empty();
});

// ===================================================================================
// Fungsi: Tampilkan detail PR berdasarkan ID PO tertentu (tombol .btn-showpr diklik)
// ===================================================================================
$(document).on('click', '.btn-showpr', function () {
    const purchaseOrderId = $(this).data('id');
    selectedPoId = purchaseOrderId;
    $saveprBtn.hide();              // Sembunyikan tombol simpan PR
    $deleteprBtn.show();            // Tampikan tombol delete PR
    showPRDetail(purchaseOrderId);               // Tampilkan detail PR berdasarkan ID PO
    $('.btn-show').trigger('click'); // Buka modal
});

// ===================================================================================
// Fungsi: Handle saat klik tombol "Link to PR" (mengaitkan PR ke PO yang dipilih)
// ===================================================================================
$(document).on('click', '.btn-linktopr', function () {
    const headerCheckId = `headerCheck-${tablePO.replace('#', '')}`;
    const $checked = $(`${tablePO} input[type="checkbox"]:not(#${headerCheckId}):checked`);

    // Ambil hanya jika satu PO yang dicentang
    selectedPoId = $checked.length === 1 ? $checked.val() : null;

    $saveprBtn.show();          // Tampilkan tombol simpan PR
    $deleteprBtn.hide();        // Sembunyikan tombol delete PR
    linktopr();                 // Panggil data PR dan tampilkan ke dalam tabel
});

// ===================================================================================
// Fungsi: Simpan PR yang dipilih ke PO (via tombol .btn-savepr)
// ===================================================================================
$saveprBtn.off('click').on("click", function () {
    const headerCheckId = `headerCheck-${tableId.replace('#', '')}`;
    const $checked = $(`${tableId} input[type="checkbox"]:not(#${headerCheckId}):checked`);

    if ($checked.length === 0) {
        return Swal.fire({
            icon: 'warning',
            title: 'Perhatian!',
            text: 'Pilih minimal satu data PR.',
            confirmButtonText: 'OK',
            customClass: { confirmButton: 'btn bg-primary text-white w-xs mt-2' },
            buttonsStyling: false
        });
    }

    // Ambil ID PR yang dicentang
    const selectedIds = $checked.map(function () {
        return $(this).val();
    }).get();

    // Konfirmasi simpan
    Swal.fire({
        title: 'Anda yakin?',
        text: `Simpan ${selectedIds.length} PR ke PO terpilih?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Simpan',
        cancelButtonText: 'Batal',
        customClass: {
            confirmButton: 'btn bg-success text-white w-xs',
            cancelButton: 'btn bg-secondary text-white w-xs ms-2'
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            // Kirim data ke server
            $.ajax({
                url: route('purchase-tracking.store'),
                method: "POST",
                headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                contentType: "application/json",
                data: JSON.stringify({
                    po_id: selectedPoId,
                    ids: selectedIds
                }),
                success: () => {
                    Swal.fire('Berhasil!', 'Data berhasil disimpan.', 'success')
                        .then(() => location.reload());
                },
                error: () => {
                    Swal.fire('Gagal!', 'Terjadi kesalahan saat menyimpan data.', 'error');
                }
            });
        }
    });
});

// ===================================================================================
// Fungsi: Delete PR yang dipilih ke PO (via tombol .btn-savepr)
// ===================================================================================
$deleteprBtn.off('click').on("click", function () {
    const headerCheckId = `headerCheck-${tableId.replace('#', '')}`;
    const $checked = $(`${tableId} input[type="checkbox"]:not(#${headerCheckId}):checked`);

    if ($checked.length === 0) {
        return Swal.fire({
            icon: 'warning',
            title: 'Perhatian!',
            text: 'Pilih minimal satu data PR.',
            confirmButtonText: 'OK',
            customClass: { confirmButton: 'btn bg-primary text-white w-xs mt-2' },
            buttonsStyling: false
        });
    }

    // Ambil ID PR yang dicentang
    const selectedPrId = $checked.map(function () {
        return $(this).val();
    }).get();

    // Konfirmasi simpan
    Swal.fire({
        title: 'Anda yakin?',
        text: `Hapus ${selectedPrId.length} PR ke PO terpilih?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Simpan',
        cancelButtonText: 'Batal',
        customClass: {
            confirmButton: 'btn bg-success text-white w-xs',
            cancelButton: 'btn bg-secondary text-white w-xs ms-2'
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            // Kirim data ke server
            $.ajax({
                url: route('purchase-tracking.bulkDestroy'),
                method: "Delete",
                headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                contentType: "application/json",
                data: JSON.stringify({
                    po_id: selectedPoId,
                    pr_id: selectedPrId
                }),
                success: () => {
                    Swal.fire('Berhasil!', 'Data berhasil dihapus.', 'success')
                        .then(() => location.reload());
                },
                error: () => {
                    Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus data.', 'error');
                }
            });
        }
    });
});

// ===================================================================================
// Fungsi: Ambil daftar PR yang bisa ditautkan ke PO, dan render ke tabel (Grid.js)
// ===================================================================================
function linktopr() {
    $.getJSON(route('purchase-order.showpr'), function (data) {
        if (!data.length) {
            return $(tableId).html('<p class="text-center py-4 text-gray-400">Data tidak ditemukan.</p>');
        }

        const headerCheckId = `headerCheck-${tableId.replace('#', '')}`;

        initGridTable({
            gridData: data.map(item => [
                item.checkbox,
                item.number,
                item.status,
                item.classification,
                item.pr_number,
                item.location,
                item.item_desc,
                item.uom,
                item.approved_date,
                item.unit_price,
                item.qty,
                item.amount,
                item.sla,
            ]),
            columns: [
                {
                    id: "Checkbox",
                    name: html(`<div class="form-check"><input type="checkbox" class="form-checkbox rounded text-primary" id="${headerCheckId}"></div>`),
                    width: "50px",
                    sort: false,
                    formatter: cell => h("div", { innerHTML: cell })
                },
                { name: "#", width: "60px" },
                { name: "Status", width: "130px",formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Classification", width: "200px" },
                { name: "PR Number", width: "180px",formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Location", width: "150px" },
                { name: "Item Desc", width: "200px" },
                { name: "UOM", width: "100px" },
                { name: "Date", width: "120px" },
                { name: "Unit Price", width: "200px",formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Qty", width: "90px",formatter: cell => h("div", { innerHTML: cell }) },
                { name: "Amount", width: "200px",formatter: cell => h("div", { innerHTML: cell }) },
                { name: "SLA", width: "100px",formatter: cell => h("div", { innerHTML: cell }) },
            ],
            buttonConfig: [{
                selector: ".btn-savepr",
                when: "any"
            }]
        });

        // Sinkronisasi header checkbox
        const selector = `${tableId} input[type="checkbox"]`;
        $(document).on('change', `#${headerCheckId}`, function () {
            const isChecked = $(this).is(':checked');
            $(`${selector}`).not(this).prop('checked', isChecked).trigger('change');
        });
    }).fail(() => {
        $(tableId).html('<p class="text-center text-red-500 py-4">Gagal memuat data.</p>');
    });
}

// ===================================================================================
// Fungsi: Tampilkan detail PR untuk PO tertentu
// ===================================================================================
function showPRDetail(purchaseOrderId) {
    $.ajax({
        url: route('purchase-order.show', purchaseOrderId),
        method: "GET",
        dataType: 'json',
        success: function (data) {
            if (!data.length) {
                return $(tableId).html('<p class="text-center py-4 text-gray-400">Data tidak ditemukan.</p>');
            }
            
            const headerCheckId = `headerCheck-${tableId.replace('#', '')}`;

            initGridTable({
                gridData: data.map(item => [
                    item.checkbox,
                    item.number,
                    item.status,
                    item.classification,
                    item.pr_number,
                    item.location,
                    item.item_desc,
                    item.uom,
                    item.approved_date,
                    item.unit_price,
                    item.qty,
                    item.amount,
                    item.sla,
                ]),
                columns: [
                    {
                        id: "Checkbox",
                        name: html(`<div class="form-check"><input type="checkbox" class="form-checkbox rounded text-primary" id="${headerCheckId}"></div>`),
                        width: "50px",
                        sort: false,
                        formatter: cell => h("div", { innerHTML: cell })
                    },
                    { name: "#", width: "60px" },
                    { name: "Status", width: "130px",formatter: cell => h("div", { innerHTML: cell }) },
                    { name: "Classification", width: "200px" },
                    { name: "PR Number", width: "180px",formatter: cell => h("div", { innerHTML: cell }) },
                    { name: "Location", width: "150px" },
                    { name: "Item Desc", width: "200px" },
                    { name: "UOM", width: "100px" },
                    { name: "Date", width: "120px" },
                    { name: "Unit Price", width: "200px",formatter: cell => h("div", { innerHTML: cell }) },
                    { name: "Qty", width: "90px",formatter: cell => h("div", { innerHTML: cell }) },
                    { name: "Amount", width: "200px",formatter: cell => h("div", { innerHTML: cell }) },
                    { name: "SLA", width: "100px",formatter: cell => h("div", { innerHTML: cell }) },
                ],
                buttonConfig: [{
                    selector: ".btn-deletepr",
                    when: "any"
                }]
            });

            // Sinkronisasi header checkbox
            const selector = `${tableId} input[type="checkbox"]`;
            $(document).on('change', `#${headerCheckId}`, function () {
                const isChecked = $(this).is(':checked');
                $(`${selector}`).not(this).prop('checked', isChecked).trigger('change');
            });
            },

        error: function () {
            $(tableId).html('<p class="text-center text-red-500 py-4">Gagal memuat data.</p>');
        }
    });
}

// ===================================================================================
// Fungsi: Inisialisasi tabel Grid.js (dengan sorting, pagination, checkbox, dsb)
// ===================================================================================
function initGridTable({
    gridData,
    columns,
    limit = 5,
    delay = 300,
    buttonConfig = [],
}) {
    const headerCheckId = `headerCheck-${tableId.replace('#', '')}`;
    const container = document.querySelector(tableId);
    if (!container) return;

    // Bersihkan kontainer sebelum render ulang
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const wrapper = document.createElement("div");
    wrapper.style.overflowX = "auto";
    container.appendChild(wrapper);

    new Grid({
        columns,
        pagination: { limit },
        search: true,
        sort: true,
        data: () => new Promise(resolve => setTimeout(() => resolve(gridData), 200)),
    }).render(wrapper);

    setTimeout(() => {
        const selector = `${tableId} input[type="checkbox"]`;

        // Sinkronisasi header checkbox (select all)
        $(document).on('change', `#${headerCheckId}`, function () {
            const isChecked = $(this).is(':checked');
            $(`${selector}`).not(this).prop('checked', isChecked).trigger('change');
        });

        // Toggle tombol berdasarkan jumlah checkbox terpilih
        $(document).on('change', `${selector}:not(#${headerCheckId})`, function () {
            const checkboxes = $(`${selector}:not(#${headerCheckId})`);
            const checked = checkboxes.filter(':checked');
            $(`#${headerCheckId}`).prop('checked', checkboxes.length === checked.length);

            buttonConfig.forEach(btn => {
                const el = $(btn.selector);
                if (!el.length) return;

                let enable = false;
                switch (btn.when) {
                    case 'one':
                        enable = checked.length === 1;
                        break;
                    case 'multiple':
                        enable = checked.length > 1;
                        break;
                    case 'any':
                        enable = checked.length > 0;
                        break;
                }

                el.prop('disabled', !enable);
            });
        });
    }, delay);
}
