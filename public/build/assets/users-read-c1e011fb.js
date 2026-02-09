import{i as T}from"./data-table-e496d1b5.js";import{b as h}from"./gridjs.module-3ea5c5ab.js";import{$ as e}from"./modal-handler-2823516c.js";import{s as v}from"./index-88056f3d.js";import{t as E}from"./tippy.all-093076db.js";import{b as S,a as H,s as w}from"./notification-d92c8c7c.js";import"./parse-c3570fb2.js";import"./glightbox.min-3fffbd26.js";import"./_commonjsHelpers-725317a4.js";import"./notification-5f085df9.js";let C=[];function z(){if(!e("#table-users").length)return;const t=[{id:"number",name:"#",width:"60px"},{id:"name",name:"Name",width:"200px",formatter:s=>h("div",{innerHTML:s})},{id:"email",name:"Email",width:"250px",formatter:s=>h("div",{innerHTML:s})},{id:"role",name:"Role",width:"150px",formatter:s=>h("div",{innerHTML:s})},{id:"verify",name:"Verify",width:"120px",formatter:s=>h("div",{innerHTML:s})},{id:"status",name:"Status",width:"120px",formatter:s=>h("div",{innerHTML:s})},{id:"actions",name:"Actions",width:"180px",formatter:s=>h("div",{innerHTML:s})}];T({tableId:"#table-users",dataUrl:v("users.data"),columns:t,enableCheckbox:!1,limit:10,enableFilter:!1,onDataLoaded:()=>{_()}})}function _(){C.forEach(s=>s.destroy()),C=[];const t=document.querySelectorAll('#table-users [data-plugin="tippy"]');t.length&&(C=E(t))}function M(){const t=e("#userPermissionsModal"),s=e("#userPermissionsModalBackdrop"),r=e("#userPermissionsModalContent");s.css("opacity","0"),r.css({transform:"scale(0.95)",opacity:"0"}),setTimeout(()=>{t.addClass("hidden").removeClass("flex").css("opacity","0")},300)}e(document).on("click",".btn-permissions-user",async function(){const t=e(this).data("user-id"),s=e(this).data("user-name");e("#permissionsUserId").val(t),e("#permissionsUserName").text(s);const r=e("#userPermissionsModal"),a=e("#userPermissionsModalBackdrop"),d=e("#userPermissionsModalContent");r.removeClass("hidden").addClass("flex").css("opacity","1"),requestAnimationFrame(()=>{a.css("opacity","1"),d.css({transform:"scale(1)",opacity:"1"})}),await U(t)});async function U(t){try{const r=await(await fetch(v("users.permissionsStructured",{user:t}))).json(),a=r.rolePermissions||[],d=r.customPermissions||[],l=r.structured||[],f=d.map(i=>i.id);let b="";l.forEach(i=>{let m=!1,u="";if(i.submenus&&i.submenus.length>0)i.submenus.forEach(c=>{const o=c.permissions.filter(n=>a.some(p=>p.id===n.id));o.length>0&&(m=!0,u+=`
                            <div class="ml-4 space-y-1">
                                <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    ${c.submenu}
                                </p>
                        `,o.forEach(n=>{u+=`
                                <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
                                    <div class="w-4 h-4 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center flex-shrink-0">
                                        <i class="mgc_check_line text-white text-xs"></i>
                                    </div>
                                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        ${k(n.name)} ${n.display_name||n.name}
                                    </span>
                                </div>
                            `}),u+="</div>")});else if(i.permissions&&i.permissions.length>0){const c=i.permissions.filter(o=>a.some(n=>n.id===o.id));c.length>0&&(m=!0,c.forEach(o=>{u+=`
                            <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
                                <div class="w-4 h-4 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center flex-shrink-0">
                                    <i class="mgc_check_line text-white text-xs"></i>
                                </div>
                                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    ${k(o.name)} ${o.display_name||o.name}
                                </span>
                            </div>
                        `}))}m&&(b+=`
                    <div class="mb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="${i.icon} text-blue-600 dark:text-blue-400"></i>
                            <h5 class="text-sm font-bold text-gray-800 dark:text-gray-100">${i.menu}</h5>
                        </div>
                        ${u}
                    </div>
                `)}),b===""&&(b=`
                <div class="flex items-center justify-center py-6 text-center">
                    <div>
                        <i class="mgc_inbox_line text-2xl text-gray-400 dark:text-gray-600 mb-2 block"></i>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            User tidak memiliki role atau role tidak memiliki permissions
                        </p>
                    </div>
                </div>
            `),e("#rolePermissionsContainer").html(b);let x="";l.forEach(i=>{const m=(i.menu||"Other").toLowerCase().replace(/\s+/g,"-");let u=!1,c="";if(i.submenus&&i.submenus.length>0)i.submenus.forEach(o=>{const n=(o.submenu||"Other").toLowerCase().replace(/\s+/g,"-"),p=o.permissions.filter(g=>!a.some($=>$.id===g.id));p.length>0&&(u=!0,c+=`
                            <div class="ml-4 pl-3 border-l-2 border-purple-300 dark:border-purple-700 space-y-2" data-submenu="${n}">
                                <div class="px-3 py-2 rounded-lg bg-purple-50 dark:bg-slate-700/40">
                                    <label class="font-medium text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2 cursor-pointer hover:text-purple-900 dark:hover:text-purple-100 transition-colors">
                                        <input type="checkbox" 
                                            class="submenu-select-all w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                            data-menu="${m}"
                                            data-submenu="${n}">
                                        <span class="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                                        ${o.submenu}
                                    </label>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                        `,p.forEach(g=>{const $=f.includes(g.id)?"checked":"";c+=`
                                <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-purple-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                                    <input type="checkbox" name="permissions[]" 
                                        value="${g.id}" 
                                        class="permission-checkbox w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                        data-menu="${m}"
                                        data-submenu="${n}"
                                        ${$}>
                                    <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        <strong>${k(g.name)}</strong>
                                    </span>
                                </label>
                            `}),c+=`
                                </div>
                            </div>
                        `)});else if(i.permissions&&i.permissions.length>0){const o=i.permissions.filter(n=>!a.some(p=>p.id===n.id));o.length>0&&(u=!0,c+='<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">',o.forEach(n=>{const p=f.includes(n.id)?"checked":"";c+=`
                            <label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-purple-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
                                <input type="checkbox" name="permissions[]" 
                                    value="${n.id}" 
                                    class="permission-checkbox w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                                    data-menu="${m}"
                                    ${p}>
                                <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                    <strong>${k(n.name)}</strong>
                                </span>
                            </label>
                        `}),c+="</div>")}u&&(x+=`
                    <div class="space-y-3" data-menu="${m}">
                        <div class="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 sticky top-0 z-10">
                            <div class="flex items-center gap-3">
                                <i class="${i.icon} text-lg text-purple-600 dark:text-purple-400"></i>
                                <label class="font-semibold text-sm text-purple-900 dark:text-purple-100 flex-1 cursor-pointer">
                                    <input type="checkbox" 
                                        class="menu-select-all w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer mr-2"
                                        data-menu="${m}">
                                    <span>${i.menu}</span>
                                </label>
                            </div>
                        </div>
                        ${c}
                    </div>
                `)}),x===""&&(x=`
                <div class="flex items-center justify-center py-6 text-center">
                    <div>
                        <i class="mgc_checkbox_line text-2xl text-gray-400 dark:text-gray-600 mb-2 block"></i>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Semua permissions sudah tercakup dari role
                        </p>
                    </div>
                </div>
            `),e("#customPermissionsContainer").html(x),j()}catch(s){console.error("Error loading permissions:",s);const r=`
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
        `;e("#rolePermissionsContainer").html(r),e("#customPermissionsContainer").html(r)}}function k(t){const s={".view":"👁️",".create":"➕",".edit":"✏️",".delete":"🗑️",".approve":"✅",".export":"📤"};for(const[r,a]of Object.entries(s))if(t.includes(r))return a;return"🔐"}function j(){e(".menu-select-all").each(function(){y(e(this).data("menu"))}),e(".submenu-select-all").each(function(){P(e(this).data("menu"),e(this).data("submenu"))}),e(document).off("change",".menu-select-all").on("change",".menu-select-all",function(){const t=e(this).data("menu"),s=e(this).prop("checked");e(`.permission-checkbox[data-menu="${t}"]`).prop("checked",s),e(`.submenu-select-all[data-menu="${t}"]`).each(function(){e(this).prop("checked",s).prop("indeterminate",!1)}),y(t)}),e(document).off("change",".submenu-select-all").on("change",".submenu-select-all",function(){const t=e(this).data("menu"),s=e(this).data("submenu"),r=e(this).prop("checked");e(`.permission-checkbox[data-menu="${t}"][data-submenu="${s}"]`).prop("checked",r),y(t)}),e(document).off("change",".permission-checkbox").on("change",".permission-checkbox",function(){const t=e(this).data("menu"),s=e(this).data("submenu");s&&P(t,s),y(t)})}function y(t){const s=e(`.menu-select-all[data-menu="${t}"]`),r=e(`.permission-checkbox[data-menu="${t}"]`),a=r.length,d=r.filter(":checked").length;d===0?(s.prop("checked",!1),s.prop("indeterminate",!1)):d===a?(s.prop("checked",!0),s.prop("indeterminate",!1)):(s.prop("checked",!1),s.prop("indeterminate",!0))}function P(t,s){const r=e(`.submenu-select-all[data-menu="${t}"][data-submenu="${s}"]`),a=e(`.permission-checkbox[data-menu="${t}"][data-submenu="${s}"]`),d=a.length,l=a.filter(":checked").length;l===0?(r.prop("checked",!1),r.prop("indeterminate",!1)):l===d?(r.prop("checked",!0),r.prop("indeterminate",!1)):(r.prop("checked",!1),r.prop("indeterminate",!0))}e("#form-user-permissions").on("submit",async function(t){t.preventDefault();const s=e("#permissionsUserId").val(),r=new FormData(this),a=e(this).find('button[type="submit"]'),d=a.html();a.prop("disabled",!0),a.html('<i class="mgc_loading_line animate-spin mr-2"></i>Menyimpan...');try{const l=await fetch(v("users.updatePermissions",{user:s}),{method:"POST",headers:{"X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').getAttribute("content")},body:r}),f=await l.json();if(!l.ok)throw new Error(f.message||"Gagal mengupdate permissions");S("Permissions berhasil diupdate","Berhasil!").then(()=>{M(),location.reload()})}catch(l){console.error("Error:",l),H(l.message||"Terjadi kesalahan saat menyimpan permissions")}finally{a.prop("disabled",!1),a.html(d)}});e("#userPermissionsModalClose, #userPermissionsModalCancel").on("click",function(){M()});e(document).on("click","#toggleRolePermissions",function(){const t=e("#rolePermissionsWrapper"),s=e("#toggleRoleIcon"),r=e("#toggleRoleText");t.hasClass("minimized")?(t.removeClass("minimized").css("max-height","288px"),s.removeClass("mgc_maximize_line").addClass("mgc_minimize_line"),r.text("Minimize")):(t.addClass("minimized").css("max-height","0"),s.removeClass("mgc_minimize_line").addClass("mgc_maximize_line"),r.text("Expand"))});function L(){const t=e("#table-users").data("grid");t&&(w("Memuat data...","info",1e3),e.ajax({url:v("users.data"),method:"GET",success:function(s){const r=s.map(a=>[a.number,a.name,a.email,a.role,a.verify,a.status,a.actions]);t.updateConfig({data:r}).forceRender(),setTimeout(()=>{_()},300),w("Data berhasil direfresh","success",1500)},error:function(s){console.error("Error loading data:",s),w("Gagal memuat data","error",2e3)}}))}e("#btn-refresh").off("click").on("click",function(t){t.preventDefault(),t.stopPropagation(),L()});e(document).ready(function(){z()});
