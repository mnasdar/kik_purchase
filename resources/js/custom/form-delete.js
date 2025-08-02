import $ from "jquery";
import Swal from "sweetalert2";
import { route } from "ziggy-js";

window.initDeleteHandler = function (options) {
    const {
        tableSelector,
        deleteUrl,
        onSuccess = () => location.reload(),
        onError = (err) => console.error(err),
    } = options;

    const $table = $(tableSelector);
    const $deleteBtn = $("#confirmDelete");

    if ($table.length === 0 || $deleteBtn.length === 0) return;

    // Hindari multiple event binding
    $deleteBtn.off("click").on("click", function () {
        const $checked = $table.find(
            'input[type="checkbox"]:not(.header-checkbox):checked'
        );

        if ($checked.length === 0) {
            Swal.fire({
                title: "Perhatian!",
                text: "Pilih minimal satu data untuk dihapus.",
                icon: "warning",
                confirmButtonClass: "btn bg-primary text-white w-xs mt-2",
                buttonsStyling: false,
            });
            return;
        }

        const ids = $checked
            .map(function () {
                return $(this).val();
            })
            .get();

        const csrfToken = $('meta[name="csrf-token"]').attr("content");
        if (!csrfToken) {
            console.error("CSRF token tidak ditemukan.");
            return;
        }

        // Konfirmasi sebelum hapus
        Swal.fire({
            title: "Yakin hapus?",
            text: "Data yang dipilih akan dihapus permanen.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Hapus",
            cancelButtonText: "Batal",
            customClass: {
                confirmButton: "btn bg-danger text-white w-xs",
                cancelButton: "btn bg-secondary text-white w-xs ms-2",
            },
            buttonsStyling: false, // aktifkan ini jika kamu ingin memakai customClass
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: deleteUrl,
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    contentType: "application/json",
                    data: JSON.stringify({
                        ids,
                    }),
                    success: onSuccess,
                    error: onError,
                });
            }
        });
    });
};

$(function () {
    // Delete Purchase Request
    initDeleteHandler({
        tableSelector: "#purchase_request-table",
        deleteUrl: route("purchase-request.bulkDestroy"),
        onSuccess: () => {
            Swal.fire("Sukses!", "Data berhasil dihapus.", "success").then(() =>
                location.reload()
            );
        },
        onError: () => {
            Swal.fire("Gagal", "Terjadi kesalahan saat menghapus.", "error");
        },
    });

    // Delete Purchase Order
    initDeleteHandler({
        tableSelector: "#purchase_order-table",
        deleteUrl: route("purchase-order.bulkDestroy"),
        onSuccess: () => {
            Swal.fire("Sukses!", "Data berhasil dihapus.", "success").then(() =>
                location.reload()
            );
        },
        onError: () => {
            Swal.fire("Gagal", "Terjadi kesalahan saat menghapus.", "error");
        },
    });

    // Delete PO Onsite
    initDeleteHandler({
        tableSelector: "#onsite-table",
        deleteUrl: route("po-onsite.bulkDestroy"),
        onSuccess: () => {
            Swal.fire("Sukses!", "Data berhasil dihapus.", "success").then(() =>
                location.reload()
            );
        },
        onError: () => {
            Swal.fire("Gagal", "Terjadi kesalahan saat menghapus.", "error");
        },
    });

    // Delete Status
    initDeleteHandler({
        tableSelector: "#status-table",
        deleteUrl: route("status.bulkDestroy"),
        onSuccess: () => {
            Swal.fire("Sukses!", "Data berhasil dihapus.", "success").then(() =>
                location.reload()
            );
        },
        onError: () => {
            Swal.fire("Gagal", "Terjadi kesalahan saat menghapus.", "error");
        },
    });

    // Delete Clasifikasi
    initDeleteHandler({
        tableSelector: "#classification-table",
        deleteUrl: route("classification.bulkDestroy"),
        onSuccess: () => {
            Swal.fire("Sukses!", "Data berhasil dihapus.", "success").then(() =>
                location.reload()
            );
        },
        onError: () => {
            Swal.fire("Gagal", "Terjadi kesalahan saat menghapus.", "error");
        },
    });
});
