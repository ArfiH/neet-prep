/*
  # Medical Student App Schema

  ## New Tables
  1. `pdfs` - PDF study materials (free and paid)
     - id, title, description, subject, author, price (0 = free), cover_image_url, file_url, pages_count, is_free, tags
  2. `colleges` - Medical colleges in India
     - id, name, state, city, type (Government/Private), total_seats, tuition_fee_annual, hostel_fee_annual, website, established_year
  3. `cutoffs` - NEET cutoffs per college per year per category
     - id, college_id, year, general_rank, obc_rank, sc_rank, st_rank
  4. `purchases` - User PDF purchases
     - id, user_id, pdf_id, purchased_at, expires_at

  ## Security
  - RLS enabled on all tables
  - PDFs and colleges are publicly readable
  - Purchases restricted to owning user
*/

-- PDFs table
CREATE TABLE IF NOT EXISTS pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  subject text NOT NULL,
  author text DEFAULT '',
  price decimal(10,2) DEFAULT 0,
  cover_image_url text DEFAULT '',
  file_url text DEFAULT '',
  pages_count int DEFAULT 0,
  is_free boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  downloads int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pdfs"
  ON pdfs FOR SELECT
  TO anon, authenticated
  USING (true);

-- Colleges table
CREATE TABLE IF NOT EXISTS colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  city text DEFAULT '',
  type text DEFAULT 'Government',
  total_seats int DEFAULT 0,
  tuition_fee_annual decimal(12,2) DEFAULT 0,
  hostel_fee_annual decimal(12,2) DEFAULT 0,
  other_charges decimal(12,2) DEFAULT 0,
  official_website text DEFAULT '',
  contact_phone text DEFAULT '',
  established_year int DEFAULT 0,
  accreditation text DEFAULT '',
  facilities text[] DEFAULT '{}',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read colleges"
  ON colleges FOR SELECT
  TO anon, authenticated
  USING (true);

-- Cutoffs table
CREATE TABLE IF NOT EXISTS cutoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  year int NOT NULL,
  general_rank int DEFAULT 999999,
  obc_rank int DEFAULT 999999,
  sc_rank int DEFAULT 999999,
  st_rank int DEFAULT 999999,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cutoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cutoffs"
  ON cutoffs FOR SELECT
  TO anon, authenticated
  USING (true);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_id uuid NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
  purchased_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 year'),
  UNIQUE(user_id, pdf_id)
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Seed PDFs
INSERT INTO pdfs (title, description, subject, author, price, is_free, pages_count, tags, cover_image_url) VALUES
  ('NEET Biology Master Guide 2025', 'Complete biology guide covering all NEET UG topics including Botany and Zoology with previous year questions.', 'Biology', 'Dr. Priya Sharma', 0, true, 320, ARRAY['NEET', 'Biology', 'Botany', 'Zoology'], 'https://images.pexels.com/photos/4855428/pexels-photo-4855428.jpeg'),
  ('Organic Chemistry for NEET', 'Detailed organic chemistry notes with reaction mechanisms, named reactions and NEET-specific tricks.', 'Chemistry', 'Dr. Ramesh Kumar', 299, false, 280, ARRAY['NEET', 'Chemistry', 'Organic'], 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg'),
  ('Physics Formulas & Concepts', 'Quick revision formula sheet with concept explanations for all NEET Physics chapters.', 'Physics', 'Prof. Anil Singh', 0, true, 150, ARRAY['NEET', 'Physics', 'Formulas'], 'https://images.pexels.com/photos/714699/pexels-photo-714699.jpeg'),
  ('Human Anatomy Atlas', 'Detailed anatomical diagrams and explanations essential for MBBS first year students.', 'Anatomy', 'Dr. Meena Joshi', 499, false, 450, ARRAY['MBBS', 'Anatomy', 'First Year'], 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg'),
  ('Biochemistry Simplified', 'All biochemistry pathways explained simply with mnemonics for NEET PG preparation.', 'Biochemistry', 'Dr. Suresh Patel', 349, false, 380, ARRAY['NEET PG', 'Biochemistry', 'MBBS'], 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg'),
  ('NEET Previous Year Papers 2019-2024', '5 years of NEET UG previous year papers with detailed solutions and analysis.', 'Practice', 'MedPrep Team', 0, true, 600, ARRAY['NEET', 'Practice', 'PYQ'], 'https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg'),
  ('Pharmacology Quick Revision', 'High-yield pharmacology notes for NEET PG with drug classifications and mechanisms.', 'Pharmacology', 'Dr. Kavita Rao', 399, false, 290, ARRAY['NEET PG', 'Pharmacology', 'MBBS'], 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg'),
  ('Inorganic Chemistry Notes', 'Complete inorganic chemistry with periodic trends, coordination compounds and d-block elements.', 'Chemistry', 'Dr. Vikram Nair', 249, false, 200, ARRAY['NEET', 'Chemistry', 'Inorganic'], 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg')
ON CONFLICT DO NOTHING;

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
ON CONFLICT DO NOTHING;

-- Seed Cutoffs (using subqueries to get college IDs)
INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 50, 200, 600, 800 FROM colleges WHERE name = 'AIIMS New Delhi'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2023, 70, 250, 700, 900 FROM colleges WHERE name = 'AIIMS New Delhi'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 200, 600, 1500, 2000 FROM colleges WHERE name = 'JIPMER Puducherry'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2023, 250, 700, 1800, 2500 FROM colleges WHERE name = 'JIPMER Puducherry'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 500, 1200, 3000, 4000 FROM colleges WHERE name = 'AIIMS Mumbai'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 2500, 5000, 12000, 18000 FROM colleges WHERE name = 'Maulana Azad Medical College Delhi'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 3000, 6000, 14000, 20000 FROM colleges WHERE name = 'Grant Medical College Mumbai'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 800, 2000, 5000, 7000 FROM colleges WHERE name = 'Lady Hardinge Medical College'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 5000, 10000, 22000, 30000 FROM colleges WHERE name = 'BHU Institute of Medical Sciences'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 1200, 3000, 8000, 12000 FROM colleges WHERE name = 'AIIMS Jodhpur'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 1500, 3500, 9000, 13000 FROM colleges WHERE name = 'AIIMS Bhopal'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 1800, 4000, 10000, 15000 FROM colleges WHERE name = 'AIIMS Rishikesh'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 4000, 8000, 18000, 25000 FROM colleges WHERE name = 'Madras Medical College'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 4500, 9000, 20000, 28000 FROM colleges WHERE name = 'KEM Hospital Mumbai'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 15000, 25000, 50000, 70000 FROM colleges WHERE name = 'Christian Medical College Vellore'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 30000, 50000, 80000, 100000 FROM colleges WHERE name = 'Kasturba Medical College Manipal'
ON CONFLICT DO NOTHING;

INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank)
SELECT id, 2024, 20000, 35000, 60000, 80000 FROM colleges WHERE name = 'Sri Ramachandra Institute Chennai'
ON CONFLICT DO NOTHING;
