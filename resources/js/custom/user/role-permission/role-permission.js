/**
 * Modul role-permission - Table & Management
 * Mengelola tabel role-permission dan assign permissions
 *
 * @module modules/role-permission/role-permission
 */

import { initGridTable, setEditButton } from "../../../core/data-table.js";
import { h } from "gridjs";
import $ from "jquery";
import Swal from "sweetalert2";
import { route } from "ziggy-js";

/**
 * Inisialisasi tabel role-permission
 */
function initRolePermissionTable() {
    if (!$("#table-role-permission").length) return;

    const columns = [
        {
            id: "number",
            name: "#",
            width: "60px",
        },
        {
            id: "name",
            name: "Role Name",
            width: "250px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "users_count",
            name: "Users",
            width: "150px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "permissions_count",
            name: "Permissions",
            width: "180px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
        {
            id: "actions",
            name: "Actions",
            width: "200px",
            formatter: (cell) => h("div", { innerHTML: cell }),
        },
    ];

    const buttonConfig = [
        { selector: ".btn-delete", when: "any" },
    ];

    initGridTable({
        tableId: "#table-role-permission",
        dataUrl: route("role-permission.data"),
        columns: columns,
        buttonConfig: buttonConfig,
        limit: 10,
        enableFilter: false,
    });
}

/**
 * Handle add role button click
 */
$(document).on("click", "#btn-add-role", function() {
    const modal = document.getElementById("addRoleModal");
    if (modal) {
        // Reset form
        $("#form-add-role")[0].reset();
        $("#error-name").text("");
        
        // Show modal
        modal.classList.remove("hidden");
        modal.style.display = "block";
        
        // Trigger animation
        setTimeout(() => {
            modal.querySelector(".inline-block").classList.add("scale-100", "opacity-100");
            modal.querySelector(".inline-block").classList.remove("scale-95", "opacity-0");
        }, 10);
        
        // Update select all checkbox states
        updateSelectAllState();
    }
});

/**
 * Handle manage permissions button
 */
$(document).on("click", ".btn-manage-permissions", function() {
    const roleId = $(this).data("role-id");
    const roleName = $(this).data("role-name");
    
    $("#modal-role-name").text(roleName);
    $("#manage-role-id").val(roleId);
    
    // Load permissions for this role
    loadRolePermissions(roleId);
    
    // Show modal
    const modal = document.getElementById("managePermissionsModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.style.display = "block";
        
        // Trigger animation
        setTimeout(() => {
            modal.querySelector(".inline-block").classList.add("scale-100", "opacity-100");
            modal.querySelector(".inline-block").classList.remove("scale-95", "opacity-0");
        }, 10);
    }
});

/**
 * Load role permissions via AJAX
 */
function loadRolePermissions(roleId) {
    const container = $("#permissions-container");
    container.html('<div class="text-center py-8"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div><p class="mt-2 text-sm text-gray-600">Loading permissions...</p></div>');
    
    $.ajax({
        url: route("role-permission.getPermissions", roleId),
        type: "GET",
        success: function(response) {
            if (response.success) {
                // Prefer hierarchical if available
                if (response.permissionsHierarchy) {
                    renderPermissionsHierarchy(response.permissionsHierarchy, response.rolePermissions);
                } else {
                    renderPermissionsFlat(response.permissionsByCategory, response.rolePermissions);
                }
            }
        },
        error: function() {
            container.html('<div class="text-center py-8 text-red-600"><i class="mgc_close_circle_line text-4xl"></i><p class="mt-2">Gagal memuat permissions</p></div>');
        }
    });
}

/**
 * Render permissions grouped by category
 */
function renderPermissionsFlat(permissionsByCategory, rolePermissions) {
    const container = $("#permissions-container");
    let html = '';
    Object.keys(permissionsByCategory).forEach(category => {
        const permissions = permissionsByCategory[category];
        html += `<div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="category-header p-3 flex items-center justify-between">
                <h5 class="text-sm font-semibold text-white flex items-center gap-2">
                    <i class="mgc_folder_line"></i>${category}
                </h5>
                <label class="inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="select-all-category form-checkbox rounded text-purple-700 border-purple/30 bg-white/20" data-category="${category}">
                    <span class="ml-2 text-xs text-white">Pilih Semua</span>
                </label>
            </div>
            <div class="p-4 bg-white dark:bg-gray-800">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">`;
        permissions.forEach(permission => {
            const isChecked = rolePermissions.includes(permission.id) ? 'checked' : '';
            html += `<label class="inline-flex items-start hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors cursor-pointer">
                <input type="checkbox" name="permissions[]" value="${permission.id}" class="permission-checkbox form-checkbox rounded text-primary mt-0.5" data-category="${category}" ${isChecked}>
                <span class="ml-2 flex-1">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 block">${permission.display_name}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">${permission.description || ''}</span>
                </span>
            </label>`;
        });
        html += `</div></div></div>`;
    });
    container.html(html);
    updateSelectAllState();
}

function renderPermissionsHierarchy(permissionsHierarchy, rolePermissions) {
    const container = $("#permissions-container");
    let html = '';
    Object.keys(permissionsHierarchy).forEach(category => {
        const data = permissionsHierarchy[category];
        html += `<div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="category-header p-3 flex items-center justify-between">
                <h5 class="text-sm font-semibold text-white flex items-center gap-2"><i class="mgc_folder_line"></i>${category}</h5>
                <label class="inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="select-all-category form-checkbox rounded text-purple-700 border-purple/30 bg-white/20" data-category="${category}">
                    <span class="ml-2 text-xs text-white">Pilih Semua</span>
                </label>
            </div>
            <div class="p-4 bg-white dark:bg-gray-800 space-y-5">`;
        if (data.use_groups) {
            Object.keys(data.groups).forEach(groupName => {
                const groupPermissions = data.groups[groupName];
                html += `<div class="border border-gray-100 dark:border-gray-700 rounded-md">
                    <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-2"><i class="mgc_archive_line text-primary"></i><span class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">${groupName}</span></div>
                        <label class="inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="select-all-subgroup form-checkbox rounded text-primary border-primary/30" data-category="${category}" data-group="${groupName}">
                            <span class="ml-2 text-[10px] text-gray-500 dark:text-gray-400">Semua ${groupName}</span>
                        </label>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">`;
                groupPermissions.forEach(permission => {
                    const isChecked = rolePermissions.includes(permission.id) ? 'checked' : '';
                    html += `<label class="inline-flex items-start hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors cursor-pointer">
                        <input type="checkbox" name="permissions[]" value="${permission.id}" class="permission-checkbox form-checkbox rounded text-primary mt-0.5" data-category="${category}" data-group="${groupName}" ${isChecked}>
                        <span class="ml-2 flex-1">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 block">${permission.display_name}</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">${permission.description || ''}</span>
                        </span>
                    </label>`;
                });
                html += `</div></div>`;
            });
        } else {
            // single group fallback
            Object.keys(data.groups).forEach(groupName => {
                data.groups[groupName].forEach(permission => {
                    const isChecked = rolePermissions.includes(permission.id) ? 'checked' : '';
                    html += `<label class="inline-flex items-start hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors cursor-pointer">
                        <input type="checkbox" name="permissions[]" value="${permission.id}" class="permission-checkbox form-checkbox rounded text-primary mt-0.5" data-category="${category}" data-group="${groupName}" ${isChecked}>
                        <span class="ml-2 flex-1">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 block">${permission.display_name}</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">${permission.description || ''}</span>
                        </span>
                    </label>`;
                });
            });
        }
        html += `</div></div>`;
    });
    container.html(html);
    updateSelectAllState();
}

/**
 * Update select all checkbox state based on category checkboxes
 */
function updateSelectAllState() {
    $(".select-all-category").each(function() {
        const category = $(this).data("category");
        const modal = $(this).closest('.fc-modal');
        const categoryCheckboxes = modal.length 
            ? modal.find(`.permission-checkbox[data-category="${category}"]`)
            : $(`.permission-checkbox[data-category="${category}"]`);
        
        const checkedCount = categoryCheckboxes.filter(":checked").length;
        const totalCount = categoryCheckboxes.length;
        
        if (totalCount > 0) {
            $(this).prop("checked", checkedCount === totalCount);
            $(this).prop("indeterminate", checkedCount > 0 && checkedCount < totalCount);
        }
    });
}

/**
 * Handle select all category
 */
$(document).on("change", ".select-all-category", function() {
    const category = $(this).data("category");
    const isChecked = $(this).is(":checked");
    const modal = $(this).closest('.fc-modal');
    
    // Find checkboxes within the same modal
    const categoryCheckboxes = modal.length
        ? modal.find(`.permission-checkbox[data-category="${category}"]`)
        : $(`.permission-checkbox[data-category="${category}"]`);
    
    categoryCheckboxes.prop("checked", isChecked);
});

// Select all subgroup handler
$(document).on("change", ".select-all-subgroup", function() {
    const category = $(this).data("category");
    const group = $(this).data("group");
    const isChecked = $(this).is(":checked");
    const modal = $(this).closest('.fc-modal');
    const groupCheckboxes = modal.length
        ? modal.find(`.permission-checkbox[data-category="${category}"][data-group="${group}"]`)
        : $(`.permission-checkbox[data-category="${category}"][data-group="${group}"]`);
    groupCheckboxes.prop("checked", isChecked);
    updateSelectAllState();
});

/**
 * Handle individual permission checkbox change
 */
$(document).on("change", ".permission-checkbox", function() {
    updateSelectAllState();
});

/**
 * Handle add role form submission
 */
$("#form-add-role").on("submit", function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const submitBtn = $(this).find('button[type="submit"]');
    
    // Clear previous errors
    $("#error-name").text("");
    
    // Disable button
    submitBtn.prop("disabled", true);
    submitBtn.find("i").removeClass("mgc_check_line").addClass("mgc_loader_2_line animate-spin");
    
    $.ajax({
        url: route("role-permission.store"),
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            Swal.fire({
                icon: "success",
                title: "Berhasil!",
                text: response.message || "Role berhasil ditambahkan.",
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                location.reload();
            });
        },
        error: function(xhr) {
            if (xhr.status === 422) {
                const errors = xhr.responseJSON.errors;
                if (errors.name) {
                    $("#error-name").text(errors.name[0]);
                }
            }
            
            Swal.fire({
                icon: "error",
                title: "Gagal!",
                text: xhr.responseJSON?.message || "Gagal menambahkan role.",
            });
            
            submitBtn.prop("disabled", false);
            submitBtn.find("i").removeClass("mgc_loader_2_line animate-spin").addClass("mgc_check_line");
        }
    });
});

