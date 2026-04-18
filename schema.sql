-- ============================================================
-- LIBRARY MANAGEMENT SYSTEM - MySQL Schema
-- Run this file first to set up your database
-- ============================================================

CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- ============================================================
-- ADMIN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Default admin: admin@gmail.com / admin123
INSERT IGNORE INTO admin (email, password) VALUES ('admin@gmail.com', 'admin123');

-- ============================================================
-- SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_name VARCHAR(100),
    admin_email VARCHAR(100),
    library_name VARCHAR(100),
    library_address VARCHAR(255),
    library_contact VARCHAR(50),
    max_days INT DEFAULT 14,
    fine_per_day INT DEFAULT 5,
    dark_mode TINYINT(1) DEFAULT 0,
    notifications TINYINT(1) DEFAULT 0
);

INSERT IGNORE INTO settings (id, max_days, fine_per_day) VALUES (1, 14, 5);

-- ============================================================
-- LIBRARIANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS librarians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default librarian: librarian@gmail.com / lib123
INSERT IGNORE INTO librarians (name, email, password) VALUES ('Head Librarian', 'librarian@gmail.com', 'lib123');

-- ============================================================
-- BOOKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STUDENTS TABLE (with email & password for student login)
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) DEFAULT NULL,
    password VARCHAR(255) NOT NULL DEFAULT 'student123',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ISSUED BOOKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS issued_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(50) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE DEFAULT NULL,
    return_date DATETIME DEFAULT NULL,
    FOREIGN KEY (roll_no) REFERENCES students(roll_no) ON DELETE CASCADE
);

-- ============================================================
-- MIGRATION: If students table already exists without email/password
-- Run these ALTER statements to add the new columns:
-- ============================================================
-- ALTER TABLE students ADD COLUMN email VARCHAR(100) DEFAULT NULL AFTER roll_no;
-- ALTER TABLE students ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT 'student123' AFTER email;

-- ============================================================
-- MIGRATION: If issued_books table already exists without due_date
-- ============================================================
-- ALTER TABLE issued_books ADD COLUMN due_date DATE DEFAULT NULL AFTER issue_date;
