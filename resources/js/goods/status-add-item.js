document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("addItemForm");
    const saveBtn = document.getElementById("btnSave");
    const loader = saveBtn.querySelector(".loader");
    const modal = document.querySelector(".fc-modal");
    const tableBody = document.getElementById("statusTableBody");

    // ✅ Fungsi tampilkan error otomatis
    function displayValidationErrors(errors) {
        document.querySelectorAll("[id^='error-']").forEach(el => el.textContent = "");
        document.querySelectorAll(".form-input").forEach(el => el.classList.remove("border-red-500"));

        Object.keys(errors).forEach((field) => {
            const errorEl = document.getElementById(`error-${field}`);
            if (errorEl) errorEl.textContent = errors[field][0];

            const inputEl = document.querySelector(`[name="${field}"]`);
            if (inputEl) inputEl.classList.add("border-red-500");
        });
    }

    // ✅ Fungsi reset form
    function resetForm() {
        form.reset();
        document.querySelectorAll("[id^='error-']").forEach(el => el.textContent = "");
        document.querySelectorAll(".form-input").forEach(el => el.classList.remove("border-red-500"));
    }

    // ✅ Fungsi tambah baris baru ke tabel
    function prependNewRow(data) {
        const newRow = document.createElement("tr");
        newRow.className = "bg-success";
        newRow.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                ${tableBody.children.length + 1}
            </td>
            <td class="px-6 py-4 text-sm text-white">
                ${data.name}
            </td>
        `;
        tableBody.prepend(newRow);
    }

    // ✅ Event submit form
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const action = form.getAttribute("action");
        const formData = new FormData(form);

        loader.classList.remove("hidden");
        saveBtn.disabled = true;

        fetch(action, {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('input[name="_token"]').value,
                    "Accept": "application/json"
                },
                body: formData
            })
            .then((res) => {
                if (!res.ok) throw res;
                return res.json();
            })
            .then((data) => {
                loader.classList.add("hidden");
                saveBtn.disabled = false;
                resetForm();
                modal.classList.add("hidden");

                // ⬇️ Tambah data ke tabel
                prependNewRow(data);

                // Optional: toastr / alert sukses
                // console.log("Berhasil disimpan", data);
            })
            .catch(async (error) => {
                loader.classList.add("hidden");
                saveBtn.disabled = false;

                try {
                    const json = await error.json();
                    if (json.errors) {
                        displayValidationErrors(json.errors);
                    } else {
                        alert("Terjadi kesalahan saat menyimpan data.");
                    }
                } catch (e) {
                    alert("Terjadi kesalahan tak terduga.");
                    console.error("Non-JSON error:", e);
                }
            });
    });
});

