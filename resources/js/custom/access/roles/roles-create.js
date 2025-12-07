/**
 * Modul Roles - Create
 * Mengelola form create role baru
 */

import $ from "jquery";
import { route } from "ziggy-js";
import { showSuccess, showError } from "../../../core/notification.js";

/**
 * Load permissions dari server untuk form create
 */
async function loadPermissions(selectedIds = []) {
    try {
        const response = await fetch(route("roles.apiPermissions"));
        const data = await response.json();
        const permissions = data.permissions || [];
        const categories = data.categories || [];

        let html = "";

        // Group permissions by category dengan checkbox select all
        categories.forEach((category) => {
            const categoryPermissions = permissions.filter(
                (p) => p.category === category
            );

            if (categoryPermissions.length > 0) {
                const categorySlug = (category || "Other").toLowerCase().replace(/\s+/g, '-');
                
                html += `
                    <div class="space-y-2" data-category="${categorySlug}">
                        <div class="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 sticky top-0 z-10">
                            <label class="font-bold text-xs uppercase tracking-wider text-blue-800 dark:text-blue-200 flex items-center gap-2 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100 transition-colors">
                                <input type="checkbox" 
                                    class="category-select-all w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                    data-category="${categorySlug}">
                                <span class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></span>
                                ${category || "Other"}
                            </label>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
                `;

                categoryPermissions.forEach((permission) => {
                    const isChecked = selectedIds.includes(permission.id) ? "checked" : "";
                    html += `
                        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                            <input type="checkbox" name="permissions[]" 
                                value="${permission.id}" 
                                class="permission-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                data-category="${categorySlug}"
                                ${isChecked}>
                            <span class="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                ${permission.display_name || permission.name}
                            </span>
                        </label>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            }
        });

        $("#permissionsContainer").html(html);
        
        // Initialize category checkboxes
        initCategoryCheckboxes();
    } catch (error) {
        console.error("Error loading permissions:", error);
        $("#permissionsContainer").html(
            '<p class="text-red-500 text-sm">Gagal memuat permissions</p>'
        );
    }
}

/**
 * Initialize category checkbox states and event handlers
 */
function initCategoryCheckboxes() {
    // Update all category checkboxes based on current state
    $(".category-select-all").each(function () {
        updateCategoryCheckboxState($(this).data("category"));
    });

    // Handle category checkbox click (select/deselect all in category)
    $(document).off("change", ".category-select-all").on("change", ".category-select-all", function () {
        const category = $(this).data("category");
        const isChecked = $(this).prop("checked");
        
        // Select/deselect all permissions in this category
        $(`.permission-checkbox[data-category="${category}"]`).prop("checked", isChecked);
        
        // Update the category checkbox state (remove indeterminate)
        updateCategoryCheckboxState(category);
    });

    // Handle individual permission checkbox click
    $(document).off("change", ".permission-checkbox").on("change", ".permission-checkbox", function () {
        const category = $(this).data("category");
        updateCategoryCheckboxState(category);
    });
}

/**
 * Update category checkbox state based on its permissions
 */
function updateCategoryCheckboxState(category) {
    const categoryCheckbox = $(`.category-select-all[data-category="${category}"]`);
    const permissionCheckboxes = $(`.permission-checkbox[data-category="${category}"]`);
    
    const total = permissionCheckboxes.length;
    const checked = permissionCheckboxes.filter(":checked").length;
    
    if (checked === 0) {
        // None checked
        categoryCheckbox.prop("checked", false);
        categoryCheckbox.prop("indeterminate", false);
    } else if (checked === total) {
        // All checked
        categoryCheckbox.prop("checked", true);
        categoryCheckbox.prop("indeterminate", false);
    } else {
        // Some checked (indeterminate state)
        categoryCheckbox.prop("checked", false);
        categoryCheckbox.prop("indeterminate", true);
    }
}

/**
 * Reset modal form
 */
function resetRoleForm() {
    $("#form-role")[0].reset();
    $("#roleId").val("");
    $("#roleMethod").val("POST");
    loadPermissions([]);
    $("p[id^='error-']").text("");
}

/**
 * Close role modal dengan animasi
 */
function closeRoleModal() {
    const modal = $("#roleModal");
    const backdrop = $("#roleModalBackdrop");
    const content = $("#roleModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        modal.addClass("hidden").removeClass("flex").css("opacity", "0");
    }, 300);
}

/**
 * Open modal create role dengan animasi
 */
$("#btn-create-role").on("click", async function () {
    resetRoleForm();
    $("#roleModalTitle").text("Tambah Role");
    $("#roleModalIcon").removeClass("mgc_shield_edit_line").addClass("mgc_shield_add_line");
    $("#roleMethod").val("POST");

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

    await loadPermissions([]);
});

/**
 * Handle role form submission (Create)
 */
$("#form-role").on("submit", async function (e) {
    e.preventDefault();

    const roleId = $("#roleId").val();
    const isCreate = !roleId;
    
    // Only handle create in this module
    if (!isCreate) return;

    const url = route("roles.store");
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
            if (data.errors) {
                Object.keys(data.errors).forEach((field) => {
                    const errorEl = $(`#error-${field}`);
                    if (errorEl.length) {
                        errorEl.html(`<i class="mgc_alert_circle_line mr-1"></i>${data.errors[field][0]}`);
                    }
                });
            } else {
                showError(data.message || "Gagal menyimpan role");
            }
            return;
        }

        showSuccess(
            data.message || "Role berhasil ditambahkan",
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

/**
 * Modal close buttons
 */
$("#roleModalClose, #roleModalCancel").on("click", function () {
    closeRoleModal();
});

// Export functions for use in other modules
export { loadPermissions, closeRoleModal };
