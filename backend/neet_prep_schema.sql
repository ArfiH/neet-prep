-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 27, 2026 at 07:08 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `neet_prep`
--

-- --------------------------------------------------------

--
-- Table structure for table `colleges`
--

CREATE TABLE `colleges` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `state` varchar(100) NOT NULL,
  `city` varchar(100) DEFAULT '',
  `type` enum('Government','Private') DEFAULT 'Government',
  `total_seats` int(11) DEFAULT 0,
  `tuition_fee_annual` decimal(12,2) DEFAULT 0.00,
  `hostel_fee_annual` decimal(12,2) DEFAULT 0.00,
  `other_charges` decimal(12,2) DEFAULT 0.00,
  `official_website` varchar(500) DEFAULT '',
  `contact_phone` varchar(20) DEFAULT '',
  `established_year` int(11) DEFAULT 0,
  `accreditation` varchar(100) DEFAULT '',
  `facilities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`facilities`)),
  `image_url` varchar(500) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `colleges`
--

INSERT INTO `colleges` (`id`, `name`, `state`, `city`, `type`, `total_seats`, `tuition_fee_annual`, `hostel_fee_annual`, `other_charges`, `official_website`, `contact_phone`, `established_year`, `accreditation`, `facilities`, `image_url`, `created_at`) VALUES
(1, 'AIIMS New Delhi', 'Delhi', 'New Delhi', 'Government', 107, 1628.00, 10200.00, 0.00, '', '', 1956, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg', '2026-04-27 15:38:25'),
(2, 'JIPMER Puducherry', 'Puducherry', 'Puducherry', 'Government', 150, 0.00, 15000.00, 0.00, '', '', 1823, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg', '2026-04-27 15:38:25'),
(3, 'AIIMS Mumbai', 'Maharashtra', 'Mumbai', 'Government', 100, 1628.00, 12000.00, 0.00, '', '', 2018, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg', '2026-04-27 15:38:25'),
(4, 'Christian Medical College Vellore', 'Tamil Nadu', 'Vellore', 'Private', 100, 35000.00, 40000.00, 0.00, '', '', 1900, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg', '2026-04-27 15:38:25'),
(5, 'Kasturba Medical College Manipal', 'Karnataka', 'Manipal', 'Private', 250, 1500000.00, 150000.00, 0.00, '', '', 1953, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg', '2026-04-27 15:38:25'),
(6, 'Grant Medical College Mumbai', 'Maharashtra', 'Mumbai', 'Government', 250, 25000.00, 20000.00, 0.00, '', '', 1845, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg', '2026-04-27 15:38:25'),
(7, 'Maulana Azad Medical College Delhi', 'Delhi', 'New Delhi', 'Government', 250, 25000.00, 18000.00, 0.00, '', '', 1958, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg', '2026-04-27 15:38:25'),
(8, 'BHU Institute of Medical Sciences', 'Uttar Pradesh', 'Varanasi', 'Government', 100, 50000.00, 25000.00, 0.00, '', '', 1960, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg', '2026-04-27 15:38:25'),
(9, 'Lady Hardinge Medical College', 'Delhi', 'New Delhi', 'Government', 200, 25000.00, 15000.00, 0.00, '', '', 1916, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg', '2026-04-27 15:38:25'),
(10, 'Sri Ramachandra Institute Chennai', 'Tamil Nadu', 'Chennai', 'Private', 150, 1200000.00, 120000.00, 0.00, '', '', 1985, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg', '2026-04-27 15:38:25'),
(11, 'AIIMS Jodhpur', 'Rajasthan', 'Jodhpur', 'Government', 100, 1628.00, 10000.00, 0.00, '', '', 2012, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg', '2026-04-27 15:38:25'),
(12, 'AIIMS Bhopal', 'Madhya Pradesh', 'Bhopal', 'Government', 100, 1628.00, 10000.00, 0.00, '', '', 2012, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg', '2026-04-27 15:38:25'),
(13, 'AIIMS Rishikesh', 'Uttarakhand', 'Rishikesh', 'Government', 100, 1628.00, 10000.00, 0.00, '', '', 2012, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg', '2026-04-27 15:38:25'),
(14, 'Madras Medical College', 'Tamil Nadu', 'Chennai', 'Government', 250, 10000.00, 8000.00, 0.00, '', '', 1835, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg', '2026-04-27 15:38:25'),
(15, 'KEM Hospital Mumbai', 'Maharashtra', 'Mumbai', 'Government', 200, 25000.00, 20000.00, 0.00, '', '', 1926, 'MCI/NMC', NULL, 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg', '2026-04-27 15:38:25');

-- --------------------------------------------------------

--
-- Table structure for table `cutoffs`
--

CREATE TABLE `cutoffs` (
  `id` int(11) NOT NULL,
  `college_id` int(11) NOT NULL,
  `YEAR` int(11) NOT NULL,
  `general_rank` int(11) DEFAULT 999999,
  `obc_rank` int(11) DEFAULT 999999,
  `sc_rank` int(11) DEFAULT 999999,
  `st_rank` int(11) DEFAULT 999999,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cutoffs`
