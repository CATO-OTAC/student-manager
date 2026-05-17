import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

// ── Timetable ────────────────────────────────────────────────────────────────
router.get('/timetable', async (req, res) => {
  const { data, error } = await supabase
    .from('school_timetable').select('*').order('day').order('start_time')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/timetable', async (req, res) => {
  const { day, start_time, end_time, subject, room, teacher, color } = req.body
  const { data, error } = await supabase
    .from('school_timetable')
    .insert([{ day, start_time, end_time, subject, room, teacher, color: color || 'violet' }])
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.put('/timetable/:id', async (req, res) => {
  const { id } = req.params
  const { day, start_time, end_time, subject, room, teacher, color } = req.body
  const { data, error } = await supabase
    .from('school_timetable')
    .update({ day, start_time, end_time, subject, room, teacher, color })
    .eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/timetable/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('school_timetable').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

// ── Homework ─────────────────────────────────────────────────────────────────
router.get('/homework', async (req, res) => {
  const { data, error } = await supabase
    .from('homework').select('*')
    .order('done').order('due_date', { nullsFirst: false }).order('created_at')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/homework', async (req, res) => {
  const { subject, title, due_date, priority, notes } = req.body
  const { data, error } = await supabase
    .from('homework')
    .insert([{ subject, title, due_date: due_date || null, priority: priority || 'normal', notes }])
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.put('/homework/:id', async (req, res) => {
  const { id } = req.params
  const fields = req.body
  const { data, error } = await supabase
    .from('homework').update(fields).eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/homework/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('homework').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

// ── Exams ────────────────────────────────────────────────────────────────────
router.get('/exams', async (req, res) => {
  const { data, error } = await supabase
    .from('exams').select('*').order('exam_date').order('start_time', { nullsFirst: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/exams', async (req, res) => {
  const { subject, exam_date, start_time, location, notes } = req.body
  const { data, error } = await supabase
    .from('exams')
    .insert([{ subject, exam_date, start_time: start_time || null, location, notes }])
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.put('/exams/:id', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('exams').update(req.body).eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/exams/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('exams').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

export default router
