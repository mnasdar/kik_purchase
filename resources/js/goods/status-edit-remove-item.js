document.addEventListener("DOMContentLoaded", () => {
    const editForm = document.getElementById("editItemForm");
    const editNameInput = document.getElementById("editName");
    const btnUpdate = document.getElementById("btnUpdate");
    const loader = btnUpdate.querySelector(".loader");
    const modal = document.getElementById("editModal");

    let currentEditId = null;

    // ✅ Buka modal dan isi data
    document.querySelectorAll(".btn-edit").forEach((button) => {
        button.addEventListener("click", function () {
            const id = this.dataset.id;
            const name = this.dataset.name;

            currentEditId = id;
            editNameInput.value = name;

            // Set action form
            editForm.setAttribute("action", `/status/${id}`);

            // Tampilkan modal
            modal.classList.remove("hidden");
        });
    });

    // ✅ Submit form
    editForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const action = this.getAttribute("action");
        const formData = new FormData(this);

        loader.classList.remove("hidden");
        btnUpdate.disabled = true;

        fetch(action, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": document.querySelector('input[name="_token"]').value,
                "Accept": "application/json",
                "X-HTTP-Method-Override": "PUT"
            },
            body: formData
        })
        .then(res => {
            if (!res.ok) throw res;
            return res.json();
        })
        .then(data => {
            loader.classList.add("hidden");
            btnUpdate.disabled = false;
            modal.classList.add("hidden");

            // Update tampilan data di tabel
            const row = document.querySelector(`tr[data-id="${currentEditId}"]`);
            if (row) {
                row.querySelector(".status-name").textContent = data.name;
                row.classList.add("bg-green-100");
                setTimeout(() => row.classList.remove("bg-green-100"), 2000);
            }

            currentEditId = null;
        })
        .catch(async (error) => {
            loader.classList.add("hidden");
            btnUpdate.disabled = false;

            try {
                const json = await error.json();
                if (json.errors) {
                    document.getElementById("error-edit-name").textContent = json.errors.name?.[0] || "";
                    editNameInput.classList.add("border-red-500");
                }
            } catch (e) {
                alert("Terjadi kesalahan saat memperbarui data.");
            }
        });
    });
});
