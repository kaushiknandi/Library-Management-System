// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Backend Server (Node.js + MySQL)
// ============================================================
// Install dependencies: npm install express mysql2 cors
// Run: node server.js
// ============================================================

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// DATABASE CONNECTION
// Edit host, user, password to match your MySQL setup
// ============================================================
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Kaushik@12345",   // <-- CHANGE THIS
    database: "library_db",
    waitForConnections: true,
    connectionLimit: 10
});

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/login  (Admin login)
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query(
            "SELECT * FROM admin WHERE email = ? AND password = ?",
            [email, password]
        );
        if (rows.length > 0) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/librarian-login
app.post("/api/librarian-login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query(
            "SELECT * FROM librarians WHERE email = ? AND password = ?",
            [email, password]
        );
        if (rows.length > 0) {
            res.json({ success: true, name: rows[0].name });
        } else {
            res.status(401).json({ success: false, message: "Invalid email or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/student-login  (Student login)
app.post("/api/student-login", async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ success: false, message: "Please provide both identifier and password" });
    }
    try {
        // Try matching by roll_no OR email
        const [rows] = await db.query(
            "SELECT * FROM students WHERE (roll_no = ? OR email = ?) AND password = ?",
            [identifier, identifier, password]
        );
        if (rows.length > 0) {
            const student = rows[0];
            res.json({
                success: true,
                id: student.id,
                name: student.name,
                roll_no: student.roll_no,
                email: student.email || ""
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid roll number/email or password" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/change-password
app.post("/api/change-password", async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM admin LIMIT 1");
        if (rows.length === 0) return res.status(404).json({ message: "Admin not found" });

        if (rows[0].password !== oldPassword) {
            return res.status(401).json({ message: "Wrong old password" });
        }

        await db.query("UPDATE admin SET password = ? WHERE id = ?", [newPassword, rows[0].id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// BOOKS ROUTES
// ============================================================

// GET /api/books - get all books with available count
app.get("/api/books", async (req, res) => {
    try {
        const [books] = await db.query("SELECT * FROM books ORDER BY created_at DESC");
        const [issued] = await db.query(
            "SELECT book_title, COUNT(*) as issued_count FROM issued_books WHERE return_date IS NULL GROUP BY book_title"
        );
        const issuedMap = {};
        issued.forEach(r => { issuedMap[r.book_title] = r.issued_count; });

        const result = books.map(b => ({
            ...b,
            available: b.quantity - (issuedMap[b.title] || 0)
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/books - add a book
app.post("/api/books", async (req, res) => {
    const { title, author, category, quantity } = req.body;
    if (!title || !author || !category || !quantity) {
        return res.status(400).json({ message: "Fill all fields" });
    }
    try {
        const [result] = await db.query(
            "INSERT INTO books (title, author, category, quantity) VALUES (?, ?, ?, ?)",
            [title, author, category, quantity]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/books/:id - edit a book
app.put("/api/books/:id", async (req, res) => {
    const { title, author, category, quantity } = req.body;
    try {
        await db.query(
            "UPDATE books SET title=?, author=?, category=?, quantity=? WHERE id=?",
            [title, author, category, quantity, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/books/:id - delete a book
app.delete("/api/books/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM books WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/books/:title/details - issued records for a book
app.get("/api/books/:title/details", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM issued_books WHERE book_title = ? ORDER BY issue_date DESC",
            [req.params.title]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// STUDENTS ROUTES
// ============================================================

// GET /api/students
app.get("/api/students", async (req, res) => {
    try {
        const [students] = await db.query("SELECT * FROM students ORDER BY created_at DESC");
        const [issued] = await db.query(
            "SELECT roll_no, COUNT(*) as issued_count FROM issued_books WHERE return_date IS NULL GROUP BY roll_no"
        );
        const issuedMap = {};
        issued.forEach(r => { issuedMap[r.roll_no] = r.issued_count; });

        const result = students.map(s => ({
            ...s,
            issued_count: issuedMap[s.roll_no] || 0
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/students - add student (with optional email & password)
app.post("/api/students", async (req, res) => {
    const { name, rollNo, email, password } = req.body;
    if (!name || !rollNo) return res.status(400).json({ message: "Name and Roll Number are required" });
    try {
        const studentPassword = password || "student123";  // default password
        const studentEmail = email || null;
        await db.query(
            "INSERT INTO students (name, roll_no, email, password) VALUES (?, ?, ?, ?)",
            [name, rollNo, studentEmail, studentPassword]
        );
        res.json({ success: true });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Roll number already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/students/:rollNo - edit student
app.put("/api/students/:rollNo", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let updates = [];
        let params = [];

        if (name) {
            updates.push("name = ?");
            params.push(name);
        }
        if (email !== undefined) {
            updates.push("email = ?");
            params.push(email || null);
        }
        if (password) {
            updates.push("password = ?");
            params.push(password);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        params.push(req.params.rollNo);
        await db.query(
            `UPDATE students SET ${updates.join(", ")} WHERE roll_no = ?`,
            params
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/students/:rollNo
app.delete("/api/students/:rollNo", async (req, res) => {
    try {
        await db.query("DELETE FROM students WHERE roll_no = ?", [req.params.rollNo]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/students/:rollNo - get student by roll no (for autofill)
app.get("/api/students/:rollNo", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM students WHERE roll_no = ?", [req.params.rollNo]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: "Not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/students/:rollNo/books - get all issued books for a student
app.get("/api/students/:rollNo/books", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ib.*, b.author 
             FROM issued_books ib
             LEFT JOIN books b ON b.title = ib.book_title
             WHERE ib.roll_no = ?
             ORDER BY ib.issue_date DESC`,
            [req.params.rollNo]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// TRANSACTIONS (ISSUED BOOKS) ROUTES
// ============================================================

// GET /api/transactions - get issued books (supports ?roll_no= for student filtering and ?search= for general search)
app.get("/api/transactions", async (req, res) => {
    const { search, roll_no, student_id } = req.query;
    try {
        let query = "SELECT * FROM issued_books";
        let conditions = [];
        let params = [];

        // Filter by specific roll_no (used by student dashboard)
        if (roll_no) {
            conditions.push("roll_no = ?");
            params.push(roll_no);
        }

        // General search (used by admin/librarian)
        if (search) {
            conditions.push("(student_name LIKE ? OR roll_no LIKE ? OR book_title LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY issue_date DESC";
        const [rows] = await db.query(query, params);

        // Add computed status field for frontend compatibility
        const result = rows.map(r => ({
            ...r,
            status: r.return_date ? "returned" : "issued"
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/transactions - issue a book (used by librarian dashboard)
app.post("/api/transactions", async (req, res) => {
    const { roll_no, book_identifier, due_date } = req.body;
    if (!roll_no || !book_identifier) {
        return res.status(400).json({ success: false, message: "Fill all fields" });
    }
    try {
        // Look up student by roll number
        const [studentRows] = await db.query("SELECT * FROM students WHERE roll_no = ?", [roll_no]);
        if (studentRows.length === 0) {
            return res.status(400).json({ success: false, message: "Student not found with this roll number" });
        }
        const studentName = studentRows[0].name;

        // Look up book by ID or title
        let book = null;
        const bookIdNum = parseInt(book_identifier);
        if (!isNaN(bookIdNum)) {
            const [bookById] = await db.query("SELECT * FROM books WHERE id = ?", [bookIdNum]);
            if (bookById.length > 0) book = bookById[0];
        }
        if (!book) {
            const [bookByTitle] = await db.query("SELECT * FROM books WHERE title = ?", [book_identifier]);
            if (bookByTitle.length > 0) book = bookByTitle[0];
        }
        if (!book) {
            // Also try partial match
            const [bookByLike] = await db.query("SELECT * FROM books WHERE title LIKE ?", [`%${book_identifier}%`]);
            if (bookByLike.length > 0) book = bookByLike[0];
        }
        if (!book) {
            return res.status(400).json({ success: false, message: "Book not found" });
        }

        // Check duplicate active issue
        const [dup] = await db.query(
            "SELECT id FROM issued_books WHERE roll_no = ? AND book_title = ? AND return_date IS NULL",
            [roll_no, book.title]
        );
        if (dup.length > 0) {
            return res.status(400).json({ success: false, message: "This book is already issued to this student" });
        }

        // Check availability
        const [[{ issued_count }]] = await db.query(
            "SELECT COUNT(*) as issued_count FROM issued_books WHERE book_title = ? AND return_date IS NULL",
            [book.title]
        );
        if (book.quantity - issued_count <= 0) {
            return res.status(400).json({ success: false, message: "No copies available" });
        }

        // Calculate due_date: use provided date or default to settings.max_days
        let finalDueDate = due_date || null;
        if (!finalDueDate) {
            const [[settings]] = await db.query("SELECT * FROM settings WHERE id = 1");
            const maxDays = settings ? settings.max_days : 14;
            const d = new Date();
            d.setDate(d.getDate() + maxDays);
            finalDueDate = d.toISOString().split("T")[0];
        }

        await db.query(
            "INSERT INTO issued_books (roll_no, student_name, book_title, due_date) VALUES (?, ?, ?, ?)",
            [roll_no, studentName, book.title, finalDueDate]
        );
        res.json({ success: true, message: "Book issued successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/transactions/issue - issue a book (legacy endpoint)
app.post("/api/transactions/issue", async (req, res) => {
    const { rollNo, studentName, bookTitle } = req.body;
    if (!rollNo || !studentName || !bookTitle) {
        return res.status(400).json({ message: "Fill all fields" });
    }
    try {
        // Check duplicate active issue
        const [dup] = await db.query(
            "SELECT id FROM issued_books WHERE roll_no = ? AND book_title = ? AND return_date IS NULL",
            [rollNo, bookTitle]
        );
        if (dup.length > 0) {
            return res.status(400).json({ message: "Book already issued to this student" });
        }

        // Check availability
        const [[book]] = await db.query("SELECT * FROM books WHERE title = ?", [bookTitle]);
        if (!book) return res.status(400).json({ message: "Book not found" });

        const [[{ issued_count }]] = await db.query(
            "SELECT COUNT(*) as issued_count FROM issued_books WHERE book_title = ? AND return_date IS NULL",
            [bookTitle]
        );
        if (book.quantity - issued_count <= 0) {
            return res.status(400).json({ message: "No copies available" });
        }

        await db.query(
            "INSERT INTO issued_books (roll_no, student_name, book_title) VALUES (?, ?, ?)",
            [rollNo, studentName, bookTitle]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/transactions/:id/return - return a book
app.put("/api/transactions/:id/return", async (req, res) => {
    try {
        // Check that this transaction exists and is not already returned
        const [rows] = await db.query("SELECT * FROM issued_books WHERE id = ?", [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }
        if (rows[0].return_date) {
            return res.status(400).json({ success: false, message: "Book already returned" });
        }

        await db.query(
            "UPDATE issued_books SET return_date = NOW() WHERE id = ?",
            [req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// FINES ROUTE
// ============================================================

// GET /api/fines - returns overdue unreturned books with fine calculation
// Supports ?roll_no= for student-specific filtering and ?search= for general search
app.get("/api/fines", async (req, res) => {
    const { search, roll_no } = req.query;
    try {
        const [[settings]] = await db.query("SELECT * FROM settings WHERE id = 1");
        const maxDays = settings.max_days || 14;
        const finePerDay = settings.fine_per_day || 5;

        let query = `
            SELECT *, DATEDIFF(NOW(), issue_date) AS days_held
            FROM issued_books
            WHERE return_date IS NULL
            AND DATEDIFF(NOW(), issue_date) > ?
        `;
        let params = [maxDays];

        // Filter by specific roll_no (used by student dashboard)
        if (roll_no) {
            query += " AND roll_no = ?";
            params.push(roll_no);
        }

        // General search (used by admin/librarian)
        if (search) {
            query += " AND (student_name LIKE ? OR roll_no LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        const [rows] = await db.query(query, params);

        const result = rows.map(r => ({
            ...r,
            late_days: r.days_held - maxDays,
            fine: (r.days_held - maxDays) * finePerDay
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// DASHBOARD ROUTE
// ============================================================

// GET /api/dashboard
app.get("/api/dashboard", async (req, res) => {
    try {
        const [[{ total_books }]] = await db.query("SELECT COALESCE(SUM(quantity),0) as total_books FROM books");
        const [[{ total_students }]] = await db.query("SELECT COUNT(*) as total_students FROM students");
        const [[{ active_issued }]] = await db.query("SELECT COUNT(*) as active_issued FROM issued_books WHERE return_date IS NULL");

        const [[settings]] = await db.query("SELECT * FROM settings WHERE id = 1");
        const maxDays = settings.max_days || 14;

        const [[{ overdue_count }]] = await db.query(
            "SELECT COUNT(*) as overdue_count FROM issued_books WHERE return_date IS NULL AND DATEDIFF(NOW(), issue_date) > ?",
            [maxDays]
        );

        const [recent] = await db.query(
            "SELECT * FROM issued_books ORDER BY issue_date DESC LIMIT 5"
        );

        res.json({ total_books, total_students, active_issued, overdue_count, recent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// SETTINGS ROUTES
// ============================================================

// GET /api/settings
app.get("/api/settings", async (req, res) => {
    try {
        const [[settings]] = await db.query("SELECT * FROM settings WHERE id = 1");
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/settings
app.put("/api/settings", async (req, res) => {
    const { adminName, adminEmail, libraryName, libraryAddress, libraryContact, maxDays, finePerDay, darkMode, notifications } = req.body;
    try {
        await db.query(
            `UPDATE settings SET admin_name=?, admin_email=?, library_name=?, library_address=?,
             library_contact=?, max_days=?, fine_per_day=?, dark_mode=?, notifications=? WHERE id=1`,
            [adminName, adminEmail, libraryName, libraryAddress, libraryContact, maxDays, finePerDay, darkMode ? 1 : 0, notifications ? 1 : 0]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Library server running at http://localhost:${PORT}`);
});
