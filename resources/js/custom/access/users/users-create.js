/**
 * Modul Users - Create
 * Mengelola form create user baru
 */

import $ from "jquery";
import { route } from "ziggy-js";
import NiceSelect from "nice-select2/src/js/nice-select2.js";
import { showSuccess, showError, confirmAction } from "../../../core/notification.js";

// Keep NiceSelect instances
let roleNiceSelectInstance = null;
let statusNiceSelectInstance = null;
let locationNiceSelectInstance = null;

/**
 * Remove existing nice-select wrapper and restore native select styles
 */
function cleanupNiceSelect(select) {
    const $select = $(select);
    const next = $select.next(".nice-select");
    if (next.length) {
        next.remove();
    }
    $select.css({ opacity: "", width: "", padding: "", height: "", display: "" });
}

/**
 * Initialize role select
 */
function initRoleSelect() {
    const select = $("#userRole");
    cleanupNiceSelect(select);

    if (roleNiceSelectInstance) {
        roleNiceSelectInstance.destroy();
    }
    if (typeof NiceSelect !== "undefined") {
        roleNiceSelectInstance = new NiceSelect(select[0], {
            searchable: true,
            placeholder: "-- Pilih Role --",
        });
    }
}

/**
 * Initialize status select
 */
function initStatusSelect() {
    const select = $("#userStatus");

    cleanupNiceSelect(select);

    if (statusNiceSelectInstance) {
        statusNiceSelectInstance.destroy();
    }

    if (typeof NiceSelect !== "undefined") {
        statusNiceSelectInstance = new NiceSelect(select[0], {
            searchable: true,
            placeholder: "-- Pilih Status --",
        });
    }
}

/**
 * Initialize location select
 */
function initLocationSelect() {
    const select = $("#userLocation");

    cleanupNiceSelect(select);

    if (locationNiceSelectInstance) {
        locationNiceSelectInstance.destroy();
    }

    if (typeof NiceSelect !== "undefined") {
        locationNiceSelectInstance = new NiceSelect(select[0], {
            searchable: true,
            placeholder: "-- Pilih Location --",
        });
    }
}

/**
 * Reset modal form
 */
function resetUserForm() {
    $("#form-user")[0].reset();
    $("#userId").val("");
    $("#userMethod").val("POST");

    // Restore password fields visibility without touching parent layout containers
    const passwordField = $("#userPassword").closest(".space-y-2");
    const passwordConfirmField = $("#userPasswordConfirmation").closest(".space-y-2");
    passwordField.removeClass("hidden");
    passwordConfirmField.removeClass("hidden");

    // Ensure required markers are visible again
    passwordField.find("label span.text-red-500").show();
    passwordConfirmField.find("label span.text-red-500").show();

    $("p[id^='error-']").text("");
}

/**
 * Close user modal dengan animasi smooth
 */
function closeUserModal() {
    const modal = $("#userModal");
    const backdrop = $("#userModalBackdrop");
    const content = $("#userModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        modal.addClass("hidden").removeClass("flex").css("opacity", "0");
    }, 300);
}

/**
 * Open modal create user dengan animasi
 */
$("#btn-create-user").on("click", async function () {
    resetUserForm();
    $("#userModalTitle").text("Tambah User");
    $("#userModalIcon").removeClass("mgc_user_edit_line").addClass("mgc_user_add_line");
    $("#userMethod").val("POST");

    const modal = $("#userModal");
    const backdrop = $("#userModalBackdrop");
    const content = $("#userModalContent");

    // Show modal
    modal.removeClass("hidden").addClass("flex").css("opacity", "1");
    
    // Animate backdrop & content
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ "transform": "scale(1)", "opacity": "1" });
    });

    // Reset selects to placeholder after load
    $("#userLocation").val("");
    if (locationNiceSelectInstance) {
        locationNiceSelectInstance.update();
    }
    $("#userRole").val("");
    if (roleNiceSelectInstance) {
        roleNiceSelectInstance.update();
    }
    $("#userStatus").val("");
    if (statusNiceSelectInstance) {
        statusNiceSelectInstance.update();
    }
});

/**
 * Handle user form submission (Create)
 */
