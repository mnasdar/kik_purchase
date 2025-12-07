/**
 * Modul Users - Edit
 * Mengelola form edit user
 */

import $ from "jquery";
import { route } from "ziggy-js";
import NiceSelect from "nice-select2/src/js/nice-select2.js";
import { showSuccess, showError, showLoading, hideLoading } from "../../../core/notification.js";

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

    // Restore password fields visibility without hiding larger flex wrappers
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
 * Open modal edit user dengan animasi
 */
$(document).on("click", ".btn-edit-user", async function () {
    const userId = $(this).data("user-id");
    const btn = $(this);
    const prevHtml = btn.html();

    try {
        // Show loading state on button
        btn.addClass("pointer-events-none opacity-60");
        btn.html('<i class="mgc_refresh_2_line animate-spin"></i>');

        resetUserForm();
        $("#userMethod").val("PUT");
        $("#userModalTitle").text("Edit User");
        $("#userModalIcon").removeClass("mgc_user_add_line").addClass("mgc_user_edit_line");

        // Hide password fields for edit mode (only the field blocks)
        const passwordField = $("#userPassword").closest(".space-y-2");
        const passwordConfirmField = $("#userPasswordConfirmation").closest(".space-y-2");
        passwordField.addClass("hidden");
        passwordConfirmField.addClass("hidden");
        $("#passwordRequired").text("");
        $("#passwordConfirmRequired").text("");

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

        // Fetch user data from server
        const response = await fetch(route("users.show", { user: userId }), {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });

        const responseText = await response.text();
        let data = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error("Failed to parse JSON response", parseError, responseText);
            throw new Error("Respon server tidak valid");
        }

        if (!response.ok) {
            throw new Error(data.message || "Gagal mengambil data user");
        }

        // Populate form
        $("#userId").val(data.id);
        $("#userName").val(data.name);
        $("#userEmail").val(data.email);
        $("#userLocation").val(data.location_id || "");
        $("#userRole").val(data.role_id || "");
        $("#userStatus").val(data.is_active ? "1" : "0");

        // Update NiceSelect display
        if (locationNiceSelectInstance) locationNiceSelectInstance.update();
        if (roleNiceSelectInstance) roleNiceSelectInstance.update();
        if (statusNiceSelectInstance) statusNiceSelectInstance.update();
    } catch (error) {
        console.error("Error loading user:", error);
        showError("Gagal memuat data user");
        closeUserModal();
    } finally {
        btn.removeClass("pointer-events-none opacity-60");
        btn.html(prevHtml);
    }
});

/**
 * Handle user form submission (Update)
 */
$("#form-user").on("submit", async function (e) {
    e.preventDefault();

    const userId = $("#userId").val();
    const isCreate = !userId;
    
    // Only handle update in this module
    if (isCreate) return;

    const url = route("users.update", { user: userId });
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

    // For edit, password is optional but must match confirmation if provided
    if (password && password.trim() !== "") {
        if (password.length < 8) {
            $("#error-password").html('<i class="mgc_info_line mr-1"></i>Password minimal 8 karakter');
            return;
        }
        if (!passwordConfirmation || passwordConfirmation.trim() === "") {
            $("#error-password_confirmation").html('<i class="mgc_info_line mr-1"></i>Konfirmasi password wajib diisi jika mengubah password');
            return;
        }
        if (password !== passwordConfirmation) {
            $("#error-password_confirmation").html('<i class="mgc_info_line mr-1"></i>Password tidak sesuai dengan konfirmasi');
            return;
        }
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

    // Convert FormData to JSON object for PUT request
    const jsonData = {};
    for (let [key, value] of formData.entries()) {
        // Only include non-empty values, or include password fields only if filled
        if (key === 'password' || key === 'password_confirmation') {
            if (value && value.trim() !== '') {
                jsonData[key] = value;
            }
        } else {
            jsonData[key] = value;
        }
    }

    // Show loading state
    submitBtn.prop("disabled", true);
    submitBtn.html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');

    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(jsonData),
        });

        const responseText = await response.text();
        let data = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error("Failed to parse JSON response", parseError, responseText);
            showError("Respon server tidak valid. Silakan coba lagi.");
            return;
        }

        if (!response.ok) {
            // Handle validation errors from server
            if (data.errors) {
                Object.keys(data.errors).forEach((field) => {
                    const errorEl = $(`#error-${field}`);
                    if (errorEl.length) {
                        errorEl.html(`<i class="mgc_alert_circle_line mr-1"></i>${data.errors[field][0]}`);
                    }
                });
            } else {
                showError(data.message || "Gagal mengupdate user");
            }
            return;
        }

        // Success
        showSuccess(
            data.message || "User berhasil diupdate",
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

// Initialize on ready
$(document).ready(function () {
    initRoleSelect();
    initStatusSelect();
    initLocationSelect();
});

// Export functions
export { initRoleSelect, initStatusSelect, cleanupNiceSelect, closeUserModal };
