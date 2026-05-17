import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('classes').select('*').order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { name } = req.body
  const { data, error } = await supabase
    .from('classes')
    .insert([{ name }])
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name } = req.body
  const { data, error } = await supabase
    .from('classes')
    .update({ name })
    .eq('id', id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

export default router
