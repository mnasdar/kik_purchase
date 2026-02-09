import{$ as e}from"./modal-handler-2823516c.js";import{a as u,b as s}from"./gridjs.module-3ea5c5ab.js";import{s as i}from"./index-88056f3d.js";import{t as g}from"./tippy.all-093076db.js";import{s as n,a as x}from"./notification-d92c8c7c.js";import"./_commonjsHelpers-725317a4.js";import"./parse-c3570fb2.js";import"./notification-5f085df9.js";let p=null,d={};function y(){return[{id:"checkbox",name:s("div",{innerHTML:'<input type="checkbox" id="headerCheck" class="form-checkbox rounded text-primary">'}),width:"43px",sort:!1,formatter:t=>s("div",{innerHTML:t})},{id:"number",name:"#",width:"50px"},{id:"po_number",name:"PO Number",width:"130px",formatter:t=>s("div",{innerHTML:t})},{id:"item_name",name:"Item Description",width:"180px",formatter:t=>s("div",{innerHTML:t})},{id:"quantity",name:"Qty",width:"60px",formatter:t=>s("div",{innerHTML:t})},{id:"po_unit_price",name:"Unit Price",width:"100px",formatter:t=>s("div",{innerHTML:t})},{id:"po_amount",name:"Amount",width:"110px",formatter:t=>s("div",{innerHTML:t})},{id:"po_date",name:"PO Date",width:"90px",formatter:t=>s("div",{innerHTML:t})},{id:"onsite_date",name:"Onsite",width:"90px",formatter:t=>s("div",{innerHTML:t})},{id:"sla_target",name:s("div",{className:"whitespace-normal",innerHTML:"SLA Target"}),width:"70px",formatter:t=>s("div",{innerHTML:t})},{id:"sla_realization",name:s("div",{className:"whitespace-normal",innerHTML:"SLA Real"}),width:"70px",formatter:t=>s("div",{innerHTML:t})},{id:"percent_sla",name:"%",width:"55px",formatter:t=>s("div",{innerHTML:t})},{id:"status",name:"Status",width:"120px",formatter:t=>s("div",{innerHTML:t})},{id:"created_by",name:"Created By",width:"90px",formatter:t=>s("div",{innerHTML:t})}]}function b(t=!1){e.ajax({url:i("po-onsite.data"),method:"GET",data:d,beforeSend:function(){t&&n("Memuat data...","info",1e3)},success:function(a){const o=a.map(r=>[`<input type="checkbox" class="form-checkbox rounded text-primary" value="${r.id}">`,r.number,`<button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 hover:shadow-md transition-all duration-200 po-number-click" data-onsite-id="${r.id}"><span>${r.po_number}</span></button>`,r.item_desc,r.quantity,r.po_unit_price,r.po_amount,r.po_date,r.onsite_date,r.sla_target,r.sla_realization,r.percent_sla,r.status,r.created_by]);p?p.updateConfig({data:o}).forceRender():p=new u({columns:y(),data:o,sort:!0,pagination:{enabled:!0,limit:10},search:!0,className:{table:"table-auto w-full",thead:"bg-slate-100 dark:bg-slate-800",th:"px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300",td:"px-4 py-3 text-sm text-slate-900 dark:text-slate-100"}}).render(document.getElementById("table-onsite")),e("#data-count").text(a.length),setTimeout(()=>{g("[data-tippy-content]",{arrow:!0,placement:"top"}),v()},100),t&&n("Data berhasil dimuat!","success",1500)},error:function(){x("Gagal memuat data onsite","Error!")}})}function v(){e(document).off("change","#headerCheck").on("change","#headerCheck",function(){const t=e(this).is(":checked");e(".form-checkbox").not(this).prop("checked",t),f()}),e(document).off("change",".form-checkbox").on("change",".form-checkbox",function(){const t=e(".form-checkbox").not("#headerCheck").length===e(".form-checkbox:checked").not("#headerCheck").length;e("#headerCheck").prop("checked",t),f()})}function f(){const t=e(".form-checkbox:checked").not("#headerCheck").length,a=e("#btn-delete-selected"),o=e("#btn-edit-selected");t>0?(a.removeClass("hidden"),o.removeClass("hidden"),e("#delete-count").text(t),e("#edit-count").text(t)):(a.addClass("hidden"),o.addClass("hidden"))}function _(){e("#table-onsite").length&&b(!1)}function w(){e(document).off("click","#btn-refresh").on("click","#btn-refresh",function(){b(!0)})}function M(){e(document).off("click",".btn-edit-onsite").on("click",".btn-edit-onsite",function(){const t=e(this).data("id");window.location.href=i("po-onsite.edit",{po_onsite:t})})}function C(){e(document).off("click","#btn-edit-selected").on("click","#btn-edit-selected",function(){const t=e(".form-checkbox:checked").not("#headerCheck").map(function(){return e(this).val()}).get();if(t.length===0){n("Pilih minimal 1 item untuk diedit","warning",2e3);return}const a=t.join(",");window.location.href=i("po-onsite.bulk-edit",{ids:a})})}function O(){e(document).on("click","#detailOnsiteModalClose, #detailOnsiteModalBackdrop",function(){m()}),e(document).on("keydown",function(t){t.key==="Escape"&&!e("#detailOnsiteModal").hasClass("hidden")&&m()}),e(document).on("click",".po-number-click",function(t){t.preventDefault();const a=e(this).data("onsite-id");a&&T(a)})}function T(t){const a=e("#detailOnsiteModal"),o=e("#detailOnsiteModalBackdrop"),r=e("#detailOnsiteModalContent");a.removeClass("hidden"),a.css("opacity","1"),setTimeout(()=>{o.css("opacity","1"),r.css({transform:"scale(1)",opacity:"1"})},10),e.ajax({url:i("po-onsite.show",{po_onsite:t}),method:"GET",success:function(h){$(h)},error:function(){x("Gagal memuat detail onsite","Error!"),m()}})}function m(){const t=e("#detailOnsiteModalBackdrop"),a=e("#detailOnsiteModalContent"),o=e("#detailOnsiteModal");t.css("opacity","0"),a.css({transform:"scale(0.95)",opacity:"0"}),setTimeout(()=>{o.addClass("hidden").css("opacity","0")},300)}function $(t){const a=`
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <tbody>
                    <!-- PR Section -->
                    <tr class="bg-blue-50/30 dark:bg-blue-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">📋 PURCHASE REQUEST</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Request Type</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.pr_request_type}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">PR Number</td>
                        <td class="px-4 py-2.5 text-green-700 dark:text-white font-semibold">${t.pr_number}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Location</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.pr_location}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Classification</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.classification}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Approved Date</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.pr_approved_date}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Item Description</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.item_name}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">UOM</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.unit}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Quantity</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.pr_quantity}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Unit Price</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.pr_unit_price}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Amount</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.pr_amount}</td>
                    </tr>

                    <!-- PO Section -->
                    <tr class="bg-amber-50/30 dark:bg-amber-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-amber-700 dark:text-amber-300">🛒 PURCHASE ORDER</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">PO Number</td>
                        <td class="px-4 py-2.5 text-primary dark:text-primary-400 font-bold">${t.po_number}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Supplier</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.supplier_name}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">PO Approved Date</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.po_approved_date}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Quantity</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.po_quantity}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Unit Price</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.po_unit_price}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Amount</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.po_amount}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Cost Saving</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.cost_saving}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Cost Saving %</td>
                        <td class="px-4 py-2.5 text-green-700 dark:text-green-400 font-bold">${t.cost_saving_percentage}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">SLA PR→PO Target</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.sla_pr_to_po_target}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">SLA PR→PO Realisasi</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.sla_pr_to_po_realization}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">SLA PR→PO %</td>
                        <td class="px-4 py-2.5 ${t.sla_pr_to_po_percentage==="100%"?"text-green-700 dark:text-green-400":"text-red-700 dark:text-red-400"} font-bold">${t.sla_pr_to_po_percentage}</td>
                    </tr>

                    <!-- Onsite Section -->
                    <tr class="bg-red-50/30 dark:bg-red-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-red-700 dark:text-red-300">📍 ONSITE TRACKING</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Onsite Date</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.onsite_date}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">SLA PO→Onsite Target</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.sla_po_to_onsite_target}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">SLA PO→Onsite Realisasi</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.sla_po_to_onsite_realization}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">SLA PO→Onsite %</td>
                        <td class="px-4 py-2.5 ${t.sla_po_to_onsite_percentage==="100%"?"text-green-700 dark:text-green-400":"text-red-700 dark:text-red-400"} font-bold">${t.sla_po_to_onsite_percentage}</td>
                    </tr>

                    <!-- Other Section -->
                    <tr class="bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-slate-700 dark:text-slate-300">ℹ️ Other</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Created By</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.created_by}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">Created At</td>
                        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${t.created_at}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;e("#detailOnsiteContent").html(a)}function L(){e(document).off("click","#btn-toggle-filter").on("click","#btn-toggle-filter",function(){e("#filter-section").toggleClass("hidden")}),e(document).off("click","#btn-apply-filter").on("click","#btn-apply-filter",function(){d={po_number:e("#filter-po-number").val(),pr_number:e("#filter-pr-number").val(),item_desc:e("#filter-item-desc").val(),location_id:e("#filter-location").val(),classification_id:e("#filter-classification").val(),current_stage:e("#filter-stage").val(),date_from:e("#filter-date-from").val(),date_to:e("#filter-date-to").val()},Object.keys(d).forEach(t=>{d[t]||delete d[t]}),b(!0)}),e(document).off("click","#btn-clear-filter").on("click","#btn-clear-filter",function(){e("#filter-po-number").val(""),e("#filter-pr-number").val(""),e("#filter-item-desc").val(""),e("#filter-location").val(""),e("#filter-classification").val(""),e("#filter-stage").val(""),e("#filter-date-from").val(""),e("#filter-date-to").val(""),d={},b(!0)})}let l=[];function k(t){const a=e("#deleteModal"),o=e("#deleteModalBackdrop"),r=e("#deleteModalContent");e("#deleteMessage").text(t||"Apakah Anda yakin ingin menghapus data ini?"),a.removeClass("hidden").css("opacity","1"),requestAnimationFrame(()=>{o.css("opacity","1"),r.css({transform:"scale(1)",opacity:"1"})})}function c(){const t=e("#deleteModalBackdrop"),a=e("#deleteModalContent");t.css("opacity","0"),a.css({transform:"scale(0.95)",opacity:"0"}),setTimeout(()=>{e("#deleteModal").addClass("hidden").css("opacity","0"),l=[]},300)}function P(){e(document).off("click",".btn-delete-onsite").on("click",".btn-delete-onsite",function(){const t=e(this).data("id"),a=e(this).data("po-number");l=[t],k(`Apakah Anda yakin ingin menghapus onsite untuk PO "${a}"?`)}),e(document).off("click","#btn-delete-selected").on("click","#btn-delete-selected",function(){const t=e(".form-checkbox:checked").not("#headerCheck");if(!t.length){n("Pilih minimal 1 data untuk dihapus","warning",2e3);return}l=t.map(function(){return e(this).val()}).get(),k(`Apakah Anda yakin ingin menghapus ${l.length} data onsite?`)}),e(document).off("click","#deleteModalConfirm").on("click","#deleteModalConfirm",async function(){var o;const t=e(this),a=t.text();t.prop("disabled",!0).text("Menghapus...");try{await e.ajax({url:i("po-onsite.bulkDestroy"),method:"DELETE",data:{ids:l},headers:{"X-CSRF-TOKEN":e('meta[name="csrf-token"]').attr("content")}}),c(),n("Data onsite berhasil dihapus!","success",2e3),setTimeout(()=>window.location.reload(),500)}catch(r){x(((o=r==null?void 0:r.responseJSON)==null?void 0:o.message)||"Gagal menghapus data onsite","Gagal!")}finally{t.prop("disabled",!1).text(a)}}),e(document).off("click","#deleteModalCancel").on("click","#deleteModalCancel",c),e(document).off("click","#deleteModal").on("click","#deleteModal",function(t){e(t.target).is("#deleteModal")&&c()}),e(document).off("keydown.onsite-delete").on("keydown.onsite-delete",function(t){t.key==="Escape"&&!e("#deleteModal").hasClass("hidden")&&c()})}e(document).ready(function(){_(),w(),M(),O(),C(),L(),P()});
