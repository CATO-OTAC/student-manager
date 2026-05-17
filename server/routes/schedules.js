import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

// Get all student schedules WITH their changes (for Sessions page)
router.get('/', async (req, res) => {
  const [schedRes, changesRes] = await Promise.all([
    supabase.from('student_schedules').select('*'),
    supabase.from('schedule_changes').select('*'),
  ])
  if (schedRes.error) return res.status(500).json({ error: schedRes.error.message })
  if (changesRes.error) return res.status(500).json({ error: changesRes.error.message })

  const result = (schedRes.data || []).map(s => ({
    ...s,
    changes: (changesRes.data || []).filter(c => c.student_id === s.student_id),
  }))
  res.json(result)
})

// Specific DELETE route before generic /:studentId
router.delete('/change/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('schedule_changes').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

router.get('/:studentId', async (req, res) => {
  const { studentId } = req.params
  const [scheduleRes, changesRes] = await Promise.all([
    supabase.from('student_schedules').select('*').eq('student_id', studentId).maybeSingle(),
    supabase.from('schedule_changes').select('*').eq('student_id', studentId).order('start_date', { ascending: false }),
  ])
  if (scheduleRes.error) return res.status(500).json({ error: scheduleRes.error.message })
  if (changesRes.error) return res.status(500).json({ error: changesRes.error.message })
  res.json({ default_schedule: scheduleRes.data, changes: changesRes.data || [] })
})

router.post('/:studentId/default', async (req, res) => {
  const { studentId } = req.params
  const { schedule } = req.body
  const { data, error } = await supabase
    .from('student_schedules')
    .upsert({ student_id: studentId, schedule }, { onConflict: 'student_id' })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/:studentId/changes', async (req, res) => {
  const { studentId } = req.params
  const { change_type, start_date, duration_type, weeks, end_date, new_schedule, notes } = req.body

  let computedEndDate = null
  if (change_type === 'temporary') {
    if (duration_type === 'weeks' && weeks) {
      const d = new Date(start_date)
      d.setDate(d.getDate() + parseInt(weeks) * 7 - 1)
      computedEndDate = d.toISOString().split('T')[0]
    } else {
      computedEndDate = end_date || null
    }
  }

  const { data, error } = await supabase
    .from('schedule_changes')
    .insert([{ student_id: studentId, change_type, start_date, end_date: computedEndDate, new_schedule, notes: notes || null }])
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

export default router
