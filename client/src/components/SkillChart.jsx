import { BarChart3, Radar as RadarIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { safeArray } from '@/lib/utils'

const palette = ['#2563eb', '#06b6d4', '#0f9f91', '#d97706', '#64748b', '#7c3aed']

function normalizeSkills(skills) {
  return safeArray(skills).map((item, index) => {
    if (typeof item === 'string') return { name: item, value: 70, category: 'Core skills' }
    const value = Number(item?.level || item?.proficiency || item?.score || item?.confidence)
    return { name: item?.name || item?.skill || `Skill ${index + 1}`, value: Number.isFinite(value) ? Math.max(0, Math.min(100, value > 1 ? value : value * 100)) : 70, category: item?.category || 'Core skills' }
  })
}

export function SkillChart({ skills = [], categories = [] }) {
  const data = useMemo(() => normalizeSkills(skills), [skills])
  const categoryData = useMemo(() => safeArray(categories).map((item, index) => ({ category: item?.name || item?.label || `Area ${index + 1}`, score: Number(item?.score || item?.value || 0) })).filter((item) => Number.isFinite(item.score)), [categories])
  if (!data.length && !categoryData.length) return <Card className="p-6"><div className="flex flex-col items-center justify-center py-12 text-center"><BarChart3 className="h-8 w-8 text-muted-foreground/50" /><p className="mt-3 font-medium text-foreground">No skill visualization yet</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">The analysis did not return enough structured skill data to chart.</p></div></Card>
  return <Card className="p-5 sm:p-6"><Tabs defaultValue="skills"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-lg font-semibold">Signal map</p><p className="mt-1 text-sm text-muted-foreground">A visual read of the evidence returned by analysis.</p></div><TabsList><TabsTrigger value="skills"><BarChart3 className="h-3.5 w-3.5" /> Skills</TabsTrigger><TabsTrigger value="radar"><RadarIcon className="h-3.5 w-3.5" /> Coverage</TabsTrigger></TabsList></div><TabsContent value="skills" className="mt-5"><div className="h-72 w-full" aria-label="Bar chart showing detected skills and confidence"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}><CartesianGrid stroke="hsl(215 25% 88%)" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={110} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} formatter={(value) => [`${value}%`, 'Signal']} /><Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={18}>{data.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Bar></BarChart></ResponsiveContainer></div><div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Accessible skill list">{data.slice(0, 8).map((item) => <div key={item.name} className="flex items-center justify-between rounded-lg bg-muted/45 px-3 py-2 text-xs"><span className="text-foreground/80">{item.name}</span><span className="font-semibold text-primary">{item.value}%</span></div>)}</div></TabsContent><TabsContent value="radar" className="mt-5">{categoryData.length ? <div className="h-72 w-full" aria-label="Radar chart showing CV coverage by category"><ResponsiveContainer width="100%" height="100%"><RadarChart data={categoryData} cx="50%" cy="50%" outerRadius="70%"><PolarGrid stroke="hsl(215 25% 88%)" /><PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 11 }} /><Radar name="Coverage" dataKey="score" stroke="#2563eb" fill="#06b6d4" fillOpacity={0.24} /></RadarChart></ResponsiveContainer></div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Category coverage was not included in this analysis.</div>}</TabsContent></Tabs></Card>
}
