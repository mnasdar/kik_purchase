import $ from "jquery";
import Swal from "sweetalert2";
import AutoNumeric from "autonumeric";
import {
    initCurrencyInput,
    initAmountAutoCalc,
} from "@/custom/autonumeric-input";

$(function () {
    const form = $("#form-create");
    const submitBtn = form.find('button[type="submit"]');
    const loader = submitBtn.find(".loader");
    const submitText = submitBtn.find("span:last");

    // Simpan data awal form
    const initialFormData = new FormData(form[0]);
    const initialSnapshot = snapshotFormData(initialFormData);

    // Fungsi membandingkan FormData
    function snapshotFormData(formData) {
        const entries = [];
        for (const [key, value] of formData.entries()) {
            // Untuk file input, simpan nama file saja agar bisa dibandingkan
            if (value instanceof File) {
                entries.push([key, value.name || ""]);
            } else {
                entries.push([key, value]);
            }
        }
        return JSON.stringify(entries);
    }

    // Deteksi perubahan pada semua elemen input
    form.on("input change", "input, select, textarea", function () {
        const currentFormData = new FormData(form[0]);
        const currentSnapshot = snapshotFormData(currentFormData);

        submitBtn.prop("disabled", currentSnapshot === initialSnapshot);
    });

    // Disable tombol update saat load pertama
    submitBtn.prop("disabled", true);

    form.on("submit", function (e) {
        e.preventDefault();

        // Ambil data dari form
        const url = form.attr("action");
        const method = form.attr("method") || "POST";

        const formData = new FormData(this); // `this` mengacu ke form
        // Ambil nilai bersih dari AutoNumeric
        formData.set("unit_price", AutoNumeric.getNumber("#inputUnitPrice"));
        formData.set("quantity", AutoNumeric.getNumber("#inputQuantity"));
        formData.set("amount", AutoNumeric.getNumber("#inputAmount"));

        // Tampilkan konfirmasi terlebih dahulu
        Swal.fire({
            title: "Apakah Anda yakin?",
            text: "Data akan disimpan ke sistem.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, simpan!",
            cancelButtonText: "Batal",
            customClass: {
                confirmButton: "btn bg-primary text-white w-xs me-2 mt-2",
                cancelButton: "btn bg-danger text-white w-xs mt-2",
            },
            buttonsStyling: false,
        }).then(function (result) {
            if (result.isConfirmed) {
                // Bersihkan error sebelumnya
                form.find('p[id^="error-"]').text("");

                // Tampilkan loader
                loader.removeClass("hidden");
                submitText.addClass("opacity-50");

                // Kirim data via AJAX
                $.ajax({
                    url: url,
                    method: method,
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (response) {
                        Swal.fire({
                            title: "Sukses!",
                            text: "Data berhasil disimpan.",
                            icon: "success",
                            customClass: {
                                confirmButton:
                                    "btn bg-primary text-white w-xs mt-2",
                            },
                            buttonsStyling: false,
                        }).then(() => {
                            window.location.href =
                                response.redirect || "/index";
                        });
                    },
                    error: function (xhr) {
                        if (xhr.status === 422) {
                            const errors = xhr.responseJSON.errors;
                            Object.keys(errors).forEach((key) => {
                                $(`#error-${key}`).text(errors[key][0]);
                            });
                        } else {
                            Swal.fire(
                                "Gagal",
                                "Terjadi kesalahan. Silakan coba lagi.",
                                "error"
                            );
                        }
                    },
                    complete: function () {
                        loader.addClass("hidden");
                        submitText.removeClass("opacity-50");
                    },
                });
            }
        });
    });

    // Cancel
    $("#btn-cancel").on("click", function () {
        const url = $(this).data("url");
        if (url) {
            window.location.href = url;
        }
    });
});

$(document).ready(function () {
    // Daftarkan semua input angka dengan AutoNumeric
    initCurrencyInput("#inputUnitPrice");
    initCurrencyInput("#inputQuantity", {
        currencySymbol: "",
    });
    initCurrencyInput("#inputAmount");

    // Hitung otomatis amount = unit_price × qty
    initAmountAutoCalc("#inputUnitPrice", "#inputQuantity", "#inputAmount");
});
