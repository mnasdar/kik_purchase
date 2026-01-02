/**
 * Modul Users - Read & Display
 * Mengelola tabel users dan tampilan data
 */

import { initGridTable } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import { route } from "ziggy-js";
import tippy from "tippy.js";
import { showSuccess, showError, showToast } from "../../../core/notification.js";

let actionTippyInstances = [];

/**
 * Inisialisasi tabel users
 */
function initUsersTable() {
    if (!$("#table-users").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "name",
            name: "Name",
            width: "200px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "email",
            name: "Email",
            width: "250px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "role",
            name: "Role",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "verify",
            name: "Verify",
            width: "120px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "status",
            name: "Status",
            width: "120px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "actions",
            name: "Actions",
            width: "180px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];

    initGridTable({
        tableId: "#table-users",
        dataUrl: route("users.data"),
        columns: columns,
        enableCheckbox: false,
        limit: 10,
        enableFilter: false,
        onDataLoaded: () => {
            initActionTooltips();
        },
    });
}

/**
 * Init tooltips for action buttons
 */
function initActionTooltips() {
    // Destroy previous instances to avoid duplicates
    actionTippyInstances.forEach((inst) => inst.destroy());
    actionTippyInstances = [];

    // Initialize tooltips for dynamically loaded buttons
    const targets = document.querySelectorAll('#table-users [data-plugin="tippy"]');
    if (targets.length) {
        actionTippyInstances = tippy(targets);
    }
}

/**
 * Close permissions modal dengan animasi
 */
function closeUserPermissionsModal() {
    const modal = $("#userPermissionsModal");
    const backdrop = $("#userPermissionsModalBackdrop");
    const content = $("#userPermissionsModalContent");

    backdrop.css("opacity", "0");
    content.css({ "transform": "scale(0.95)", "opacity": "0" });

    setTimeout(() => {
        modal.addClass("hidden").removeClass("flex").css("opacity", "0");
    }, 300);
}

/**
 * Open permissions modal dengan animasi
 */
$(document).on("click", ".btn-permissions-user", async function () {
    const userId = $(this).data("user-id");
    const userName = $(this).data("user-name");

    $("#permissionsUserId").val(userId);
    $("#permissionsUserName").text(userName);

    const modal = $("#userPermissionsModal");
    const backdrop = $("#userPermissionsModalBackdrop");
    const content = $("#userPermissionsModalContent");

    // Show modal
    modal.removeClass("hidden").addClass("flex").css("opacity", "1");
    
    // Animate backdrop & content
    requestAnimationFrame(() => {
        backdrop.css("opacity", "1");
        content.css({ "transform": "scale(1)", "opacity": "1" });
    });

    // Load permissions
    await loadUserPermissions(userId);
});

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
 * Load user permissions (role + custom) dengan design modern
 */
async function loadUserPermissions(userId) {
    try {
        const response = await fetch(route("users.permissions", { user: userId }));
        const data = await response.json();

        const rolePermissions = data.rolePermissions || [];
        const customPermissions = data.customPermissions || [];
        const allPermissions = data.allPermissions || [];
        const categories = data.categories || [];

        // Render role permissions (read-only)
        let rolePermHtml = "";
        if (rolePermissions.length > 0) {
            rolePermissions.forEach((perm) => {
                rolePermHtml += `
                    <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 group role-permission-item">
                        <div class="w-5 h-5 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center flex-shrink-0">
                            <i class="mgc_check_line text-white text-xs"></i>
                        </div>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            ${perm.display_name || perm.name}
                        </span>
                        <span class="ml-auto text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                            from role
                        </span>
                    </div>
                `;
            });
        } else {
            rolePermHtml = `
                <div class="flex items-center justify-center py-8 text-center role-permission-item">
                    <div>
                        <i class="mgc_inbox_line text-3xl text-gray-400 dark:text-gray-600 mb-2 block"></i>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            User tidak memiliki role atau role tidak memiliki permissions
                        </p>
                    </div>
                </div>
            `;
        }
        $("#rolePermissionsContainer").html(rolePermHtml);

        // Render custom permissions (editable)
        let customPermHtml = "";
        const customIds = customPermissions.map((p) => p.id);

        if (categories.length === 0) {
            customPermHtml = `
                <div class="flex items-center justify-center py-8 text-center">
                    <div>
                        <i class="mgc_inbox_line text-3xl text-gray-400 dark:text-gray-600 mb-2 block"></i>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Tidak ada permissions yang tersedia
                        </p>
                    </div>
                </div>
            `;
        } else {
            categories.forEach((category) => {
                const categoryPerms = allPermissions.filter(
                    (p) => p.category === category
                );

                if (categoryPerms.length > 0) {
                    // Filter permissions yang tidak ada di role (editable)
                    const editablePermsInCategory = categoryPerms.filter((perm) => {
                        return !rolePermissions.some((rp) => rp.id === perm.id);
                    });

                    // Hanya render jika ada permission yang bisa diedit
                    if (editablePermsInCategory.length > 0) {
                        const categorySlug = (category || "Other").toLowerCase().replace(/\s+/g, '-');
                        
                        customPermHtml += `
                            <div class="space-y-2" data-category="${categorySlug}">
                                <div class="px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-600/50 sticky top-0 z-10">
                                    <label class="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-2 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                                        <input type="checkbox" 
                                            class="category-select-all w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                            data-category="${categorySlug}">
                                        <span class="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></span>
                                        ${category || "Other"}
                                    </label>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
                        `;

                        editablePermsInCategory.forEach((perm) => {
                            const isChecked = customIds.includes(perm.id);

                            customPermHtml += `
                                <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                                    <input type="checkbox" name="permissions[]" 
                                        value="${perm.id}" 
                                        class="permission-checkbox w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                        data-category="${categorySlug}"
                                        ${isChecked ? "checked" : ""}>
                                    <span class="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        ${perm.display_name || perm.name}
                                    </span>
                                </label>
                            `;
                        });

                        customPermHtml += `
                                </div>
                            </div>
                        `;
                    }
                }
            });

            // Check if there are any editable permissions
            const editablePerms = allPermissions.filter((p) => {
                return !rolePermissions.some((rp) => rp.id === p.id);
            });

            if (editablePerms.length === 0) {
                customPermHtml = `
                    <div class="flex items-center justify-center py-8 text-center">
                        <div>
                            <i class="mgc_checkbox_line text-3xl text-gray-400 dark:text-gray-600 mb-2 block"></i>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                Semua permissions sudah tercakup dari role
                            </p>
                        </div>
                    </div>
                `;
            }
        }

        $("#customPermissionsContainer").html(customPermHtml);
        
        // Initialize category checkbox states and event handlers
        initCategoryCheckboxes();
    } catch (error) {
        console.error("Error loading permissions:", error);
        const errorHtml = `
            <div class="flex items-center justify-center py-8">
                <div class="text-center">
                    <i class="mgc_alert_circle_line text-3xl text-red-500 dark:text-red-400 mb-2 block"></i>
                    <p class="text-sm text-red-600 dark:text-red-400 font-medium">
                        Gagal memuat permissions
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Silakan coba lagi
                    </p>
                </div>
            </div>
        `;
        $("#rolePermissionsContainer").html(errorHtml);
        $("#customPermissionsContainer").html(errorHtml);
    }
}

/**
 * Handle permissions form submission
 */
$("#form-user-permissions").on("submit", async function (e) {
    e.preventDefault();

    const userId = $("#permissionsUserId").val();
    const formData = new FormData(this);
    const submitBtn = $(this).find('button[type="submit"]');
    const originalBtnText = submitBtn.html();

    // Show loading state
    submitBtn.prop("disabled", true);
    submitBtn.html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');

    try {
        const response = await fetch(
            route("users.updatePermissions", { user: userId }),
            {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                body: formData,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Gagal mengupdate permissions");
        }

        showSuccess("Permissions berhasil diupdate", "Berhasil!").then(() => {
            closeUserPermissionsModal();
            location.reload();
        });
    } catch (error) {
        console.error("Error:", error);
        showError(error.message || "Terjadi kesalahan saat menyimpan permissions");
    } finally {
        submitBtn.prop("disabled", false);
        submitBtn.html(originalBtnText);
    }
});

/**
 * Permissions modal close buttons
 */
$("#userPermissionsModalClose, #userPermissionsModalCancel").on("click", function () {
    closeUserPermissionsModal();
});

/**
 * Toggle role permissions visibility
 */
$(document).on("click", "#toggleRolePermissions", function () {
    const wrapper = $("#rolePermissionsWrapper");
    const icon = $("#toggleRoleIcon");
    const text = $("#toggleRoleText");
    const isMinimized = wrapper.hasClass("minimized");

    if (isMinimized) {
        // Expand
        wrapper.removeClass("minimized").css("max-height", "288px");
        icon.removeClass("mgc_maximize_line").addClass("mgc_minimize_line");
        text.text("Minimize");
    } else {
        // Minimize
        wrapper.addClass("minimized").css("max-height", "0");
        icon.removeClass("mgc_minimize_line").addClass("mgc_maximize_line");
        text.text("Expand");
    }
});

/**
 * Refresh table data
 */
function refreshTable() {
    const grid = $("#table-users").data('grid');
    if (!grid) return;

    showToast('Memuat data...', 'info', 1000);

    $.ajax({
        url: route("users.data"),
        method: "GET",
        success: function (data) {
            const gridData = data.map((item) => [
                item.number,
                item.name,
                item.email,
                item.role,
                item.verify,
                item.status,
                item.actions,
            ]);

            grid.updateConfig({
                data: gridData,
            }).forceRender();

            setTimeout(() => {
                initActionTooltips();
            }, 300);

            showToast('Data berhasil direfresh', 'success', 1500);
        },
        error: function (xhr) {
            console.error("Error loading data:", xhr);
            showToast('Gagal memuat data', 'error', 2000);
        },
    });
}

/**
 * Refresh button
 */
$("#btn-refresh").off("click").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    refreshTable();
});

// Initialize
$(document).ready(function () {
    initUsersTable();
});

