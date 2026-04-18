// ===============================
// CONFIG
// ===============================
const API = "http://localhost:3000/api";

if (!sessionStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html";
}

// ===============================
// LOAD SETTINGS
// ===============================
async function loadSettings() {
    try {
        const res = await fetch(`${API}/settings`);

        if (!res.ok) {
            showMsg("❌ Could not load settings (Error " + res.status + ")", "red");
            return;
        }

        const s = await res.json();

        document.getElementById("adminName").value       = s.admin_name || "";
        document.getElementById("adminEmail").value      = s.admin_email || "";
        document.getElementById("libraryName").value     = s.library_name || "";
        document.getElementById("libraryAddress").value  = s.library_address || "";
        document.getElementById("libraryContact").value  = s.library_contact || "";
        document.getElementById("maxDays").value         = s.max_days || 14;
        document.getElementById("finePerDay").value      = s.fine_per_day || 5;
        document.getElementById("darkMode").checked      = !!s.dark_mode;
        document.getElementById("notifyToggle").checked  = !!s.notifications;

        applyTheme(!!s.dark_mode);

    } catch (err) {
        showMsg("❌ Cannot connect to server. Is node server.js running?", "red");
    }
}

// ===============================
// SAVE SETTINGS
// ===============================
async function saveSettings() {
    const data = {
        adminName:       document.getElementById("adminName").value,
        adminEmail:      document.getElementById("adminEmail").value,
        libraryName:     document.getElementById("libraryName").value,
        libraryAddress:  document.getElementById("libraryAddress").value,
        libraryContact:  document.getElementById("libraryContact").value,
        maxDays:         parseInt(document.getElementById("maxDays").value) || 14,
        finePerDay:      parseInt(document.getElementById("finePerDay").value) || 5,
        darkMode:        document.getElementById("darkMode").checked,
        notifications:   document.getElementById("notifyToggle").checked
    };

    try {
        const res = await fetch(`${API}/settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            showMsg("❌ Failed to save (Error " + res.status + ")", "red");
            return;
        }

        applyTheme(data.darkMode);
        showMsg("✅ Settings saved successfully!", "green");

    } catch (err) {
        showMsg("❌ Cannot connect to server. Is node server.js running?", "red");
    }
}

// ===============================
// APPLY THEME
// ===============================
function applyTheme(darkMode) {
    if (darkMode) {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }
}

// ===============================
// CHANGE PASSWORD
// ===============================
async function changePassword() {
    let oldP = document.getElementById("oldPass").value;
    let newP = document.getElementById("newPass").value;

    if (!oldP || !newP) {
        showMsg("❌ Enter both old and new password", "red");
        return;
    }

    try {
        const res = await fetch(`${API}/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldPassword: oldP, newPassword: newP })
        });

        const data = await res.json();

        if (res.ok) {
            showMsg("✅ Password updated successfully!", "green");
            document.getElementById("oldPass").value = "";
            document.getElementById("newPass").value = "";
        } else {
            showMsg("❌ " + (data.message || "Wrong password"), "red");
        }

    } catch (err) {
        showMsg("❌ Cannot connect to server.", "red");
    }
}

// ===============================
// SHOW MESSAGE HELPER
// ===============================
function showMsg(text, color) {
    let msg = document.getElementById("msg");
    msg.innerText = text;
    msg.style.color = color;
    setTimeout(() => { msg.innerText = ""; }, 4000);
}

// ===============================
// LOGOUT
// ===============================
function logout() {
    sessionStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

// ===============================
// INIT
// ===============================
loadSettings();
