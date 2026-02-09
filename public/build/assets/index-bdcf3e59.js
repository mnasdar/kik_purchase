import{$ as t}from"./modal-handler-2823516c.js";import{a as W,b as c}from"./gridjs.module-3ea5c5ab.js";import{s as R}from"./index-88056f3d.js";import{t as z}from"./tippy.all-093076db.js";import{s as g,a as b,c as Y,b as q}from"./notification-d92c8c7c.js";import{f as K}from"./index-a4e39586.js";import"./_commonjsHelpers-725317a4.js";import"./parse-c3570fb2.js";import"./notification-5f085df9.js";let A=null,E=[],m=[];function Q(){return[{id:"checkbox",name:c("div",{innerHTML:'<input type="checkbox" id="headerCheck" class="form-checkbox rounded text-primary">'}),width:"50px",sort:!1,formatter:e=>c("div",{innerHTML:e})},{id:"number",name:"#",width:"50px"},{id:"payment_number",name:"Payment Number",width:"130px",formatter:e=>c("div",{innerHTML:e})},{id:"po_number",name:"No PO",width:"150px",formatter:e=>c("div",{innerHTML:`<span class="font-semibold text-primary">${e}</span>`})},{id:"item_desc",name:"Deskripsi Item",width:"200px",formatter:e=>c("div",{innerHTML:e})},{id:"unit_price",name:"Harga Unit",width:"120px",formatter:e=>c("div",{innerHTML:`<span class="font-semibold text-slate-700 dark:text-slate-300">${e}</span>`})},{id:"qty",name:"Qty",width:"70px",formatter:e=>c("div",{innerHTML:`<span class="font-semibold text-center block">${e}</span>`})},{id:"amount",name:"Amount",width:"130px",formatter:e=>c("div",{innerHTML:`<span class="font-semibold text-green-600 dark:text-green-400">${e}</span>`})},{id:"invoice_submit",name:"Tgl Invoice",width:"110px",formatter:e=>c("div",{innerHTML:e})},{id:"payment_date",name:"Tgl Pembayaran",width:"120px",formatter:e=>c("div",{innerHTML:e})},{id:"sla_payment",name:"SLA",width:"80px",formatter:e=>c("div",{innerHTML:e})},{id:"created_by",name:"Dibuat Oleh",width:"120px",formatter:e=>c("div",{innerHTML:e})}]}function O(e=!1){t.ajax({url:R("pembayaran.data"),method:"GET",beforeSend:function(){e&&g("Memuat data...","info",1e3)},success:function(a){const n=Array.isArray(a)?a:(a==null?void 0:a.data)??[],r=Array.isArray(a)?null:(a==null?void 0:a.stats)??null;E=n;const s=n.map(o=>[`<input type="checkbox" class="form-checkbox rounded text-primary" value="${o.id}">`,o.number,o.payment_number,`<button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 hover:shadow-md transition-all duration-200 pembayaran-po-click" data-payment-id="${o.id}"><span>${o.po_number}</span></button>`,o.item_desc,o.unit_price,o.qty,o.amount,o.invoice_submit,o.payment_date,o.sla_payment,o.created_by]);A?A.updateConfig({data:s}).forceRender():A=new W({columns:Q(),data:s,sort:!0,pagination:{enabled:!0,limit:10},search:!0,className:{table:"table-auto w-full",thead:"bg-slate-100 dark:bg-slate-800",th:"px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300",td:"px-4 py-3 text-sm text-slate-900 dark:text-slate-100"}}).render(document.getElementById("table-pembayaran")),V(r,n),t("#headerCheck").prop("checked",!1),t("#btn-delete-selected").addClass("hidden"),t("#delete-count").text(0),setTimeout(()=>{z("[data-tippy-content]",{arrow:!0,placement:"top"}),ee()},100),e&&g("Data berhasil dimuat!","success",1500)},error:function(){b("Gagal memuat data pembayaran","Error!")}})}function V(e,a){const n=(e==null?void 0:e.total)??a.length,r=(e==null?void 0:e.paid)??a.filter(i=>i.payment_date&&i.payment_date!=="-").length,s=(e==null?void 0:e.pending)??Math.max(n-r,0),o=(e==null?void 0:e.recent)??Z(a);t("#stat-total").text(n??0),t("#stat-paid").text(r??0),t("#stat-pending").text(s??0),t("#stat-recent").text(o??0),F()}function Z(e){const a=new Date,n=new Date(a.getTime()-30*24*60*60*1e3);return e.filter(r=>{if(!r.payment_date||r.payment_date==="-")return!1;const s=r.payment_date.split("-");if(s.length!==3)return!1;const o=parseInt(s[0]),i=s[1],p=parseInt(s[2]),f={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11}[i];if(f===void 0)return!1;const H=p>50?1900+p:2e3+p,w=new Date(H,f,o);return w>=n&&w<=a}).length}function ee(){t(document).off("change","#headerCheck").on("change","#headerCheck",function(){const e=t(this).is(":checked");t(".form-checkbox").not("#headerCheck").prop("checked",e).trigger("change")}),t(document).off("change",".form-checkbox").on("change",".form-checkbox",function(){if(t(this).is("#headerCheck"))return;te();const e=t(".form-checkbox").not("#headerCheck").length,a=t(".form-checkbox:checked").not("#headerCheck").length;t("#headerCheck").prop("checked",e>0&&e===a)}),t(document).off("click",".pembayaran-po-click").on("click",".pembayaran-po-click",function(e){e.preventDefault();const a=t(this).data("payment-id");a&&de(a)}),t(document).off("click","#detailPembayaranModalClose, #detailPembayaranModalBackdrop").on("click","#detailPembayaranModalClose, #detailPembayaranModalBackdrop",function(){be()}),t(document).off("click",".btn-detail-pembayaran").on("click",".btn-detail-pembayaran",function(){const e=t(this).data("id");ne(e)}),t(document).off("click",".btn-delete-pembayaran").on("click",".btn-delete-pembayaran",function(){const e=t(this).data("id"),a=t(this).data("number");j([e],`Apakah Anda yakin ingin menghapus pembayaran "${a}"?`)})}function te(){m=[],t(".form-checkbox:checked").not("#headerCheck").each(function(){m.push(t(this).val())}),F()}function F(){const e=m.length>0;t("#delete-count").text(m.length),e?t("#btn-delete-selected").removeClass("hidden").prop("disabled",!1):t("#btn-delete-selected").addClass("hidden").prop("disabled",!0)}function ae(){F()}function j(e,a="Apakah Anda yakin ingin menghapus data ini?"){m=e,t("#deleteMessage").text(a);const n=t("#deleteModal"),r=t("#deleteModalBackdrop"),s=t("#deleteModalContent");n.removeClass("hidden").css("opacity","1"),requestAnimationFrame(()=>{r.css("opacity","1"),s.css({transform:"scale(1)",opacity:"1"})})}function C(){const e=t("#deleteModalBackdrop"),a=t("#deleteModalContent");e.css("opacity","0"),a.css({transform:"scale(0.95)",opacity:"0"}),setTimeout(()=>{t("#deleteModal").addClass("hidden").css("opacity","0")},300)}function ne(e){const a=E.find(o=>o.id==e);if(!a)return;t("#detailPaymentNumber").text(a.payment_number||"-"),t("#detailPaymentDate").text(a.payment_date||"-"),t("#detailPaymentSLAPayment").text(a.sla_payment||"-"),t("#detailInvoiceNumber").text(a.invoice_number||"-"),t("#detailPONumber").text(a.po_number||"-"),t("#detailPRNumber").text(a.pr_number||"-"),t("#detailCreatedBy").text(a.created_by||"-");const n=t("#detailPembayaranModal"),r=t("#detailPembayaranModalBackdrop"),s=t("#detailPembayaranModalContent");n.removeClass("hidden").css("opacity","1"),requestAnimationFrame(()=>{r.css("opacity","1"),s.css({transform:"scale(1)",opacity:"1"})})}function N(){const e=t("#detailPembayaranModalBackdrop"),a=t("#detailPembayaranModalContent");e.css("opacity","0"),a.css({transform:"scale(0.95)",opacity:"0"}),setTimeout(()=>{t("#detailPembayaranModal").addClass("hidden").css("opacity","0")},300)}function re(){O(!1)}function oe(){t(document).off("click","#btn-refresh").on("click","#btn-refresh",function(){O(!0)})}function se(){t(document).off("click","#btn-delete-selected").on("click","#btn-delete-selected",function(){if(m.length===0){g("Pilih minimal 1 pembayaran untuk dihapus","warning",2e3);return}j(m,`Apakah Anda yakin ingin menghapus ${m.length} pembayaran?`)}),t(document).off("click","#deleteModalConfirm").on("click","#deleteModalConfirm",async function(){var n;const e=t(this),a=e.text();e.prop("disabled",!0).text("Menghapus...");try{await t.ajax({url:R("pembayaran.bulk-destroy"),method:"DELETE",data:{ids:m},headers:{"X-CSRF-TOKEN":t('meta[name="csrf-token"]').attr("content")}}),C(),g("Pembayaran berhasil dihapus!","success",2e3),m=[],ae(),setTimeout(()=>O(!1),500)}catch(r){b(((n=r==null?void 0:r.responseJSON)==null?void 0:n.message)||"Gagal menghapus pembayaran","Gagal!")}finally{e.prop("disabled",!1).text(a)}}),t(document).off("click","#deleteModalCancel, #deleteModalClose").on("click","#deleteModalCancel, #deleteModalClose",C),t(document).off("click","#deleteModal").on("click","#deleteModal",function(e){t(e.target).is("#deleteModal")&&C()}),t(document).off("keydown.pembayaran-delete").on("keydown.pembayaran-delete",function(e){e.key==="Escape"&&!t("#deleteModal").hasClass("hidden")&&C()})}function ie(){t(document).off("click","#detailPembayaranModalClose").on("click","#detailPembayaranModalClose",N),t(document).off("click","#detailPembayaranModal").on("click","#detailPembayaranModal",function(e){t(e.target).is("#detailPembayaranModal")&&N()}),t(document).off("keydown.pembayaran-detail").on("keydown.pembayaran-detail",function(e){e.key==="Escape"&&!t("#detailPembayaranModal").hasClass("hidden")&&N()})}function de(e){if(!E.find(n=>n.id==e)){b("Data pembayaran tidak ditemukan");return}t.ajax({url:R("pembayaran.data"),method:"GET",success:function(n){const s=(Array.isArray(n)?n:(n==null?void 0:n.data)??[]).find(o=>o.id==e);s&&(le(s),ce())},error:function(){b("Gagal memuat detail pembayaran")}})}function le(e){const a=`
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <tbody>
                    <!-- PR Section -->
                    <tr class="bg-blue-50/30 dark:bg-blue-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">📋 PURCHASE REQUEST</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 w-1/3">PR Number</td>
                        <td class="px-4 py-2.5 font-semibold text-primary">${e.pr_number??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Request Type</td>
                        <td class="px-4 py-2.5">${e.pr_request_type??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Location</td>
                        <td class="px-4 py-2.5">${e.pr_location??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Classification</td>
                        <td class="px-4 py-2.5">${e.classification??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Approved Date</td>
                        <td class="px-4 py-2.5">${e.pr_approved_date??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Item Description</td>
                        <td class="px-4 py-2.5">${e.item_desc??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">UOM</td>
                        <td class="px-4 py-2.5">${e.item_uom??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">PR Quantity</td>
                        <td class="px-4 py-2.5">${e.pr_qty??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">PR Unit Price</td>
                        <td class="px-4 py-2.5">Rp. ${e.pr_unit_price??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">PR Amount</td>
                        <td class="px-4 py-2.5 font-semibold text-green-600 dark:text-green-400">Rp. ${e.pr_amount??"-"}</td>
                    </tr>

                    <!-- PO Section -->
                    <tr class="bg-amber-50/30 dark:bg-amber-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-amber-700 dark:text-amber-300">🛒 PURCHASE ORDER</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">PO Number</td>
                        <td class="px-4 py-2.5 font-bold text-primary">${e.po_number??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Supplier</td>
                        <td class="px-4 py-2.5">${e.po_supplier??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Approved Date</td>
                        <td class="px-4 py-2.5">${e.po_approved_date??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Quantity</td>
                        <td class="px-4 py-2.5">${e.qty??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Unit Price</td>
                        <td class="px-4 py-2.5">Rp. ${e.unit_price??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Amount</td>
                        <td class="px-4 py-2.5 font-semibold text-green-600 dark:text-green-400">Rp. ${e.amount??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Cost Saving</td>
                        <td class="px-4 py-2.5 font-semibold text-green-700 dark:text-green-400">Rp. ${e.cost_saving??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PR→PO Target</td>
                        <td class="px-4 py-2.5">${e.sla_pr_to_po_target??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PR→PO Realisasi</td>
                        <td class="px-4 py-2.5">${e.sla_pr_to_po_realization??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PR→PO %</td>
                        <td class="px-4 py-2.5 ${e.sla_pr_to_po_percentage==="100%"?"text-green-700 dark:text-green-400":"text-red-700 dark:text-red-400"} font-bold">${e.sla_pr_to_po_percentage??"-"}</td>
                    </tr>

                    <!-- Onsite Section -->
                    <tr class="bg-red-50/30 dark:bg-red-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-red-700 dark:text-red-300">📍 ONSITE TRACKING</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Onsite Date</td>
                        <td class="px-4 py-2.5">${e.onsite_date??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PO→Onsite Target</td>
                        <td class="px-4 py-2.5">${e.sla_po_to_onsite_target??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PO→Onsite Realisasi</td>
                        <td class="px-4 py-2.5">${e.sla_po_to_onsite_realization??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA PO→Onsite %</td>
                        <td class="px-4 py-2.5 ${e.sla_po_to_onsite_percentage==="100%"?"text-green-700 dark:text-green-400":"text-red-700 dark:text-red-400"} font-bold">${e.sla_po_to_onsite_percentage??"-"}</td>
                    </tr>

                    <!-- Invoice Section -->
                    <tr class="bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-slate-700 dark:text-slate-300">📄 INVOICE</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Invoice Number</td>
                        <td class="px-4 py-2.5 font-semibold">${e.invoice_number??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Received Date</td>
                        <td class="px-4 py-2.5">${e.invoice_received_at??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Submit Date</td>
                        <td class="px-4 py-2.5">${e.invoice_submit??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA Target (Days)</td>
                        <td class="px-4 py-2.5">${e.sla_invoice_target??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA Realization (Days)</td>
                        <td class="px-4 py-2.5">${e.sla_invoice_realization??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA Invoice→Finance %</td>
                        <td class="px-4 py-2.5 ${e.sla_invoice_percentage==="100%"?"text-green-700 dark:text-green-400":"text-red-700 dark:text-red-400"} font-bold">${e.sla_invoice_percentage??"-"}</td>
                    </tr>

                    <!-- Payment Section -->
                    <tr class="bg-green-50/30 dark:bg-green-950/20 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-green-700 dark:text-green-300">💰 PAYMENT</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Payment Number</td>
                        <td class="px-4 py-2.5 font-semibold">${e.payment_number??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Payment Date</td>
                        <td class="px-4 py-2.5">${e.payment_date??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">SLA Payment (Days)</td>
                        <td class="px-4 py-2.5">${e.sla_payment??"-"}</td>
                    </tr>

                    <!-- Metadata -->
                    <tr class="bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
                        <td colspan="2" class="px-4 py-2 font-bold text-slate-700 dark:text-slate-300">ℹ️ METADATA</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Created By</td>
                        <td class="px-4 py-2.5">${e.created_by??"-"}</td>
                    </tr>
                    <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Created At</td>
                        <td class="px-4 py-2.5">${e.created_at??"-"}</td>
                    </tr>
                </tbody>
            </table>
        </div>`;t("#detailPembayaranContent").html(a)}function ce(){const e=t("#detailPembayaranModal"),a=t("#detailPembayaranModalBackdrop"),n=t("#detailPembayaranModalContent");e.removeClass("hidden").css("opacity","1"),requestAnimationFrame(()=>{a.css("opacity","1"),n.css({transform:"scale(1)",opacity:"1"})})}function be(){const e=t("#detailPembayaranModalBackdrop"),a=t("#detailPembayaranModalContent");e.css("opacity","0"),a.css({transform:"scale(0.95)",opacity:"0"}),setTimeout(()=>{t("#detailPembayaranModal").addClass("hidden").css("opacity","0")},300)}let me=0,x=[],h=[],T=!1,d=new Set;function I(e){if(e==null||e==="")return"-";const a=Number(e)||0;return new Intl.NumberFormat("id-ID").format(a)}function _(){d.clear(),t("#pembayaran-items-container .pembayaran-invoice-id").each(function(){const e=Number(t(this).val());!Number.isNaN(e)&&e>0&&d.add(e)})}function G(e,a){if(!e||!a)return 0;const n=new Date(e),r=new Date(a);if(n.setHours(0,0,0,0),r.setHours(0,0,0,0),r<n)return 0;let s=0;const o=new Date(n);for(;o<=r;){const i=o.getDay();i!==0&&i!==6&&s++,o.setDate(o.getDate()+1)}return s}function J(){t("#form-create-pembayaran").length&&(pe(),he(),$e(),_())}function pe(){t(document).on("click",".pembayaran-btn-remove-item",function(){const e=t(this).closest("tr");e.find(".pembayaran-invoice-id").val();const a=e.attr("data-row-id"),n=h.findIndex(r=>r.rowId===a);n!==-1&&(h[n].instance&&h[n].instance.destroy(),h.splice(n,1)),e.remove(),B(),X(),_(),x.length>0&&$(x)}),ue(),t(document).on("click","#btn-delete-selected-items",function(){fe()}),Ae()}function ue(){t(document).off("change","#item-select-all").on("change","#item-select-all",function(){t(".item-checkbox").prop("checked",this.checked),M()}),t(document).off("change",".item-checkbox").on("change",".item-checkbox",function(){const e=t(".item-checkbox").length===t(".item-checkbox:checked").length;t("#item-select-all").prop("checked",e),M()})}function M(){const e=t(".item-checkbox:checked").length,a=t("#btn-delete-selected-items");e>0?(a.removeClass("hidden"),t("#selected-items-count").text(e)):a.addClass("hidden")}async function fe(){const e=t(".item-checkbox:checked").closest("tr"),a=e.length;if(a===0){b("Tidak ada item yang dipilih");return}await Y(`Apakah Anda yakin ingin menghapus ${a} item terpilih?`,"Konfirmasi Hapus")&&(e.each(function(){const r=t(this).attr("data-row-id"),s=h.findIndex(o=>o.rowId===r);s!==-1&&(h[s].instance&&h[s].instance.destroy(),h.splice(s,1))}),e.remove(),B(),_(),t("#item-select-all").prop("checked",!1),M(),X(),x.length>0&&$(x),q(`${a} item berhasil dihapus`))}function he(){t(document).off("click","#btn-pick-invoice").on("click","#btn-pick-invoice",async function(){_(),Ie(),await ye(),ve(),k()}),t(document).off("click","#btn-close-invoice-modal").on("click","#btn-close-invoice-modal",function(){L()}),t(document).off("click","#btn-close-invoice-modal-footer").on("click","#btn-close-invoice-modal-footer",function(){L()}),t(document).off("change",".invoice-row-checkbox").on("change",".invoice-row-checkbox",function(){const e=Number(t(this).data("invoice-id"));this.checked?d.add(e):d.delete(e),S(),k()}),t(document).off("change","#invoice-select-all").on("change","#invoice-select-all",function(){const e=t(".invoice-row-checkbox"),a=t(this).is(":checked");e.each(function(){const n=Number(t(this).data("invoice-id"));a?d.add(n):d.delete(n),t(this).prop("checked",a)}),k()}),t(document).off("click","#btn-apply-selected-invoices").on("click","#btn-apply-selected-invoices",function(){xe()})}let P=[],l=1,v=10,u=[];async function ye(){try{const e=await fetch("/invoice/pembayaran/get-invoices",{headers:{"X-Requested-With":"XMLHttpRequest",Accept:"application/json"}});if(!e.ok)throw new Error("Gagal memuat data invoice");const a=await e.json();x=a,$(a)}catch(e){console.error("Error loading invoices:",e),b("Gagal memuat data invoice"),U()}}function k(){const e=new Set;t("#pembayaran-items-container .pembayaran-invoice-id").each(function(){const n=Number(t(this).val());!Number.isNaN(n)&&n>0&&e.add(n)});const a=Array.from(d).filter(n=>!e.has(n)).length;t("#invoice-selected-count").text(a),t("#btn-apply-count").text(a),t("#btn-apply-selected-invoices").prop("disabled",a===0)}function xe(){const e=new Set;t("#pembayaran-items-container .pembayaran-invoice-id").each(function(){const n=Number(t(this).val());!Number.isNaN(n)&&n>0&&e.add(n)});const a=[];if(d.forEach(n=>{if(!e.has(n)){const r=x.find(s=>Number(s.id)===n);r&&a.push(r)}}),a.length===0){b("Pilih minimal 1 invoice baru");return}a.forEach(n=>{Me(n)}),_(),$(x),k(),L()}function $(e){const a=new Set;if(t("#pembayaran-items-container .pembayaran-invoice-id").each(function(){const n=Number(t(this).val());!Number.isNaN(n)&&n>0&&a.add(n)}),P=e,u=[...P],a.forEach(n=>d.add(n)),l=1,t("#invoice-total").text(u.length),!u.length){t("#invoice-list-body").html(`
            <tr>
                <td colspan="8" class="px-3 py-4 text-center text-gray-500">
                    Tidak ada invoice yang tersedia
                </td>
            </tr>
        `);return}D(l),_e(),we(),U(),Ce()}function D(e){const a=(e-1)*v,n=a+v,r=u.slice(a,n),s=t("#invoice-list-body");if(s.empty(),!r.length){s.html(`
            <tr>
                <td colspan="8" class="px-3 py-4 text-center text-gray-500">
                    Tidak ada invoice yang cocok dengan pencarian
                </td>
            </tr>
        `);return}const o=new Set;t("#pembayaran-items-container .pembayaran-invoice-id").each(function(){const i=Number(t(this).val());!Number.isNaN(i)&&i>0&&o.add(i)}),r.forEach(i=>{const p=d.has(Number(i.id)),y=o.has(Number(i.id)),f=y?"disabled":"",w=`
            <tr class="${y?"bg-gray-100 dark:bg-slate-700/50 opacity-60":"hover:bg-gray-50 dark:hover:bg-slate-700/30"}">
                <td class="px-3 py-2 text-center">
                    <input type="checkbox" class="form-checkbox rounded text-primary invoice-row-checkbox" data-invoice-id="${i.id}" ${p?"checked":""} ${f} title="${y?"Sudah ditambahkan":""}">
                </td>
                <td class="px-3 py-2 text-left">
                    <span class="font-medium text-blue-600 dark:text-blue-400">${i.invoice_number}</span>
                </td>
                <td class="px-3 py-2 text-left">${i.po_number}</td>
                <td class="px-3 py-2 text-left">${i.pr_number}</td>
                <td class="px-3 py-2 text-left text-xs">${i.item_desc}</td>
                <td class="px-3 py-2 text-right">${I(i.unit_price)}</td>
                <td class="px-3 py-2 text-center">${i.quantity??"-"}</td>
                <td class="px-3 py-2 text-right font-semibold">${I(i.amount)}</td>
            </tr>
        `;s.append(w)}),ge(),t("#invoice-count").text(r.length),ke(),S()}function ke(){const e=Math.ceil(u.length/v)||1;t("#invoice-current-page").text(l),t("#invoice-total-pages").text(e),t("#invoice-per-page").text(v),t("#btn-invoice-prev").prop("disabled",l<=1),t("#btn-invoice-next").prop("disabled",l>=e)}function ge(){t(document).off("change",".invoice-row-checkbox").on("change",".invoice-row-checkbox",function(e){if(t(this).is(":disabled"))return e.preventDefault(),!1;const a=Number(t(this).data("invoice-id"));this.checked?d.add(a):d.delete(a),S(),k()})}function S(){const e=t(".invoice-row-checkbox");if(!e.length){t("#invoice-select-all").prop("checked",!1);return}const a=t(".invoice-row-checkbox:checked").length;t("#invoice-select-all").prop("checked",a>0&&a===e.length)}function ve(){t(".invoice-row-checkbox").each(function(){const e=Number(t(this).data("invoice-id"));t(this).prop("checked",d.has(e))}),S()}function _e(){t(document).off("input","#invoice-search-input").on("input","#invoice-search-input",function(){const e=t(this).val().toLowerCase().trim();e===""?u=[...P]:u=P.filter(a=>(a.invoice_number||"").toLowerCase().includes(e)||(a.po_number||"").toLowerCase().includes(e)||(a.pr_number||"").toLowerCase().includes(e)||(a.item_desc||"").toLowerCase().includes(e)),l=1,t("#invoice-total").text(u.length),D(l)})}function we(){t(document).off("click","#btn-invoice-prev").on("click","#btn-invoice-prev",function(){l>1&&(l--,D(l))}),t(document).off("click","#btn-invoice-next").on("click","#btn-invoice-next",function(){const e=Math.ceil(u.length/v);l<e&&(l++,D(l))})}function Ce(){t("#modal-pick-invoice").removeClass("hidden")}function L(){t("#modal-pick-invoice").addClass("hidden")}function Ie(){t("#invoice-page-loading").removeClass("hidden")}function U(){t("#invoice-page-loading").addClass("hidden")}function Me(e,a={}){t("#pembayaran-items-container tr.text-center.text-gray-500").remove();const n=[];t("#pembayaran-items-container tr.pembayaran-item-row .pembayaran-invoice-id").each(function(){const r=t(this).val(),s=Number(r);!Number.isNaN(s)&&s>0&&n.push(s)}),!n.includes(Number(e.id))&&(Pe(e),d.add(Number(e.id)),B(),t("#item-select-all").prop("checked",!1),M())}function Pe(e){const a=t("#pembayaran-item-row-template").html(),n=t(a),r=me++,s="row-"+r;n.attr("data-row-id",s),n.find("input, select").each(function(){const i=t(this).attr("name");i&&t(this).attr("name",i.replace("[0]",`[${r}]`))}),t("#pembayaran-items-container").append(n),n.find(".pembayaran-invoice-id").val(e.id),n.find(".pembayaran-invoice-number").text(e.invoice_number),n.find(".pembayaran-po-number").text(e.po_number),n.find(".pembayaran-pr-number").text(e.pr_number),n.find(".pembayaran-item-desc").text(e.item_desc),n.find(".pembayaran-unit-price").text(I(e.unit_price)),n.find(".pembayaran-qty").text(e.quantity),n.find(".pembayaran-amount").text(I(e.amount)),e.submitted_at&&(n.find(".pembayaran-submitted-at").val(e.submitted_at),n.find(".pembayaran-submitted-date").text(De(e.submitted_at)));const o=t("#payment_date").val();if(o&&e.submitted_at){const i=G(e.submitted_at,o);n.find(".pembayaran-sla-display").text(i+" hari"),n.find(".pembayaran-sla-input").val(i)}}function De(e){if(!e)return"-";const a=new Date(e),n=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],r=a.getDate(),s=n[a.getMonth()],o=a.getFullYear().toString().substr(-2);return`${r}-${s}-${o}`}function B(){t("#pembayaran-items-container tr.pembayaran-item-row").each(function(e){t(this).find(".pembayaran-item-number").text(e+1),t(this).find("input, select, textarea").each(function(){const a=t(this).attr("name");if(!a)return;const n=a.replace(/items\[\d+\]/,`items[${e}]`);t(this).attr("name",n)})})}function X(){if(t("#pembayaran-items-container tr").not(".text-center.text-gray-500").length===0){const a=`
            <tr class="text-center text-gray-500">
                <td colspan="12" class="border px-4 py-8">
                    <div class="flex flex-col items-center gap-2">
                        <i class="mgc_inbox_line text-4xl text-gray-400"></i>
                        <p class="text-sm">Belum ada invoice yang dipilih</p>
                        <p class="text-xs text-gray-400">Klik tombol "Pilih Invoice" untuk memulai</p>
                    </div>
                </td>
            </tr>
        `;t("#pembayaran-items-container").html(a)}}function $e(){const e=document.getElementById("payment_date");e&&K(e,{altInput:!0,altFormat:"d-M-y",dateFormat:"Y-m-d",allowInput:!0,locale:{firstDayOfWeek:1},onChange:function(a,n){Se()}})}function Se(){const e=t("#payment_date").val();if(!e){t(".pembayaran-sla-display").text("-"),t(".pembayaran-sla-input").val("");return}t("#pembayaran-items-container tr.pembayaran-item-row").each(function(){const a=t(this),n=a.find(".pembayaran-submitted-at").val();if(n){const r=G(n,e);a.find(".pembayaran-sla-display").text(r+" hari"),a.find(".pembayaran-sla-input").val(r)}else a.find(".pembayaran-sla-display").text("-"),a.find(".pembayaran-sla-input").val("")})}function Ae(){t("#form-create-pembayaran").off("submit").on("submit",async function(e){if(e.preventDefault(),T)return console.log("Form is already being submitted..."),!1;if(!Ne())return!1;T=!0;const a=new FormData(this),n=t("#payment_number").val(),r=t("#payment_date").val();t("#pembayaran-items-container tr.pembayaran-item-row").each(function(){const y=(t(this).find(".pembayaran-invoice-id").attr("name")||"").match(/items\[(\d+)\]/),f=y?y[1]:null;f!==null&&(n&&a.set(`items[${f}][payment_number]`,n),a.set(`items[${f}][payment_date]`,r))});const s=t(this).find('button[type="submit"]'),o=s.html();s.prop("disabled",!0).html('<i class="mgc_loading_line animate-spin me-2"></i>Menyimpan...');try{const i=await fetch(this.action,{method:"POST",body:a,headers:{"X-Requested-With":"XMLHttpRequest",Accept:"application/json"}}),p=await i.json();if(!i.ok)throw new Error(p.message||"Gagal menyimpan pembayaran");q(p.message||"Pembayaran berhasil disimpan"),setTimeout(()=>{window.location.href="/invoice/pembayaran"},1e3)}catch(i){b(i.message),s.prop("disabled",!1).html(o),T=!1}})}function Ne(){if(t("#pembayaran-items-container tr.pembayaran-item-row").length===0)return b("Belum ada invoice yang dipilih. Silakan pilih minimal 1 invoice."),!1;const a=t("#payment_date").val();return!a||a.trim()===""?(b("Payment Date wajib diisi"),t("#payment_date").focus(),!1):!0}t(document).ready(function(){J()});function Te(){const e=document.getElementById("payment_date");e&&typeof flatpickr<"u"&&flatpickr(e,{enableTime:!1,dateFormat:"Y-m-d",locale:"id"})}function Le(){const e=document.getElementById("pembayaranForm");e&&e.addEventListener("submit",function(a){a.preventDefault();const n=new FormData(this),r=this.querySelector('button[type="submit"]'),s=r.textContent;r.disabled=!0,r.textContent="Menyimpan...",fetch(this.action,{method:"POST",body:n,headers:{"X-Requested-With":"XMLHttpRequest",Accept:"application/json"}}).then(o=>o.ok?o.json():o.json().then(i=>{throw{status:o.status,data:i}})).then(o=>{g("Pembayaran berhasil diperbarui","success"),setTimeout(()=>{window.location.href="/pembayaran"},1e3)}).catch(o=>{let i="Terjadi kesalahan saat memperbarui pembayaran";o.data&&(o.data.message?i=o.data.message:o.data.errors&&(i=Object.values(o.data.errors).flat().join(", "))),b(i),r.disabled=!1,r.textContent=s})})}function Re(){Te(),Le()}t(document).ready(function(){const e=document.getElementById("form-create-pembayaran"),a=document.getElementById("pembayaranForm");e?J():a?Re():document.querySelector("[data-table-init]")&&(re(),oe(),se(),ie())});
