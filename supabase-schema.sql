-- Chạy toàn bộ script này trong Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Không còn bảng classes - lớp học được lưu trực tiếp vào students (Lớp 1 → Lớp 12)

CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  class_name VARCHAR(50),             -- "Lớp 1", "Lớp 2", ..., "Lớp 12"
  fee_per_session INTEGER NOT NULL DEFAULT 0,
  parent_name VARCHAR(200),
  parent_phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE monthly_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year SMALLINT NOT NULL,
  session_count INTEGER NOT NULL DEFAULT 0,
  amount INTEGER NOT NULL DEFAULT 0,
  dates JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, month, year)
);

-- schedule: [{day: 1, start_time: "19:00", end_time: "21:00"}, ...]
-- day: 1=Thứ Hai, 2=Thứ Ba, ..., 6=Thứ Bảy, 7=Chủ Nhật
CREATE TABLE student_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  schedule JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

CREATE TABLE schedule_changes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('temporary', 'permanent')),
  start_date DATE NOT NULL,
  end_date DATE,
  new_schedule JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Học kỳ (Semesters)
CREATE TABLE IF NOT EXISTS semesters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng lưu thời khóa biểu học tập (có thời hạn áp dụng)
CREATE TABLE school_timetable (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject VARCHAR(200) NOT NULL,
  day SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 7),
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  room VARCHAR(100),
  teacher VARCHAR(200),
  color VARCHAR(50) DEFAULT 'violet',
  start_date DATE,
  end_date DATE,
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng lưu lịch thi
CREATE TABLE exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject VARCHAR(200) NOT NULL,
  exam_date DATE NOT NULL,
  start_time VARCHAR(10),
  location VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng lưu bài tập về nhà
CREATE TABLE homework (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject VARCHAR(200) NOT NULL,
  title VARCHAR(300) NOT NULL,
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'normal',
  notes TEXT,
  done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm semester_id vào bảng student_schedules hiện tại
ALTER TABLE student_schedules ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE;
ALTER TABLE student_schedules DROP CONSTRAINT IF EXISTS student_schedules_student_id_key;
ALTER TABLE student_schedules DROP CONSTRAINT IF EXISTS student_schedules_student_id_semester_id_key;
ALTER TABLE student_schedules ADD CONSTRAINT student_schedules_student_id_semester_id_key UNIQUE(student_id, semester_id);

-- Tắt Row Level Security (RLS) do ứng dụng dùng cho mục đích cá nhân, không có Authentication
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_changes DISABLE ROW LEVEL SECURITY;
ALTER TABLE semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_timetable DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE homework DISABLE ROW LEVEL SECURITY;
