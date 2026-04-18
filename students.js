// ===============================
// CONFIG
// ===============================
const API = "http://localhost:3000/api";

// if (!sessionStorage.getItem("isLoggedIn")) {
//     window.location.href = "login.html";
// }

// ===============================
// ADD STUDENT (with optional email & password)
// ===============================
async function addStudent() {
    let name = document.getElementById("studentName").value.trim();
    let rollNo = document.getElementById("rollNo").value.trim();
    let email = document.getElementById("studentEmail") ? document.getElementById("studentEmail").value.trim() : "";
    let password = document.getElementById("studentPass") ? document.getElementById("studentPass").value.trim() : "";

    if (!name || !rollNo) {
        alert("Name and Roll Number are required");
        return;
    }

    const body = { name, rollNo };
    if (email) body.email = email;
    if (password) body.password = password;

    const res = await fetch(`${API}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }

    document.getElementById("studentName").value = "";
    document.getElementById("rollNo").value = "";
    if (document.getElementById("studentEmail")) document.getElementById("studentEmail").value = "";
    if (document.getElementById("studentPass")) document.getElementById("studentPass").value = "";

    loadStudents();
}

// ===============================
// DELETE STUDENT
// ===============================
async function deleteStudent(rollNo) {
    if (!confirm("Are you sure you want to delete this student?")) return;
    await fetch(`${API}/students/${rollNo}`, { method: "DELETE" });
    loadStudents();
}

// ===============================
// LOAD STUDENTS
// ===============================
async function loadStudents() {
    const res = await fetch(`${API}/students`);
    const students = await res.json();

    let html = "";

    students.forEach(s => {
        html += `
        <tr>
            <td>${s.name}</td>
            <td>${s.roll_no}</td>
            <td>${s.issued_count}</td>
            <td>
                <button onclick="deleteStudent('${s.roll_no}')">Delete</button>
            </td>
        </tr>`;
    });

    document.getElementById("studentTable").innerHTML = html;
}

// ===============================
// INIT
// ===============================
loadStudents();