/**
 * Handle manage permissions form submission
 */
$("#form-manage-permissions").on("submit", function(e) {
    e.preventDefault();
    
    const roleId = $("#manage-role-id").val();
    const formData = new FormData(this);
    const submitBtn = $(this).find('button[type="submit"]');
    
    // Disable button
    submitBtn.prop("disabled", true);
    submitBtn.find("i").removeClass("mgc_check_line").addClass("mgc_loader_2_line animate-spin");
    
    $.ajax({
        url: route("role-permission.assignPermissions", roleId),
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            Swal.fire({
                icon: "success",
                title: "Berhasil!",
                text: response.message || "Permissions berhasil diperbarui.",
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                location.reload();
            });
        },
        error: function(xhr) {
            Swal.fire({
                icon: "error",
                title: "Gagal!",
                text: xhr.responseJSON?.message || "Gagal memperbarui permissions.",
            });
            
            submitBtn.prop("disabled", false);
            submitBtn.find("i").removeClass("mgc_loader_2_line animate-spin").addClass("mgc_check_line");
        }
    });
});

/**
 * Handle delete role
 */
$("#btn-delete-role").on("click", function() {
    const checkedBoxes = $("#table-role-permission input[type='checkbox']:checked");
    const ids = [];
    
    checkedBoxes.each(function() {
        const value = $(this).val();
        if (value) ids.push(value);
    });
    
    if (ids.length === 0) {
        Swal.fire({
            icon: "warning",
            title: "Peringatan",
            text: "Tidak ada role yang dipilih.",
        });
        return;
    }
    
    const btn = $(this);
    btn.prop("disabled", true);
    btn.html('<span class="loader w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> Menghapus...');
    
    $.ajax({
        url: route("role-permission.bulkDestroy"),
        type: "POST",
        data: {
            _token: $('meta[name="csrf-token"]').attr("content"),
            ids: ids
        },
        success: function(response) {
            Swal.fire({
                icon: "success",
                title: "Berhasil!",
                text: response.message || "Role berhasil dihapus.",
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                location.reload();
            });
        },
        error: function(xhr) {
            Swal.fire({
                icon: "error",
                title: "Gagal!",
                text: xhr.responseJSON?.message || "Gagal menghapus role.",
            });
            
            btn.prop("disabled", false);
            btn.html('<i class="mgc_delete_2_line me-2"></i> Hapus');
        }
    });
});

