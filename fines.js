// ===============================
// CONFIG
// ===============================
const API = "http://localhost:3000/api";

if (!sessionStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html";
}

// ===============================
// LOAD FINES
// ===============================
async function loadFines() {
    let searchInput = document.getElementById("fineSearch");
    let search = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const res = await fetch(`${API}/fines${search ? "?search=" + encodeURIComponent(search) : ""}`);
    const fines = await res.json();

    let html = "";

    fines.forEach(item => {
        html += `
            <tr>
                <td>${item.student_name}</td>
                <td>${item.roll_no}</td>
                <td>${item.book_title}</td>
                <td>${item.late_days}</td>
                <td>₹${item.fine}</td>
                <td>Pending</td>
            </tr>
        `;
    });

    document.getElementById("fineTable").innerHTML =
        html || "<tr><td colspan='6'>No fines</td></tr>";
}

// ===============================
// SEARCH LISTENER
// ===============================
let searchEl = document.getElementById("fineSearch");
if (searchEl) {
    searchEl.addEventListener("input", loadFines);
}

// ===============================
// INIT
// ===============================
loadFines();
