// ===============================
// CONFIG
// ===============================
const API = "http://localhost:3000/api";

if (!sessionStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html";
}

// ===============================
// AUTO FILL STUDENT NAME FROM ROLL NO
// ===============================
document.getElementById("rollNo").addEventListener("input", async function () {
    let roll = this.value.trim();
    if (!roll) {
        document.getElementById("studentName").value = "";
        return;
    }

    try {
        const res = await fetch(`${API}/students/${roll}`);
        if (res.ok) {
            const student = await res.json();
            document.getElementById("studentName").value = student.name;
        } else {
            document.getElementById("studentName").value = "";
        }
    } catch (e) {
        document.getElementById("studentName").value = "";
    }
});

// ===============================
// BOOK SEARCH DROPDOWN
// ===============================
let selectedBook = "";

document.getElementById("bookSearch").addEventListener("input", async function () {
    let query = this.value.toLowerCase();
    let list = document.getElementById("bookList");
    list.innerHTML = "";

    if (!query) return;

    const res = await fetch(`${API}/books`);
    const books = await res.json();

    books
        .filter(b => b.title.toLowerCase().includes(query))
        .forEach(book => {
            let div = document.createElement("div");
            div.innerText = book.title;
            div.onclick = () => {
                selectedBook = book.title;
                document.getElementById("bookSearch").value = book.title;
                list.innerHTML = "";
            };
            list.appendChild(div);
        });
});

// ===============================
// ISSUE BOOK
// ===============================
async function issueBook() {
    let rollNo = document.getElementById("rollNo").value.trim();
    let studentName = document.getElementById("studentName").value;
    let bookTitle = selectedBook;

    if (!rollNo || !studentName || !bookTitle) {
        alert("Fill all fields properly");
        return;
    }

    const res = await fetch(`${API}/transactions/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNo, studentName, bookTitle })
    });

    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }

    document.getElementById("rollNo").value = "";
    document.getElementById("studentName").value = "";
    document.getElementById("bookSearch").value = "";
    selectedBook = "";

    loadIssuedBooks();
}

// ===============================
// RETURN BOOK
// ===============================
async function returnBook(id) {
    await fetch(`${API}/transactions/${id}/return`, { method: "PUT" });
    loadIssuedBooks();
}

// ===============================
// LOAD ISSUED BOOKS TABLE
// ===============================
async function loadIssuedBooks() {
    let searchEl = document.getElementById("searchInput");
    let search = searchEl ? searchEl.value.trim() : "";

    const res = await fetch(`${API}/transactions${search ? "?search=" + encodeURIComponent(search) : ""}`);
    const issued = await res.json();

    let html = "";

    issued.forEach(item => {
        let issueDate = new Date(item.issue_date);
        let returnDate = item.return_date ? new Date(item.return_date) : null;
        let endDate = returnDate || new Date();

        let days = Math.floor((endDate - issueDate) / (1000 * 60 * 60 * 24));
        let isLate = days > 14;

        let status = returnDate
            ? (isLate ? "Returned (Late)" : "Returned")
            : (isLate ? "Overdue" : "Active");

        let action = returnDate
            ? `Returned on ${returnDate.toLocaleDateString()}`
            : `<button onclick="returnBook(${item.id})">Return</button>`;

        html += `
        <tr>
            <td>${item.student_name}</td>
            <td>${item.book_title}</td>
            <td>${issueDate.toLocaleDateString()}</td>
            <td>${status}</td>
            <td>${action}</td>
        </tr>`;
    });

    document.getElementById("issuedTable").innerHTML =
        html || "<tr><td colspan='5'>No records found</td></tr>";
}

// ===============================
// SEARCH LISTENER
// ===============================
let searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", loadIssuedBooks);
}

// ===============================
// INIT
// ===============================
loadIssuedBooks();
