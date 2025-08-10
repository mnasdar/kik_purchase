import $ from 'jquery';
import {
    route
} from 'ziggy-js';
import Swal from 'sweetalert2';

const $table = $("#purchase_order-table");
const $onsiteBtn = $(".btn-onsite");
const $form = $("#onsite-form");

let selectedIds = [];

$onsiteBtn.off('click').on("click", function () {
    const $checked = $table.find('input[type="checkbox"]:not(#headerCheck):checked');

    if ($checked.length === 0) {
        Swal.fire({
            title: 'Perhatian!',
            text: 'Pilih minimal satu data untuk diproses.',
            icon: 'warning',
            confirmButtonClass: 'btn bg-primary text-white w-xs mt-2',
            buttonsStyling: false
        });
        return;
    }

    selectedIds = $checked.map(function () {
        return $(this).val();
    }).get();
});

// Submit Form
$form.off('submit').on('submit', function (e) {
    e.preventDefault();

    const tglTerima = $('#datepo-onsite').val();

    if (selectedIds.length === 0) {
        Swal.fire('Peringatan', 'Tidak ada data PO yang dipilih.', 'warning');
        return;
    }

    if (!tglTerima) {
        Swal.fire('Peringatan', 'Tanggal terima harus diisi.', 'warning');
        return;
    }

    Swal.fire({
        title: 'Anda sudah yakin?',
        text: 'Data yang dipilih akan dihubungkan ke PO Onsite.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Batal',
        customClass: {
            confirmButton: 'btn bg-warning text-white w-xs',
            cancelButton: 'btn bg-secondary text-white w-xs ms-2'
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: route('purchase-order.onsite'),
                method: "POST",
                contentType: "application/json",
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                data: JSON.stringify({
                    ids: selectedIds,
                    tgl_terima: tglTerima
                }),
                success: function () {
                    Swal.fire('Sukses!', 'Data berhasil ditambahkan.', 'success')
                        .then(() => location.reload());
                },
                error: function () {
                    Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan.', 'error');
                }
            });
        }
    });
});

