import{i as P}from"./data-table-e496d1b5.js";import{b as d}from"./gridjs.module-3ea5c5ab.js";import{$ as n}from"./modal-handler-2823516c.js";import{s as x}from"./index-88056f3d.js";import{s as b}from"./notification-d92c8c7c.js";import"./parse-c3570fb2.js";import"./glightbox.min-3fffbd26.js";import"./_commonjsHelpers-725317a4.js";import"./notification-5f085df9.js";const a=(t,o,s=!1)=>`
    <tr class="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-medium">${t}</td>
        <td class="px-4 py-2.5 text-slate-900 dark:text-white font-semibold">${o}</td>
    </tr>
`,l=t=>t||t===0?Number(t).toLocaleString("id-ID"):"-",g=t=>t||t===0?Number(t).toLocaleString("id-ID"):"-",c=t=>{if(!t)return"-";const o=new Date(t),s=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],r=String(o.getDate()).padStart(2,"0"),e=s[o.getMonth()],i=String(o.getFullYear()).slice(-2);return`${r}-${e}-${i}`},p=(t,o)=>!t||!o?"-":Number(o)>Number(t)?"0%":"100%";function h(){var s;if(!n("#table-pr-items").length)return;const t=(s=window.classificationData)==null?void 0:s.id;if(!t){b("Classification ID tidak ditemukan","error");return}const o=[{id:"number",name:"#",width:"60px"},{id:"po_number",name:"PO Number",width:"140px",formatter:r=>d("div",{innerHTML:r})},{id:"location",name:"Lokasi",width:"140px",formatter:r=>d("div",{innerHTML:r})},{id:"item_description",name:"Item Description",width:"300px",formatter:r=>d("div",{innerHTML:r})},{id:"quantity",name:"Qty",width:"120px",formatter:r=>d("div",{innerHTML:r})},{id:"unit_price",name:"Unit Price",width:"140px",formatter:r=>d("div",{innerHTML:r})},{id:"amount",name:"Amount",width:"150px",formatter:r=>d("div",{innerHTML:r})},{id:"status",name:"Status",width:"150px",formatter:r=>d("div",{innerHTML:r})},{id:"created_by",name:"Created By",width:"140px",formatter:r=>d("div",{innerHTML:r})}];P({tableId:"#table-pr-items",dataUrl:x("klasifikasi.pr-items.data",t),columns:o,enableCheckbox:!1,buttonConfig:[],limit:10,enableFilter:!1,onDataLoaded:r=>{n("#data-count").text(r.length)}})}function C(){var s;const t=n("#table-pr-items").data("grid");if(!t)return;const o=(s=window.classificationData)==null?void 0:s.id;o&&(b("Memuat data...","info",1e3),n.ajax({url:x("klasifikasi.pr-items.data",o),method:"GET",success:function(r){const e=r.map(i=>[i.number,i.po_number,i.location,i.item_description,i.quantity,i.unit_price,i.amount,i.status,i.created_by]);t.updateConfig({data:e}).forceRender(),n("#data-count").text(r.length),b("Data berhasil direfresh","success",1500)},error:function(r){console.error("Error loading data:",r),b("Gagal memuat data","error",2e3)}}))}function T(){n("#btn-refresh").on("click",function(){C()})}function w(){n(document).on("click",".btn-pr-detail",function(t){var r;t.preventDefault();const o=n(this).data("pr-id"),s=(r=window.classificationData)==null?void 0:r.id;!o||!s||R(s,o)}),n("#prDetailClose, #prDetailBackdrop").on("click",function(){k()}),n(document).on("keydown",function(t){t.key==="Escape"&&!n("#prDetailModal").hasClass("hidden")&&k()})}function R(t,o){u('<div class="text-center text-slate-500 dark:text-slate-400">Memuat data...</div>'),n.ajax({url:x("klasifikasi.pr-items.detail",[t,o]),method:"GET",success:function(s){S(s)},error:function(){u('<div class="text-center text-red-500">Gagal memuat data</div>')}})}function S(t){if(!t||!t.pr){u('<div class="text-center text-red-500">Data tidak ditemukan</div>');return}const o=(t.items||[]).map((e,i)=>{const D=`<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${e.stage_color??""}">${e.stage_label??"-"}</span>`,f=p(e.sla_pr_to_po_target,e.sla_pr_to_po_realization),$=f==="100%"?"text-green-600 dark:text-green-400":f==="0%"?"text-red-600 dark:text-red-400":"",m=p(e.sla_po_to_onsite_target,e.sla_po_to_onsite_realization),y=m==="100%"?"text-green-600 dark:text-green-400":m==="0%"?"text-red-600 dark:text-red-400":"";p(e.sla_onsite_to_submit_target,e.sla_onsite_to_submit_realization);const _=p(e.sla_invoice_to_finance_target,e.sla_invoice_to_finance_realization),v=_==="100%"?"text-green-600 dark:text-green-400":_==="0%"?"text-red-600 dark:text-red-400":"";return`
            <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <table class="w-full text-sm">
                    <tbody>
                        <tr class="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-slate-800 dark:text-slate-100">Item ${i+1}: ${e.item_desc??"-"}</td>
                        </tr>
                        <tr class="bg-blue-50/30 dark:bg-blue-950/20 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">📋 PURCHASE REQUEST</td>
                        </tr>
                        ${a("Classification",e.classification??"-")}
                        ${a("Stage",D,!0)}
                        ${a("Qty",g(e.quantity))}
                        ${a("UOM",e.uom??"-")}
                        ${a("PR Unit Price",l(e.pr_unit_price))}
                        ${a("PR Amount",l(e.pr_amount))}

                        <tr class="bg-amber-50/30 dark:bg-amber-950/20 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-amber-700 dark:text-amber-300">🛒 PURCHASE ORDER</td>
                        </tr>
                        ${a("PO Number",e.po_number??"-")}
                        ${a("Supplier",e.po_supplier??"-")}
                        ${a("PO Qty",g(e.po_quantity))}
                        ${a("PO Unit Price",l(e.po_unit_price))}
                        ${a("PO Amount",l(e.po_amount))}
                        ${a("Cost Saving",l(e.cost_saving))}
                        ${a("SLA PR→PO Target",e.sla_pr_to_po_target??"-")}
                        ${a("SLA PR→PO Realisasi",e.sla_pr_to_po_realization??"-")}
                        ${a("SLA PR→PO %",`<span class="font-bold ${$}">${f}</span>`,!0)}

                        <tr class="bg-red-50/30 dark:bg-red-950/20 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-red-700 dark:text-red-300">📍 ONSITE</td>
                        </tr>
                        ${a("Onsite Date",c(e.onsite_date))}
                        ${a("SLA PO→Onsite Target",e.sla_po_to_onsite_target??"-")}
                        ${a("SLA PO→Onsite Real",e.sla_po_to_onsite_realization??"-")}
                        ${a("SLA PO→Onsite %",`<span class="font-bold ${y}">${m}</span>`,!0)}

                        <tr class="bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-emerald-700 dark:text-emerald-300">💼 INVOICE</td>
                        </tr>
                        ${a("Invoice Number",e.invoice_number??"-")}
                        ${a("Invoice Received",c(e.invoice_received_at))}
                        ${a("Invoice Submitted",c(e.invoice_submitted_at))}
                        ${a("SLA Inv→Finance Target",e.sla_invoice_to_finance_target??"-")}
                        ${a("SLA Inv→Finance Real",e.sla_invoice_to_finance_realization??"-")}
                        ${a("SLA Inv→Finance %",`<span class="font-bold ${v}">${_}</span>`,!0)}

                        <tr class="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                            <td colspan="2" class="px-4 py-2 font-bold text-slate-700 dark:text-slate-200">💳 PAYMENT</td>
                        </tr>
                        ${a("Payment Number",e.payment_number??"-")}
                        ${a("Payment Date",c(e.payment_date))}
                        ${a("SLA Payment Real",e.sla_payment_realization??"-")}
                    </tbody>
                </table>
            </div>
        `}).join(""),r=`
        <div class="space-y-4">
            ${`
        <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mb-4">
            <table class="w-full text-sm">
                <tbody>
                    <tr class="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                        <td colspan="2" class="px-4 py-2 font-bold text-slate-800 dark:text-slate-100">ℹ️ PR INFO</td>
                    </tr>
                    ${a("Request Type",t.pr.request_type??"-")}
                    ${a("Location",t.pr.location??"-")}
                    ${a("Approved Date",c(t.pr.approved_date))}
                    ${a("Created By",t.pr.created_by??"-")}
                    ${a("Notes",t.pr.notes??"-")}    
                </tbody>
            </table>
        </div>
    `}
            ${o||'<p class="text-sm text-slate-500">Tidak ada item</p>'}
        </div>
    `;n("#prDetailTitle").text(`PR ${t.pr.number}`),u(r)}function u(t){n("#prDetailBody").html(t);const o=n("#prDetailModal"),s=n("#prDetailBackdrop"),r=n("#prDetailContent");o.removeClass("hidden").css({opacity:1,"pointer-events":"auto"}),setTimeout(()=>{s.css("opacity",1),r.css({opacity:1,transform:"scale(1)"})},10)}function k(){const t=n("#prDetailModal"),o=n("#prDetailBackdrop"),s=n("#prDetailContent");o.css("opacity",0),s.css({opacity:0,transform:"scale(0.95)"}),setTimeout(()=>{t.addClass("hidden").css({opacity:0,"pointer-events":"none"})},300)}n(document).ready(function(){h(),T(),w()});
