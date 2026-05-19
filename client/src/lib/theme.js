export const SUBJECT_COLORS = [
    { value: 'violet', bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-800', dot: 'bg-violet-500', solid: 'bg-violet-600' },
    { value: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500', solid: 'bg-emerald-600' },
    { value: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-400', solid: 'bg-orange-500' },
    { value: 'rose', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', dot: 'bg-rose-400', solid: 'bg-rose-500' },
    { value: 'teal', bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', dot: 'bg-teal-500', solid: 'bg-teal-600' },
    { value: 'amber', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-400', solid: 'bg-amber-500' },
    { value: 'cyan', bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', dot: 'bg-cyan-500', solid: 'bg-cyan-600' },
    { value: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-400', solid: 'bg-pink-500' },
]

export const getSubjectColor = (value) => SUBJECT_COLORS.find(c => c.value === value) || SUBJECT_COLORS[0]