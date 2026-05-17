import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { name, class_name, fee_per_session, parent_name, parent_phone } = req.body
  const { data, error } = await supabase
    .from('students')
    .insert([{ name, class_name, fee_per_session: fee_per_session || 0, parent_name, parent_phone }])
    .select('*')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name, class_name, fee_per_session, parent_name, parent_phone } = req.body
  const { data, error } = await supabase
    .from('students')
    .update({ name, class_name, fee_per_session: fee_per_session || 0, parent_name, parent_phone })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

export default router
