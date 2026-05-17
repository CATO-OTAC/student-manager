import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

router.get('/', async (req, res) => {
  const { month, year } = req.query
  let query = supabase
    .from('monthly_sessions')
    .select('*, students(id, name, fee_per_session, class_name)')

  if (month && year) {
    query = query.eq('month', parseInt(month)).eq('year', parseInt(year))
  } else if (year && !month) {
    query = query.eq('year', parseInt(year))
  }

  const { data, error } = await query.order('created_at')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/bulk', async (req, res) => {
  const { sessions } = req.body
  const processed = sessions.map(s => ({
    student_id: s.student_id,
    month: s.month,
    year: s.year,
    session_count: Array.isArray(s.dates) && s.dates.length > 0 ? s.dates.length : (s.session_count || 0),
    amount: s.amount,
    dates: s.dates || [],
    notes: s.notes || null,
  }))
  const { data, error } = await supabase
    .from('monthly_sessions')
    .upsert(processed, { onConflict: 'student_id,month,year' })
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('monthly_sessions').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

export default router
