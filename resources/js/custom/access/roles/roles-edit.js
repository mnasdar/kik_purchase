/**
 * Modul Roles - Edit
 * Mengelola form edit role
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showSuccess, showError } from "../../../core/notification.js";
import { loadPermissions, closeRoleModal } from "./roles-create.js";

/**
 * Open modal edit role dengan animasi
 */
$(document).on("click", ".btn-edit-role", async function () {
    const roleId = $(this).data("role-id");
    const btn = $(this);
    const prevHtml = btn.html();

    try {
        // Show loading state on button
        btn.addClass("pointer-events-none opacity-60");
        btn.html('<i class="mgc_refresh_2_line animate-spin"></i>');

        $("#form-role")[0].reset();
        $("#roleMethod").val("PUT");
        $("#roleModalTitle").text("Edit Role");
        $("#roleModalIcon").removeClass("mgc_shield_add_line").addClass("mgc_shield_edit_line");

        const modal = $("#roleModal");
        const backdrop = $("#roleModalBackdrop");
        const content = $("#roleModalContent");
        
        // Show modal
        modal.removeClass("hidden").addClass("flex").css("opacity", "1");
        
        // Animate backdrop & content
        requestAnimationFrame(() => {
            backdrop.css("opacity", "1");
            content.css({ "transform": "scale(1)", "opacity": "1" });
        });

        // Fetch role data from server
        const response = await fetch(route("roles.permissions", { role: roleId }), {
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
            throw new Error(data.message || "Gagal mengambil data role");
        }

        // Populate form
        $("#roleId").val(data.role.id);
        $("#roleName").val(data.role.name);

        // Load permissions with selected ones
        const selectedPermissions = data.permissions || [];
        const selectedIds = selectedPermissions.map((p) => p.id);
        await loadPermissions(selectedIds);

    } catch (error) {
        console.error("Error loading role:", error);
        showError("Gagal memuat data role");
        closeRoleModal();
    } finally {
        btn.removeClass("pointer-events-none opacity-60");
        btn.html(prevHtml);
    }
});

/**
 * Handle role form submission (Update)
 */
$("#form-role").on("submit", async function (e) {
    e.preventDefault();

    const roleId = $("#roleId").val();
    const isCreate = !roleId;
    
    // Only handle update in this module
    if (isCreate) return;

    const url = route("roles.update", { role: roleId });
    const formData = new FormData(this);
    
    const submitBtn = $(this).find('button[type="submit"]');
    const originalBtnText = submitBtn.html();

    // Clear previous errors
    $("p[id^='error-']").text("");

    // Client-side validation
    const name = formData.get("name");
    if (!name || name.trim() === "") {
        $("#error-name").html('<i class="mgc_info_line mr-1"></i>Nama role wajib diisi');
        return;
    }

    const permissions = formData.getAll("permissions[]");
    if (permissions.length === 0) {
        $("#error-permissions").html('<i class="mgc_info_line mr-1"></i>Minimal 1 permission harus dipilih');
        return;
    }

    // Convert FormData to JSON object for PUT request
    const jsonData = {};
    for (let [key, value] of formData.entries()) {
        if (key === 'permissions[]') {
            if (!jsonData.permissions) {
                jsonData.permissions = [];
            }
            jsonData.permissions.push(value);
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
                showError(data.message || "Gagal mengupdate role");
            }
            return;
        }

        // Success
        showSuccess(
            data.message || "Role berhasil diupdate",
            "Berhasil!"
        ).then(() => {
            closeRoleModal();
            location.reload();
        });
    } catch (error) {
        console.error("Error:", error);
        showError("Terjadi kesalahan saat menyimpan role");
    } finally {
        submitBtn.prop("disabled", false);
        submitBtn.html(originalBtnText);
    }
});
