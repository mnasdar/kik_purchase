import $ from 'jquery';
import {
    approveDatePicker
} from '../pages/form-flatpickr';

$(document).ready(function () {
    const $loaderOverlay = $('#loaderOverlay');
    const $editModal = $('#editModal');
    const $form = $('#editItemForm');
    const $submitBtn = $('#btnUpdate');
    const $loader = $submitBtn.find('.loader');

    // Route helper
    function routeEdit(id) {
        return window.routes.routesEdit.replace('__ID__', id);
    }

    function routeUpdate(id) {
        return window.routes.routesUpdate.replace('__ID__', id);
    }

    // Loader
    function showLoader() {
        $loaderOverlay.removeClass('hidden').addClass('flex');
    }

    function hideLoader() {
        $loaderOverlay.removeClass('flex').addClass('hidden');
    }

    // Modal control
    function openModal() {
        $editModal.removeClass('hidden');
        $('body').addClass('overflow-hidden');
    }

    function closeModal() {
        $editModal.addClass('hidden');
        $('body').removeClass('overflow-hidden');
    }

    function parseApprovedDate(dateStr) {
        const months = {
            Jan: '01',
            Feb: '02',
            Mar: '03',
            Apr: '04',
            May: '05',
            Jun: '06',
            Jul: '07',
            Aug: '08',
            Sep: '09',
            Oct: '10',
            Nov: '11',
            Dec: '12'
        };

        const parts = dateStr.split('-'); // "13-Apr-25"
        if (parts.length !== 3) return null;

        const day = parts[0];
        const month = months[parts[1]];
        const year = '20' + parts[2]; // "25" → "2025"

        if (!month) return null;

        return `${year}-${month}-${day}`; // "2025-04-13"
    }

    // Handle edit button click
    $('.btn-edit').on('click', function () {
        const id = $(this).attr('edit-data-id');
        if (!id) return;

        showLoader();

        $.ajax({
            url: routeEdit(id),
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                $form.find('input, select, textarea').each(function () {
                    const input = $(this);
                    const key = input.attr('name');

                    if (key && Object.prototype.hasOwnProperty.call(data, key)) {
                        const value = data[key];
                        if (key === 'approved_date') {
                            // Untuk field 'approved_date' menggunakan Flatpickr
                            const parsedDate = parseApprovedDate(data[key]);
                            if (parsedDate) {
                                approveDatePicker.setDate(parsedDate);
                            }
                        } else if (input.is('select')) {
                            input.val(value); // update value as usual
                            input.find('option').prop('selected', false); // reset semua
                            input.find(`option[value="${value}"]`).prop('selected', true); // set selected

                            // Trigger event change untuk update nice-select2
                            input.trigger('change');

                            // Khusus untuk NiceSelect2 (manual update <li>)
                            const $niceSelect = input.next('.nice-select');
                            const $niceSelected = $niceSelect.find(`.option`);

                            // Reset semua li option
                            $niceSelected.removeClass('selected focus');

                            // Set focus & selected ke item yang sesuai
                            const $targetOption = $niceSelected.filter(`[data-value="${value}"]`);
                            $targetOption.addClass('selected focus');

                            // Ganti teks utama
                            $niceSelect.find('.current').text($targetOption.text());
                        } else {
                            // Untuk input biasa, set value
                            input.val(data[key]);
                        }
                    }
                });


                $form.attr('action', routeUpdate(data.id));
                hideLoader();
                openModal();
            },
            error: function () {
                hideLoader();
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Gagal mengambil data! Silakan coba lagi.'
                });
            }
        });
    });

    // Handle update submit
    $form.on('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const actionUrl = $form.attr('action');

        $submitBtn.prop('disabled', true);
        $loader.removeClass('hidden');

        $.ajax({
            url: actionUrl,
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Accept': 'application/json'
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                $('#error-edit-name').text('');
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data berhasil diperbarui',
                    timer: 1500,
                    showConfirmButton: false
                });

                closeModal();
                setTimeout(() => location.reload(), 1500);
            },
            error: function (xhr) {
                if (xhr.status === 422) {
                    const errors = xhr.responseJSON.errors || {};
                    // Reset semua error dulu
                    $form.find('.error-message').text('');

                    // Loop error dari server
                    for (const key in errors) {
                        if (errors.hasOwnProperty(key)) {
                            const errorMsg = errors[key][0];

                            // Tampilkan ke elemen error yang sesuai
                            const $errorField = $(`#error-edit-${key}`);
                            if ($errorField.length) {
                                $errorField.text(errorMsg);
                            }
                        }
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Terjadi kesalahan saat memperbarui data.'
                    });
                }
            },
            complete: function () {
                $submitBtn.prop('disabled', false);
                $loader.addClass('hidden');
            }
        });
    });
});