--

INSERT INTO `cutoffs` (`id`, `college_id`, `YEAR`, `general_rank`, `obc_rank`, `sc_rank`, `st_rank`, `created_at`) VALUES
(1, 1, 2024, 50, 200, 600, 800, '2026-04-27 15:42:32'),
(2, 1, 2023, 70, 250, 700, 900, '2026-04-27 16:18:46'),
(3, 2, 2024, 200, 600, 1500, 2000, '2026-04-27 16:18:46'),
(4, 2, 2023, 250, 700, 1800, 2500, '2026-04-27 16:18:46'),
(5, 3, 2024, 500, 1200, 3000, 4000, '2026-04-27 16:18:46'),
(6, 7, 2024, 2500, 5000, 12000, 18000, '2026-04-27 16:18:46'),
(7, 6, 2024, 3000, 6000, 14000, 20000, '2026-04-27 16:18:47'),
(8, 9, 2024, 800, 2000, 5000, 7000, '2026-04-27 16:18:47'),
(9, 8, 2024, 5000, 10000, 22000, 30000, '2026-04-27 16:18:47'),
(10, 11, 2024, 1200, 3000, 8000, 12000, '2026-04-27 16:18:47'),
(11, 12, 2024, 1500, 3500, 9000, 13000, '2026-04-27 16:18:47'),
(12, 13, 2024, 1800, 4000, 10000, 15000, '2026-04-27 16:18:47'),
(13, 14, 2024, 4000, 8000, 18000, 25000, '2026-04-27 16:18:47'),
(14, 15, 2024, 4500, 9000, 20000, 28000, '2026-04-27 16:18:47'),
(15, 4, 2024, 15000, 25000, 50000, 70000, '2026-04-27 16:18:47'),
(16, 5, 2024, 30000, 50000, 80000, 100000, '2026-04-27 16:18:47'),
(17, 10, 2024, 20000, 35000, 60000, 80000, '2026-04-27 16:18:47');

-- --------------------------------------------------------

--
-- Table structure for table `pdfs`
--

CREATE TABLE `pdfs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT '',
  `subject` varchar(100) NOT NULL,
  `author` varchar(255) DEFAULT '',
  `price` decimal(10,2) DEFAULT 0.00,
  `cover_image_url` varchar(500) DEFAULT '',
  `file_url` varchar(500) DEFAULT '',
  `pages_count` int(11) DEFAULT 0,
  `is_free` tinyint(1) DEFAULT 0,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `downloads` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pdfs`
--

