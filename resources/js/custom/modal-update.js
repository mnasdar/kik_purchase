import $ from "jquery";
import Swal from "sweetalert2";
import { route } from "ziggy-js";
import flatpickr from "flatpickr";

export default function initEditModalHandler(config) {
    const {
        resourceName, // ex: 'kategori-produk'
        editButtonSelector, // ex: '.btn-edit'
        submitButtonSelector, // ex: '#btnUpdate'
        loaderOverlaySelector, // ex: '#loaderOverlay'
        dateId,
    } = config;

    const $form = $("#editItemForm");
    const $modal = $("#editModal");
    const $editButton = $(".btn-edit");
    const $submitBtn = $("#btnUpdate");
    const $loader = $submitBtn.find(".loader");
    const $loaderOverlay = $("#loaderOverlay");

    let initialFormData = {}; // ✅ Track nilai awal

    function showLoader() {
        $loaderOverlay.removeClass("hidden").addClass("flex");
    }

    function hideLoader() {
        $loaderOverlay.removeClass("flex").addClass("hidden");
    }

    function openModal() {
        $modal.removeClass("hidden");
        $("body").addClass("overflow-hidden");
    }

    function closeModal() {
        $modal.addClass("hidden");
        $("body").removeClass("overflow-hidden");
        initialFormData = {}; // ✅ Reset saat modal ditutup
    }

    // ✅ Track perubahan input
    $form.on("input change", "input, select", function () {
        let hasChanged = false;

        $form.find("input, select").each(function () {
            const input = $(this);
            const key = input.attr("name");
            if (key && initialFormData.hasOwnProperty(key)) {
                if (input.val() !== initialFormData[key]) {
                    hasChanged = true;
                    return false; // break loop
                }
            }
        });

        $submitBtn.prop("disabled", !hasChanged);
    });

    // Event tombol edit utama
    $editButton.on("click", function () {
        const checked = $(
            `input[type="checkbox"]:not([id^="headerCheck"]):checked`
        );
        if (checked.length === 1) {
            const id = checked.val();
            const routeEdit = route(`${resourceName}.edit`, id);
            showLoader();

            $.ajax({
                url: routeEdit,
                method: "GET",
                dataType: "json",
                success: function (data) {
                    if (dateId && $(dateId).length) {
                        flatpickr(dateId, {
                            defaultDate: new Date(data.tgl_terima),
                            dateFormat: "Y-m-d", // Format yang dikirim ke server (misalnya untuk form)
                            altInput: true, // Tampilkan input tambahan yang lebih user-friendly
                            altFormat: "d-M-Y", // Format yang ditampilkan ke pengguna
                        });
                    }
                    initialFormData = {};
                    $form.find("input change,input, select").each(function () {
                        const input = $(this);
                        const key = input.attr("name");
                        if (key) {
                            initialFormData[key] = input.val();
                        }

                        if (
                            key &&
                            Object.prototype.hasOwnProperty.call(data, key)
                        ) {
                            const value = data[key];
                            if (input.is("select")) {
                                input.val(value);
                                input.find("option").prop("selected", false);
                                input
                                    .find(`option[value="${value}"]`)
                                    .prop("selected", true);
                                input.trigger("change");

                                const $niceSelect = input.next(".nice-select");
                                const $niceSelected =
                                    $niceSelect.find(`.option`);
                                $niceSelected.removeClass("selected focus");
                                const $targetOption = $niceSelected.filter(
                                    `[data-value="${value}"]`
                                );
                                $targetOption.addClass("selected focus");
                                $niceSelect
                                    .find(".current")
                                    .text($targetOption.text());
                            } else {
                                input.val(value);
                            }
                        }
                    });

                    // ✅ Simpan data awal form
                    initialFormData = {};
                    $form.find("input, select").each(function () {
                        const input = $(this);
                        const key = input.attr("name");
                        if (key) {
                            initialFormData[key] = input.val();
                        }
                    });

                    // ✅ Tombol update nonaktif dulu
                    $submitBtn.prop("disabled", true);

                    hideLoader();
                    openModal();
                },
                error: function () {
                    hideLoader();
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: "Gagal mengambil data! Silakan coba lagi.",
                    });
                },
            });
        }
    });

    // Handle submit
    $form.on("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const checked = $(
            `input[type="checkbox"]:not([id^="headerCheck"]):checked`
        );
        if (checked.length === 1) {
            const id = checked.val();
            const routeUpdate = route(`${resourceName}.update`, id);

            $submitBtn.prop("disabled", true);
            $loader.removeClass("hidden");

            $.ajax({
                url: routeUpdate,
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr(
                        "content"
                    ),
                    Accept: "application/json",
                },
                data: formData,
                processData: false,
                contentType: false,
                success: function () {
                    $form.find(".error-message").text("");
                    Swal.fire({
                        icon: "success",
                        title: "Berhasil",
                        text: "Data berhasil diperbarui",
                        timer: 1500,
                        showConfirmButton: false,
                    });

                    closeModal();
                    setTimeout(() => location.reload(), 1500);
                },
                error: function (xhr) {
                    if (xhr.status === 422) {
                        const errors = xhr.responseJSON.errors || {};
                        $form.find(".error-message").text("");
                        for (const key in errors) {
                            const errorMsg = errors[key][0];
                            const $errorField = $(`#error-edit-${key}`);
                            if ($errorField.length) {
                                $errorField.text(errorMsg);
                            }
                        }
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Gagal",
                            text: "Terjadi kesalahan saat memperbarui data.",
                        });
                    }
                },
                complete: function () {
                    $submitBtn.prop("disabled", false);
                    $loader.addClass("hidden");
                },
            });
        }
    });
}

$(document).ready(function () {
    // Tabel Onsiite
    if ($("#onsite-table").length) {
        initEditModalHandler({
            resourceName: "po-onsite",
            dateId: "#tgl_terimaEdit",
        });
    }

    // Tabel Status
    if ($("#status-table").length) {
        initEditModalHandler({
            resourceName: "status",
        });
    }

    // Tabel Classification
    if ($("#classification-table").length) {
        initEditModalHandler({
            resourceName: "classification",
        });
    }
});
