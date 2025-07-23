import $ from 'jquery';
import Swal from 'sweetalert2';

$(function () {
    const form = $('#form-create');
    const submitBtn = form.find('button[type="submit"]');
    const loader = submitBtn.find('.loader');
    const submitText = submitBtn.find('span:last');

    // Simpan data awal form
    const initialFormData = new FormData(form[0]);
    const initialSnapshot = snapshotFormData(initialFormData);

    // Fungsi membandingkan FormData
    function snapshotFormData(formData) {
        const entries = [];
        for (const [key, value] of formData.entries()) {
            // Untuk file input, simpan nama file saja agar bisa dibandingkan
            if (value instanceof File) {
                entries.push([key, value.name || '']);
            } else {
                entries.push([key, value]);
            }
        }
        return JSON.stringify(entries);
    }

    // Deteksi perubahan pada semua elemen input
    form.on('input change', 'input, select, textarea', function () {
        const currentFormData = new FormData(form[0]);
        const currentSnapshot = snapshotFormData(currentFormData);

        submitBtn.prop('disabled', currentSnapshot === initialSnapshot);
    });

    // Disable tombol update saat load pertama
    submitBtn.prop('disabled', true);

    form.on('submit', function (e) {
        e.preventDefault();

        // Ambil data dari form
        const url = form.attr('action');
        const method = form.attr('method') || 'POST';

        const formData = new FormData(this); // `this` mengacu ke form

        // Tampilkan konfirmasi terlebih dahulu
        Swal.fire({
            title: 'Apakah Anda yakin?',
            text: "Data akan disimpan ke sistem.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, simpan!',
            cancelButtonText: 'Batal',
            confirmButtonClass: 'btn bg-primary text-white w-xs me-2 mt-2',
            cancelButtonClass: 'btn bg-danger text-white w-xs mt-2',
            buttonsStyling: false,
        }).then(function (result) {
            if (result.isConfirmed) {
                // Bersihkan error sebelumnya
                form.find('p[id^="error-"]').text('');

                // Tampilkan loader
                loader.removeClass('hidden');
                submitText.addClass('opacity-50');

                // Kirim data via AJAX
                $.ajax({
                    url: url,
                    method: method,
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (response) {
                        Swal.fire({
                            title: 'Sukses!',
                            text: 'Data berhasil disimpan.',
                            icon: 'success',
                            confirmButtonClass: 'btn bg-primary text-white w-xs mt-2',
                            buttonsStyling: false
                        }).then(() => {
                            window.location.href = response.redirect || '/index';
                        });
                    },
                    error: function (xhr) {
                        if (xhr.status === 422) {
                            const errors = xhr.responseJSON.errors;
                            Object.keys(errors).forEach(key => {
                                $(`#error-${key}`).text(errors[key][0]);
                            });
                        } else {
                            Swal.fire('Gagal', 'Terjadi kesalahan. Silakan coba lagi.', 'error');
                        }
                    },
                    complete: function () {
                        loader.addClass('hidden');
                        submitText.removeClass('opacity-50');
                    }
                });
            }
        });
    });

    // Cancel
    $('#btn-cancel').on('click', function () {
        const url = $(this).data('url');
        if (url) {
            window.location.href = url;
        }
    });
});


$(document).ready(function () {
    $('input[type="number"]').on('keypress', function (e) {
        const charCode = e.which ? e.which : e.keyCode;

        // Hanya izinkan angka (0–9)
        if (charCode < 48 || charCode > 57) {
            e.preventDefault();
        }
    });

    // Cegah nilai di bawah 1 jika menggunakan paste atau mouse scroll
    $('input[type="number"]').on('input', function () {
        const val = $(this).val();
        if (val < 1 || isNaN(val)) {
            $(this).val('');
        }
    });

    // Cegah scroll mouse untuk mengubah nilai input
    $('input[type="number"]').on('wheel', function (e) {
        $(this).blur(); // hilangkan fokus agar scroll tidak mempengaruhi nilai
    });
});