$("#form-user").on("submit", async function (e) {
    e.preventDefault();

    const userId = $("#userId").val();
    const isCreate = !userId;
    
    // Only handle create in this module
    if (!isCreate) return;

    const url = route("users.store");
    const formData = new FormData(this);
    const submitBtn = $(this).find('button[type="submit"]');
    const originalBtnText = submitBtn.html();

    // Clear previous errors
    $("p[id^='error-']").text("");

    // Client-side validation
    const name = formData.get("name");
    if (!name || name.trim() === "") {
        $("#error-name").html('<i class="mgc_info_line mr-1"></i>Nama user wajib diisi');
        return;
    }

    const email = formData.get("email");
    if (!email || email.trim() === "") {
        $("#error-email").html('<i class="mgc_info_line mr-1"></i>Email wajib diisi');
        return;
    }

    const password = formData.get("password");
    const passwordConfirmation = formData.get("password_confirmation");

    if (!password || password.trim() === "") {
        $("#error-password").html('<i class="mgc_info_line mr-1"></i>Password wajib diisi');
        return;
    }
    if (password.length < 8) {
        $("#error-password").html('<i class="mgc_info_line mr-1"></i>Password minimal 8 karakter');
        return;
    }
    if (!passwordConfirmation || passwordConfirmation.trim() === "") {
        $("#error-password_confirmation").html('<i class="mgc_info_line mr-1"></i>Konfirmasi password wajib diisi');
        return;
    }
    if (password !== passwordConfirmation) {
        $("#error-password_confirmation").html('<i class="mgc_info_line mr-1"></i>Password tidak sesuai dengan konfirmasi');
        return;
    }

    const role = formData.get("role");
    if (!role || role.trim() === "") {
        $("#error-role").html('<i class="mgc_info_line mr-1"></i>Role wajib dipilih');
        return;
    }

    const isActive = formData.get("is_active");
    if (!isActive || isActive.trim() === "") {
        $("#error-is_active").html('<i class="mgc_info_line mr-1"></i>Status wajib dipilih');
        return;
    }

    // Show loading state
    submitBtn.prop("disabled", true);
    submitBtn.html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
            body: formData,
        });

        // Read once to avoid body consumption issues when parsing JSON
        const responseText = await response.text();
        let data = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error("Failed to parse JSON response", parseError, responseText);
            showError("Respon server tidak valid. Silakan coba lagi.");
            return;
        }

        if (response.status === 409 && data.restorable) {
            const confirmed = await confirmAction(
                data.message || "User dengan email ini pernah dihapus. Aktifkan kembali?",
                "Aktifkan User?",
                {
                    confirmButtonText: "Ya, aktifkan",
                    cancelButtonText: "Batal",
                    icon: "question",
                }
            );

            if (!confirmed) {
                return;
            }

            // Kirim ulang request dengan flag restore
            formData.append("restore_deleted", "1");

            const restoreResponse = await fetch(url, {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
                body: formData,
            });

            const restoreText = await restoreResponse.text();
            let restoreData = {};

            try {
                restoreData = restoreText ? JSON.parse(restoreText) : {};
            } catch (parseError) {
                console.error("Failed to parse restore JSON response", parseError, restoreText);
                showError("Respon server tidak valid. Silakan coba lagi.");
                return;
            }

            if (!restoreResponse.ok) {
                if (restoreData.errors) {
                    Object.keys(restoreData.errors).forEach((field) => {
                        const errorEl = $(`#error-${field}`);
                        if (errorEl.length) {
                            errorEl.text(restoreData.errors[field][0]);
                        }
                    });
                } else {
                    showError(restoreData.message || "Gagal mengaktifkan user");
                }
                return;
            }

            showSuccess(
                restoreData.message || "User berhasil diaktifkan kembali",
                "Berhasil!"
            ).then(() => {
                closeUserModal();
                location.reload();
            });

            return;
        }

        if (!response.ok) {
            if (data.errors) {
                Object.keys(data.errors).forEach((field) => {
                    const errorEl = $(`#error-${field}`);
                    if (errorEl.length) {
                        errorEl.html(`<i class="mgc_alert_circle_line mr-1"></i>${data.errors[field][0]}`);
                    }
                });
            } else {
                showError(data.message || "Gagal menyimpan user");
            }
            return;
        }

        showSuccess(
            data.message || "User berhasil ditambahkan",
            "Berhasil!"
        ).then(() => {
            closeUserModal();
            location.reload();
        });
    } catch (error) {
        console.error("Error:", error);
        showError("Terjadi kesalahan saat menyimpan user");
    } finally {
        submitBtn.prop("disabled", false);
        submitBtn.html(originalBtnText);
    }
});

/**
 * Modal close buttons
 */
$("#userModalClose, #userModalCancel").on("click", function () {
    closeUserModal();
});

// Initialize on ready
$(document).ready(function () {
    initRoleSelect();
    initStatusSelect();
    initLocationSelect();
});

// Export functions for use in other modules
export { initRoleSelect, initStatusSelect, cleanupNiceSelect, closeUserModal };
