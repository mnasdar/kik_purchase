import $ from "jquery";
import Swal from "sweetalert2";

/**
 * Module untuk menangani event pilih PO dari modal pencarian.
 *
 * @param {Object} options - Konfigurasi modul
 * @param {string} options.tableBodySelector - Selector <tbody> target
 * @param {function} options.rowTemplate - Fungsi untuk membentuk HTML row tabel (return string)
 * @param {function} options.onSelected - Callback opsional ketika data dipilih
 * @param {function} options.closeModal - Fungsi untuk menutup modal
 */
export default function initTableResult({
    tableBodySelector,
    rowTemplate,
    onSelected = () => {},
    closeModal,
}) {
    let counter = $(tableBodySelector + " tr").length;

    // Event: klik tombol pilih
    $(document).on("click", ".btn-pilih", function () {
        const data = $(this).data("search");
        counter++;

        // Tambahkan row ke tabel
        $(tableBodySelector).append(rowTemplate(data, counter));

        // Jalankan callback tambahan (misal hitung ulang total)
        onSelected(data, counter);

        // Tutup modal
        if (typeof closeModal === "function") {
            closeModal();
        }
    });

    $(document).on("click", ".btn-hapus", function () {
        $(this).closest("tr").remove();
    });
    
    // Tombol Proses: validasi dan buka modal jika valid
     $(document).on("click", ".btn-proses", function () {

        const jumlahProduk = $("#poTableBody tr").length;
        
        // Cek apakah ada produk
        if (jumlahProduk === 0) {
            return Swal.fire({
                icon: "warning",
                title: "Tidak ada produk",
                text: "Silakan tambahkan data terlebih dahulu.",
            });
        }
        // Tampilkan modal secara manual via trigger tombol tersembunyi
        $("#btnProses").trigger("click");
    });
}