INSERT INTO `pdfs` (`id`, `title`, `description`, `subject`, `author`, `price`, `cover_image_url`, `file_url`, `pages_count`, `is_free`, `tags`, `downloads`, `created_at`, `updated_at`) VALUES
(1, 'NEET Biology Master Guide 2025', 'Complete biology guide covering all NEET UG topics including Botany and Zoology with previous year questions.', 'Biology', 'Dr. Priya Sharma', 0.00, 'https://images.pexels.com/photos/4855428/pexels-photo-4855428.jpeg', '', 320, 1, '[\"NEET\", \"Biology\", \"Botany\", \"Zoology\"]', 0, '2026-04-27 15:38:24', '2026-04-27 15:38:24'),
(2, 'Organic Chemistry for NEET', 'Detailed organic chemistry notes with reaction mechanisms, named reactions and NEET-specific tricks.', 'Chemistry', 'Dr. Ramesh Kumar', 299.00, 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg', '', 280, 0, '[\"NEET\", \"Chemistry\", \"Organic\"]', 0, '2026-04-27 15:38:24', '2026-04-27 15:38:24'),
(3, 'Physics Formulas & Concepts', 'Quick revision formula sheet with concept explanations for all NEET Physics chapters.', 'Physics', 'Prof. Anil Singh', 0.00, 'https://images.pexels.com/photos/714699/pexels-photo-714699.jpeg', 'https://lclrcpevjcqejdkymqmu.supabase.co/storage/v1/object/public/neet-zyme-pdfs-dev-admin/physics-formula-sheet-resonance.pdf', 150, 1, '[\"NEET\", \"Physics\", \"Formulas\"]', 19, '2026-04-27 15:38:24', '2026-04-27 16:59:45'),
(4, 'Human Anatomy Atlas', 'Detailed anatomical diagrams and explanations essential for MBBS first year students.', 'Anatomy', 'Dr. Meena Joshi', 499.00, 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg', '', 450, 0, '[\"MBBS\", \"Anatomy\", \"First Year\"]', 2, '2026-04-27 15:38:24', '2026-04-27 16:59:45'),
(5, 'Biochemistry Simplified', 'All biochemistry pathways explained simply with mnemonics for NEET PG preparation.', 'Biochemistry', 'Dr. Suresh Patel', 349.00, 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg', '', 380, 0, '[\"NEET PG\", \"Biochemistry\", \"MBBS\"]', 0, '2026-04-27 15:38:24', '2026-04-27 15:38:24'),
(6, 'NEET Previous Year Papers 2019-2024', '5 years of NEET UG previous year papers with detailed solutions and analysis.', 'Practice', 'MedPrep Team', 0.00, 'https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg', '', 600, 1, '[\"NEET\", \"Practice\", \"PYQ\"]', 0, '2026-04-27 15:38:24', '2026-04-27 15:38:24'),
(7, 'Pharmacology Quick Revision', 'High-yield pharmacology notes for NEET PG with drug classifications and mechanisms.', 'Pharmacology', 'Dr. Kavita Rao', 399.00, 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg', '', 290, 0, '[\"NEET PG\", \"Pharmacology\", \"MBBS\"]', 0, '2026-04-27 15:38:24', '2026-04-27 15:38:24'),
(8, 'Inorganic Chemistry Notes', 'Complete inorganic chemistry with periodic trends, coordination compounds and d-block elements.', 'Chemistry', 'Dr. Vikram Nair', 249.00, 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg', '', 200, 0, '[\"NEET\", \"Chemistry\", \"Inorganic\"]', 0, '2026-04-27 15:38:24', '2026-04-27 15:38:24');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `pdf_id` int(11) NOT NULL,
  `razorpay_order_id` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `STATUS` enum('pending','completed','failed') DEFAULT 'pending',
  `purchased_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `NAME` varchar(255) DEFAULT NULL,
  `neet_rank` int(11) DEFAULT NULL,
  `category` enum('General','OBC','SC','ST') DEFAULT 'General',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `colleges`
--
ALTER TABLE `colleges`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cutoffs`
--
ALTER TABLE `cutoffs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cutoff` (`college_id`,`YEAR`),
  ADD KEY `idx_cutoffs_college` (`college_id`),
  ADD KEY `idx_cutoffs_year` (`YEAR`),
  ADD KEY `idx_cutoffs_ranks` (`YEAR`,`general_rank`,`obc_rank`,`sc_rank`,`st_rank`);

--
-- Indexes for table `pdfs`
--
ALTER TABLE `pdfs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_pdf` (`user_id`,`pdf_id`),
  ADD KEY `idx_purchases_user` (`user_id`),
  ADD KEY `idx_purchases_pdf` (`pdf_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `colleges`
--
ALTER TABLE `colleges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `cutoffs`
--
ALTER TABLE `cutoffs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `pdfs`
--
ALTER TABLE `pdfs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cutoffs`
--
ALTER TABLE `cutoffs`
  ADD CONSTRAINT `cutoffs_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`pdf_id`) REFERENCES `pdfs` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