/**
 * Refresh button handler
 */
$("#btn-refresh").on("click", function() {
    const btn = $(this);
    const icon = btn.find("i");
    
    btn.prop("disabled", true);
    icon.addClass("animate-spin");
    
    setTimeout(() => {
        location.reload();
    }, 500);
});

/**
 * Handle modal close buttons
 */
$(document).on("click", "[data-fc-dismiss]", function() {
    const modal = $(this).closest(".fc-modal");
    if (modal.length) {
        // Trigger fade out animation
        const modalContent = modal.find(".inline-block");
        if (modalContent.length) {
            modalContent.addClass("scale-95 opacity-0");
            modalContent.removeClass("scale-100 opacity-100");
        }
        
        setTimeout(() => {
            modal.addClass("hidden");
            modal.css("display", "none");
        }, 200);
    }
});

/**
 * Close modal when clicking outside (on overlay)
 */
$(document).on("click", ".fc-modal", function(e) {
    if ($(e.target).hasClass("fc-modal") || $(e.target).hasClass("bg-gray-500")) {
        const modal = $(this);
        const modalContent = modal.find(".inline-block");
        
        if (modalContent.length) {
            modalContent.addClass("scale-95 opacity-0");
            modalContent.removeClass("scale-100 opacity-100");
        }
        
        setTimeout(() => {
            modal.addClass("hidden");
            modal.css("display", "none");
        }, 200);
    }
});

// Initialize on document ready
$(document).ready(function() {
    initRolePermissionTable();
});
