// ===============================
// CONFIG
// ===============================
const API = "http://localhost:3000/api";

// if (!sessionStorage.getItem("isLoggedIn")) {
//     window.location.href = "login.html";
// }

// ===============================
// ADD BOOK
// ===============================
async function addBook() {
    let title = document.getElementById("title").value.trim();
    let author = document.getElementById("author").value.trim();
    let category = document.getElementById("category").value.trim();
    let quantity = parseInt(document.getElementById("quantity").value);

    if (!title || !author || !category || !quantity) {
        alert("Fill all fields");
        return;
    }

    const res = await fetch(`${API}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, category, quantity })
    });

    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }

    document.getElementById("title").value = "";
    document.getElementById("author").value = "";
    document.getElementById("category").value = "";
    document.getElementById("quantity").value = "";

    loadBooks();
}

// ===============================
// DELETE BOOK
// ===============================
async function deleteBook(id) {
    await fetch(`${API}/books/${id}`, { method: "DELETE" });
    loadBooks();
}

// ===============================
// EDIT BOOK
// ===============================
async function editBook(id, currentTitle, currentAuthor, currentCategory, currentQty) {
    let newTitle = prompt("Edit Title", currentTitle);
    let newAuthor = prompt("Edit Author", currentAuthor);
    let newCategory = prompt("Edit Category", currentCategory);
    let newQuantity = prompt("Edit Quantity", currentQty);

    if (!newTitle || !newAuthor || !newCategory || !newQuantity) return;

    await fetch(`${API}/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: newTitle,
            author: newAuthor,
            category: newCategory,
            quantity: parseInt(newQuantity)
        })
    });

    loadBooks();
}

// ===============================
// LOAD BOOKS
// ===============================
async function loadBooks() {
    const res = await fetch(`${API}/books`);
    const books = await res.json();

    let html = "";

    books.forEach(book => {
        html += `
            <tr onclick="showBookDetails('${book.title}')">
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.category}</td>
                <td>${book.quantity}</td>
                <td>${book.available}</td>
                <td>
                    <button onclick="event.stopPropagation(); editBook(${book.id}, '${book.title}', '${book.author}', '${book.category}', ${book.quantity})">Edit</button>
                    <button onclick="event.stopPropagation(); deleteBook(${book.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("bookTable").innerHTML = html;
}

// ===============================
// SHOW BOOK DETAILS
// ===============================
async function showBookDetails(title) {
    const res = await fetch(`${API}/books/${encodeURIComponent(title)}/details`);
    const records = await res.json();

    let html = "";

    records.forEach(item => {
        html += `
            <tr>
                <td>${item.student_name}</td>
                <td>${item.roll_no}</td>
                <td>
                    ${item.return_date
                        ? "Returned on " + new Date(item.return_date).toLocaleDateString()
                        : "Active"}
                </td>
            </tr>
        `;
    });

    document.getElementById("bookTitleHeading").innerText = "Book: " + title;
    document.getElementById("bookDetailsTable").innerHTML =
        html || "<tr><td colspan='3'>No records</td></tr>";

    document.getElementById("bookDetails").style.display = "block";
}

// ===============================
// INIT
// ===============================
loadBooks();
