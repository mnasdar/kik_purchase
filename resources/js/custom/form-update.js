import $ from "jquery";
import Swal from "sweetalert2";
import AutoNumeric from "autonumeric";
import {
    initCurrencyInput,
    initAmountAutoCalc,
} from "@/custom/autonumeric-input";

$(function () {
    const form = $("#form-update");
    const submitBtn = form.find('button[type="submit"]');
    const loader = submitBtn.find(".loader");
    const submitText = submitBtn.find("span:last");

    // Simpan data awal
    const initialData = form.serialize();

    // Deteksi perubahan form
    form.on("input change", "input, select, textarea,file", function () {
        const currentData = form.serialize();
        submitBtn.prop("disabled", currentData === initialData);
    });
    // Tombol cancel
    $("#btn-cancel").on("click", function () {
        const url = $(this).data("url");
        if (url) {
            window.location.href = url;
        }
    });

    // Handle submit
    form.on("submit", function (e) {
        e.preventDefault();

        const url = form.attr("action");
        const method = form.attr("method") || "POST";

        const formData = {};
        form.find("[name]").each(function () {
            const name = $(this).attr("name");
            formData[name] = $(this).val();
        });
        // Timpa nilai AutoNumeric
        formData["unit_price"] = AutoNumeric.getNumber("#inputUnitPrice");
        formData["quantity"] = AutoNumeric.getNumber("#inputQuantity");
        formData["amount"] = AutoNumeric.getNumber("#inputAmount");

        Swal.fire({
            title: "Apakah Anda yakin?",
            text: "Perubahan akan disimpan.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, simpan!",
            cancelButtonText: "Batal",
            customClass: {
                confirmButton: "btn bg-primary text-white w-xs me-2 mt-2",
                cancelButton: "btn bg-danger text-white w-xs mt-2",
            },
            buttonsStyling: false,
        }).then((result) => {
            if (result.isConfirmed) {
                // Bersihkan error
                form.find('p[id^="error-"]').text("");

                // Tampilkan loading
                submitBtn.prop("disabled", true);
                loader.removeClass("hidden");
                submitText.addClass("opacity-50");

                $.ajax({
                    url: url,
                    method: method,
                    data: formData,
                    success: function (response) {
                        Swal.fire({
                            title: "Sukses!",
                            text: "Data berhasil diperbarui.",
                            icon: "success",
                            customClass: {
                                confirmButton:
                                    "btn bg-primary text-white w-xs mt-2",
                            },
                            buttonsStyling: false,
                        }).then(() => {
                            window.location.href =
                                response.redirect || "/produk";
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
                        // Enable ulang jika gagal
                        submitBtn.prop("disabled", false);
                    },
                });
            }
        });
    });

    // Disable tombol update saat load pertama
    submitBtn.prop("disabled", true);
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
