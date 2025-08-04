import $ from "jquery";
import Swal from "sweetalert2";
import { route } from "ziggy-js";

import { prefix, closeModal } from "./po-search";

// Format angka ke rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat("id-ID").format(angka);
}

// Event: saat produk dihapus
$(document).on("click", ".btn-hapus", function () {
    $(this).closest("tr").remove();
    hitungRekap();
    cekKetersediaanProduk(); // 🔥 Cek ulang saat data dihapus
});

// Auto-increment nomor urut
let produkCounter = $("#poTableBody tr").length;

// Saat Tombol pilih pada modal pencarian di clik
$(document).on("click", ".btn-pilih", function () {
    const po = $(this).data("po");
    const total = new Intl.NumberFormat("id-ID").format(po.total);
    const harga = new Intl.NumberFormat("id-ID").format(po.harga);
    const jumlah = new Intl.NumberFormat("id-ID").format(po.jumlah);

    produkCounter++;

    const row = `
        <tr data-po_number="${po.nomor_po}">
            <td class="whitespace-nowrap py-4 ps-4 pe-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                <b>${produkCounter}.</b>
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${po.status}
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${po.po_number}
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${po.approved_date}
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${po.supplier_name}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 harga-produk">
                <div class="items-center py-1 px-3 rounded text-sm font-medium bg-blue-100 text-blue-800">
                    <div class="flex justify-between items-center">
                        <span>Rp. </span><span>${harga}</span>
                    </div>
                </div>
            </td>
            <td class="whitespace-nowrap px-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                ${jumlah}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 harga-produk">
                <div class="items-center py-1 px-3 rounded text-sm font-medium bg-blue-100 text-blue-800">
                    <div class="flex justify-between items-center">
                        <span>Rp. </span><span>${total}</span>
                    </div>
                </div>
            </td>
            <td class="whitespace-nowrap py-4 px-3 text-center text-sm font-medium">
                <a href="javascript:void(0);" class="btn-hapus ms-0.5">
                    <i class="mgc_delete_line text-xl"></i>
                </a>
            </td>
        </tr>
    `;

    $("#poTableBody").append(row); // 🔥 Tambahkan ke tabel
    closeModal(); // Tutup modal & fokus ke input lagi
});

$(document).ready(function () {
    // Tombol Proses: validasi dan buka modal jika valid
    $(".btn-proses").on("click", function (e) {
        e.preventDefault();

        const jumlahProduk = $("#poTableBody tr").length;

        // Cek apakah ada produk
        if (jumlahProduk === 0) {
            return Swal.fire({
                icon: "warning",
                title: "Tidak ada produk",
                text: "Silakan tambahkan produk terlebih dahulu.",
            });
        }

        // Tampilkan modal secara manual via trigger tombol tersembunyi
        $("#btn-onsite").trigger("click");
    });

    // Tombol Save di modal: konfirmasi dan kirim AJAX
    $(".btn-save").on("click", function (e) {
        e.preventDefault();

        // Ambil tanggal terima dari input
        const tgl_terima = $("#datepo-onsite").val();

        // Validasi tanggal terima
        if (!tgl_terima) {
            return Swal.fire({
                icon: "warning",
                title: "Tanggal kosong",
                text: "Silakan isi tanggal terima terlebih dahulu.",
            });
        }

        // Kumpulkan nomor PO dari tabel
        const items = [];
        $("#poTableBody tr").each(function () {
            const po_number = $(this).data("po_number");
            if (po_number) {
                items.push({ po_number });
            }
        });

        // Konfirmasi simpan data
        Swal.fire({
            icon: "question",
            title: "Simpan Data?",
            text: "Apakah Anda yakin akan menyimpan data ini?",
            showCancelButton: true,
            confirmButtonText: "Ya, simpan",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                // Kirim data ke controller via AJAX
                $.ajax({
                    url: route("po-onsite.store",prefix), // Ganti dengan route milikmu
                    method: "POST",
                    data: {
                        _token: $('meta[name="csrf-token"]').attr("content"),
                        tgl_terima,
                        items,
                    },
                    beforeSend: function () {
                        $(".btn-save")
                            .prop("disabled", true)
                            .text("Menyimpan...");
                    },
                    success: function (response) {
                        Swal.fire({
                            icon: "success",
                            title: "Berhasil",
                            text: response.message || "Data berhasil disimpan.",
                        }).then(() => {
                            window.location.href = response.redirect || route("po-onsite.index");
                        });
                    },
                    error: function (xhr) {
                        Swal.fire({
                            icon: "error",
                            title: "Gagal",
                            text:
                                xhr.responseJSON?.message ||
                                "Terjadi kesalahan saat menyimpan data.",
                        });
                    },
                    complete: function () {
                        $(".btn-save").prop("disabled", false).text("Save");
                    },
                });
            }
        });
    });
});
