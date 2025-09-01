import $ from "jquery";
import Swal from "sweetalert2";

export default function initSaveModule({ formId, data_id }) {
    const form = $(formId);
    const submitBtn = form.find('button[type="submit"]');
    const loader = submitBtn.find(".loader");
    const submitText = submitBtn.find("span:last");

    form.on("submit", function (e) {
        e.preventDefault();

        // Ambil data dari form
        const url = form.attr("action");
        const method = form.attr("method") || "POST";

        const formData = new FormData(this); // `this` mengacu ke form

        // Tambahkan data items dari tabel
        $("#poTableBody tr").each(function (index) {
            const data_number = $(this).data(data_id);
            
            if (data_number) {
                formData.append(`items[${index}][${data_id}]`, data_number);
            }
        });

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
                            console.log(xhr.responseJSON); // 🔥 Lihat detail error
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
}
