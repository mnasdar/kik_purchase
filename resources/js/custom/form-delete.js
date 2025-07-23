import $ from 'jquery';
import Swal from 'sweetalert2';

window.initDeleteHandler = function (options) {
    const {
        tableSelector,
        confirmButtonSelector,
        deleteUrl,
        onSuccess = () => location.reload(),
        onError = (err) => console.error(err),
    } = options;

    const $table = $(tableSelector);
    const $deleteBtn = $(confirmButtonSelector);

    if ($table.length === 0 || $deleteBtn.length === 0) return;

    // Hindari multiple event binding
    $deleteBtn.off('click').on("click", function () {
        const $checked = $table.find('input[type="checkbox"]:not(#headerCheck):checked');

        if ($checked.length === 0) {
            Swal.fire({
                title: 'Perhatian!',
                text: 'Pilih minimal satu data untuk dihapus.',
                icon: 'warning',
                confirmButtonClass: 'btn bg-primary text-white w-xs mt-2',
                buttonsStyling: false
            });
            return;
        }

        const ids = $checked.map(function () {
            return $(this).val();
        }).get();

        const csrfToken = $('meta[name="csrf-token"]').attr("content");
        if (!csrfToken) {
            console.error("CSRF token tidak ditemukan.");
            return;
        }

        // Konfirmasi sebelum hapus
        Swal.fire({
            title: 'Yakin hapus?',
            text: 'Data yang dipilih akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
            confirmButtonClass: 'btn bg-danger text-white w-xs',
            cancelButtonClass: 'btn bg-secondary text-white w-xs ms-2',
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: typeof deleteUrl === 'function' ? deleteUrl(ids) : deleteUrl,
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN": csrfToken
                    },
                    contentType: "application/json",
                    data: JSON.stringify({
                        ids
                    }),
                    success: onSuccess,
                    error: onError
                });
            }
        });
    });
};

$(function () {
    initDeleteHandler({
        tableSelector: "#purchase_request-table",
        confirmButtonSelector: "#confirmDelete",
        deleteUrl: "purchase-request", // atau bisa function: (ids) => `produk/delete/${ids.join(',')}`
        onSuccess: () => {
            Swal.fire('Sukses!', 'Data berhasil dihapus.', 'success').then(() => location.reload());
        },
        onError: () => {
            Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
        }
    });

    initDeleteHandler({
        tableSelector: "#purchase_order-table",
        confirmButtonSelector: "#confirmDelete",
        deleteUrl: "purchase-order", // atau bisa function: (ids) => `produk/delete/${ids.join(',')}`
        onSuccess: () => {
            Swal.fire('Sukses!', 'Data berhasil dihapus.', 'success').then(() => location.reload());
        },
        onError: () => {
            Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
        }
    });
});
