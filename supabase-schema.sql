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
