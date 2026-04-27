-- Neet Prep MySQL Database Schema
-- Run this in XAMPP phpMyAdmin

-- Create database
CREATE DATABASE IF NOT EXISTS neet_prep;
USE neet_prep;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  neet_rank INT,
  category ENUM('General', 'OBC', 'SC', 'ST') DEFAULT 'General',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PDFs table
CREATE TABLE IF NOT EXISTS pdfs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  subject VARCHAR(100) NOT NULL,
  author VARCHAR(255) DEFAULT '',
  price DECIMAL(10,2) DEFAULT 0,
  cover_image_url VARCHAR(500) DEFAULT '',
  file_url VARCHAR(500) DEFAULT '',
  pages_count INT DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  tags JSON DEFAULT NULL,
  downloads INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Colleges table
CREATE TABLE IF NOT EXISTS colleges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) DEFAULT '',
  type ENUM('Government', 'Private') DEFAULT 'Government',
  total_seats INT DEFAULT 0,
  tuition_fee_annual DECIMAL(12,2) DEFAULT 0,
  hostel_fee_annual DECIMAL(12,2) DEFAULT 0,
  other_charges DECIMAL(12,2) DEFAULT 0,
  official_website VARCHAR(500) DEFAULT '',
  contact_phone VARCHAR(20) DEFAULT '',
  established_year INT DEFAULT 0,
  accreditation VARCHAR(100) DEFAULT '',
  facilities JSON DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cutoffs table
CREATE TABLE IF NOT EXISTS cutoffs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  year INT NOT NULL,
  general_rank INT DEFAULT 999999,
  obc_rank INT DEFAULT 999999,
  sc_rank INT DEFAULT 999999,
  st_rank INT DEFAULT 999999,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pdf_id INT NOT NULL,
  razorpay_order_id VARCHAR(100),
  amount DECIMAL(10,2),
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pdf_id) REFERENCES pdfs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_pdf (user_id, pdf_id)
);

-- Indexes for performance
CREATE INDEX idx_cutoffs_college ON cutoffs(college_id);
CREATE INDEX idx_cutoffs_year ON cutoffs(year);
CREATE INDEX idx_cutoffs_ranks ON cutoffs(year, general_rank, obc_rank, sc_rank, st_rank);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_pdf ON purchases(pdf_id);

