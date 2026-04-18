// ===============================
// CONFIG
// ===============================
const API = "http://localhost:3000/api";

// ===============================
// LOGIN FUNCTION
// ===============================
async function login() {
    let email = document.querySelector("input[type='email']").value.trim();
    let password = document.querySelector("input[type='password']").value.trim();

    try {
        const res = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            sessionStorage.setItem("isLoggedIn", "true");
            window.location.href = "index.html";
        } else {
            alert(data.message || "Invalid Email or Password");
        }
    } catch (err) {
        alert("Cannot connect to server. Make sure server.js is running.");
    }
}

// ===============================
// ATTACH LOGIN BUTTON
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    let loginBtn = document.querySelector(".input-button");
    if (loginBtn) {
        loginBtn.addEventListener("click", login);
    }
});
