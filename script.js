// ===============================
// CONFIG
// ===============================
const API = "http://localhost:3000/api";

// Auth guard
if (!sessionStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html";
}

// ===============================
// NAVIGATION
// ===============================
function goTo(page) {
    window.location.href = page;
}

function logout() {
    sessionStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

// ===============================
// DASHBOARD UPDATE
// ===============================
async function updateDashboard() {
    try {
        const res = await fetch(`${API}/dashboard`);
        const data = await res.json();

        document.getElementById("books").innerText = data.total_books ?? 0;
        document.getElementById("users").innerText = data.total_students ?? 0;
        document.getElementById("issued").innerText = data.active_issued ?? 0;
        document.getElementById("overdue").innerText = data.overdue_count ?? 0;

        loadRecentActivity(data.recent);
        loadOverdueList();
    } catch (err) {
        console.error("Dashboard error:", err);
        document.getElementById("books").innerText = "ERR";
        document.getElementById("users").innerText = "ERR";
        document.getElementById("issued").innerText = "ERR";
        document.getElementById("overdue").innerText = "ERR";
    }
}

// ===============================
// OVERDUE LIST
// ===============================
async function loadOverdueList() {
    let overdueBox = document.getElementById("overdueList");
    if (!overdueBox) return;

    try {
        const res = await fetch(`${API}/fines`);
        const fines = await res.json();

        if (fines.length === 0) {
            overdueBox.innerHTML = "No overdue books";
            return;
        }

        let html = "";
        fines.forEach(item => {
            html += `<div>${item.student_name} - ${item.book_title} (${item.late_days} days late) - ₹${item.fine} fine</div>`;
        });
        overdueBox.innerHTML = html;
    } catch (err) {
        overdueBox.innerHTML = "Could not load overdue data";
    }
}

// ===============================
// RECENT ACTIVITY
// ===============================
function loadRecentActivity(data) {
    let tbody = document.getElementById("recentActivity");
    if (!tbody) return;

    let html = "";

    (data || []).forEach(item => {
        let status = item.return_date
            ? `<span class="badge returned">Returned</span>`
            : `<span class="badge issued">Issued</span>`;

        let date = item.return_date
            ? new Date(item.return_date).toLocaleDateString()
            : new Date(item.issue_date).toLocaleDateString();

        html += `
            <tr>
                <td>${item.student_name}</td>
                <td>${item.book_title}</td>
                <td>${status}</td>
                <td>${date}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html || `<tr><td colspan="4">No activity</td></tr>`;
}

// ===============================
// INIT
// ===============================
window.onload = updateDashboard;