-- Seed PDFs
INSERT INTO pdfs (title, description, subject, author, price, is_free, pages_count, tags, cover_image_url) VALUES
('NEET Biology Master Guide 2025', 'Complete biology guide covering all NEET UG topics including Botany and Zoology with previous year questions.', 'Biology', 'Dr. Priya Sharma', 0, TRUE, 320, '["NEET", "Biology", "Botany", "Zoology"]', 'https://images.pexels.com/photos/4855428/pexels-photo-4855428.jpeg'),
('Organic Chemistry for NEET', 'Detailed organic chemistry notes with reaction mechanisms, named reactions and NEET-specific tricks.', 'Chemistry', 'Dr. Ramesh Kumar', 299, FALSE, 280, '["NEET", "Chemistry", "Organic"]', 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg'),
('Physics Formulas & Concepts', 'Quick revision formula sheet with concept explanations for all NEET Physics chapters.', 'Physics', 'Prof. Anil Singh', 0, TRUE, 150, '["NEET", "Physics", "Formulas"]', 'https://images.pexels.com/photos/714699/pexels-photo-714699.jpeg'),
('Human Anatomy Atlas', 'Detailed anatomical diagrams and explanations essential for MBBS first year students.', 'Anatomy', 'Dr. Meena Joshi', 499, FALSE, 450, '["MBBS", "Anatomy", "First Year"]', 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg'),
('Biochemistry Simplified', 'All biochemistry pathways explained simply with mnemonics for NEET PG preparation.', 'Biochemistry', 'Dr. Suresh Patel', 349, FALSE, 380, '["NEET PG", "Biochemistry", "MBBS"]', 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg'),
('NEET Previous Year Papers 2019-2024', '5 years of NEET UG previous year papers with detailed solutions and analysis.', 'Practice', 'MedPrep Team', 0, TRUE, 600, '["NEET", "Practice", "PYQ"]', 'https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg'),
('Pharmacology Quick Revision', 'High-yield pharmacology notes for NEET PG with drug classifications and mechanisms.', 'Pharmacology', 'Dr. Kavita Rao', 399, FALSE, 290, '["NEET PG", "Pharmacology", "MBBS"]', 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg'),
('Inorganic Chemistry Notes', 'Complete inorganic chemistry with periodic trends, coordination compounds and d-block elements.', 'Chemistry', 'Dr. Vikram Nair', 249, FALSE, 200, '["NEET", "Chemistry", "Inorganic"]', 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg')
ON DUPLICATE KEY UPDATE id = id;

-- Seed Colleges
INSERT INTO colleges (name, state, city, type, total_seats, tuition_fee_annual, hostel_fee_annual, established_year, accreditation, image_url) VALUES
('AIIMS New Delhi', 'Delhi', 'New Delhi', 'Government', 107, 1628, 10200, 1956, 'MCI/NMC', 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg'),
('JIPMER Puducherry', 'Puducherry', 'Puducherry', 'Government', 150, 0, 15000, 1823, 'MCI/NMC', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg'),
('AIIMS Mumbai', 'Maharashtra', 'Mumbai', 'Government', 100, 1628, 12000, 2018, 'MCI/NMC', 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg'),
('Christian Medical College Vellore', 'Tamil Nadu', 'Vellore', 'Private', 100, 35000, 40000, 1900, 'MCI/NMC', 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg'),
('Kasturba Medical College Manipal', 'Karnataka', 'Manipal', 'Private', 250, 1500000, 150000, 1953, 'MCI/NMC', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg'),
('Grant Medical College Mumbai', 'Maharashtra', 'Mumbai', 'Government', 250, 25000, 20000, 1845, 'MCI/NMC', 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg'),
('Maulana Azad Medical College Delhi', 'Delhi', 'New Delhi', 'Government', 250, 25000, 18000, 1958, 'MCI/NMC', 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg'),
('BHU Institute of Medical Sciences', 'Uttar Pradesh', 'Varanasi', 'Government', 100, 50000, 25000, 1960, 'MCI/NMC', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg'),
('Lady Hardinge Medical College', 'Delhi', 'New Delhi', 'Government', 200, 25000, 15000, 1916, 'MCI/NMC', 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg'),
('Sri Ramachandra Institute Chennai', 'Tamil Nadu', 'Chennai', 'Private', 150, 1200000, 120000, 1985, 'MCI/NMC', 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg'),
('AIIMS Jodhpur', 'Rajasthan', 'Jodhpur', 'Government', 100, 1628, 10000, 2012, 'MCI/NMC', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg'),
('AIIMS Bhopal', 'Madhya Pradesh', 'Bhopal', 'Government', 100, 1628, 10000, 2012, 'MCI/NMC', 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg'),
('AIIMS Rishikesh', 'Uttarakhand', 'Rishikesh', 'Government', 100, 1628, 10000, 2012, 'MCI/NMC', 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg'),
('Madras Medical College', 'Tamil Nadu', 'Chennai', 'Government', 250, 10000, 8000, 1835, 'MCI/NMC', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg'),
('KEM Hospital Mumbai', 'Maharashtra', 'Mumbai', 'Government', 200, 25000, 20000, 1926, 'MCI/NMC', 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg')
ON DUPLICATE KEY UPDATE id = id;

-- Seed Cutoffs
INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 50, 200, 600, 800 FROM colleges WHERE name = 'AIIMS New Delhi'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2023, 70, 250, 700, 900 FROM colleges WHERE name = 'AIIMS New Delhi'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 200, 600, 1500, 2000 FROM colleges WHERE name = 'JIPMER Puducherry'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2023, 250, 700, 1800, 2500 FROM colleges WHERE name = 'JIPMER Puducherry'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 500, 1200, 3000, 4000 FROM colleges WHERE name = 'AIIMS Mumbai'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 2500, 5000, 12000, 18000 FROM colleges WHERE name = 'Maulana Azad Medical College Delhi'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 3000, 6000, 14000, 20000 FROM colleges WHERE name = 'Grant Medical College Mumbai'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 800, 2000, 5000, 7000 FROM colleges WHERE name = 'Lady Hardinge Medical College'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 5000, 10000, 22000, 30000 FROM colleges WHERE name = 'BHU Institute of Medical Sciences'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 1200, 3000, 8000, 12000 FROM colleges WHERE name = 'AIIMS Jodhpur'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 1500, 3500, 9000, 13000 FROM colleges WHERE name = 'AIIMS Bhopal'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 1800, 4000, 10000, 15000 FROM colleges WHERE name = 'AIIMS Rishikesh'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 4000, 8000, 18000, 25000 FROM colleges WHERE name = 'Madras Medical College'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 4500, 9000, 20000, 28000 FROM colleges WHERE name = 'KEM Hospital Mumbai'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 15000, 25000, 50000, 70000 FROM colleges WHERE name = 'Christian Medical College Vellore'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 30000, 50000, 80000, 100000 FROM colleges WHERE name = 'Kasturba Medical College Manipal'
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 20000, 35000, 60000, 80000 FROM colleges WHERE name = 'Sri Ramachandra Institute Chennai'
ON DUPLICATE KEY UPDATE id = id;

-- Verification query
SELECT 'Database setup complete!' AS status;
SELECT COUNT(*) AS pdfs_count FROM pdfs;
SELECT COUNT(*) AS colleges_count FROM colleges;
SELECT COUNT(*) AS cutoffs_count FROM cutoffs;