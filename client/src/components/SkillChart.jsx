import { BarChart3 } from 'lucide-react'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/text-link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { safeArray } from '@/lib/utils'

/* One blue, one navy, then the semantic weights. Never a rainbow. */
const palette = ['#1c69d4', '#1a2129', '#0653b6', '#6b6b6b', '#262e38', '#9a9a9a']
const gridColor = 'var(--color-hairline)'
const tickColor = 'var(--color-muted)'

function normalizeSkills(skills) {
  return safeArray(skills).map((item, index) => {
    if (typeof item === 'string') return { name: item, value: 70, category: 'Core skills' }
    const value = Number(item?.level || item?.proficiency || item?.score || item?.confidence)
    return {
      name: item?.name || item?.skill || `Skill ${index + 1}`,
      value: Number.isFinite(value) ? Math.max(0, Math.min(100, value > 1 ? value : value * 100)) : 70,
      category: item?.category || 'Core skills',
    }
  })
}

export function SkillChart({ skills = [], categories = [] }) {
  const data = useMemo(() => normalizeSkills(skills), [skills])
  const categoryData = useMemo(
    () => safeArray(categories).map((item, index) => ({ category: item?.name || item?.label || `Area ${index + 1}`, score: Number(item?.score || item?.value || 0) })).filter((item) => Number.isFinite(item.score)),
    [categories],
  )

  if (!data.length && !categoryData.length) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-8 w-8 text-muted-soft" aria-hidden="true" />
          <Eyebrow tone="muted" className="mt-4">No skill visualization yet</Eyebrow>
          <p className="mt-3 max-w-sm text-[14px] leading-[1.55] font-light text-muted">The analysis did not return enough structured skill data to chart.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 sm:p-7">
      <Tabs defaultValue="skills">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow as="p">Signal map</Eyebrow>
            <h2 className="mt-3 text-[20px] leading-[1.3] font-bold">Detected skills and coverage</h2>
            <p className="mt-2 text-[14px] leading-[1.55] font-light text-muted">A visual read of the evidence returned by the analysis.</p>
          </div>
          <TabsList>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="radar">Coverage</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="skills" className="mt-6">
          <div className="h-72 w-full" aria-label="Bar chart showing detected skills and confidence">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--color-surface-soft)' }} contentStyle={{ border: '1px solid var(--color-hairline-strong)', borderRadius: 0, background: 'var(--color-canvas)', fontSize: 12 }} formatter={(value) => [`${value}%`, 'Signal']} />
                <Bar dataKey="value" radius={0} barSize={16}>
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-6 grid gap-px border border-hairline bg-hairline sm:grid-cols-2" aria-label="Accessible skill list">
            {data.slice(0, 8).map((item) => (
              <div key={item.name} className="flex items-center justify-between bg-canvas px-4 py-3 text-[13px]">
                <dt className="truncate text-body">{item.name}</dt>
                <dd className="font-bold text-primary tabular-nums">{item.value}%</dd>
              </div>
            ))}
          </dl>
        </TabsContent>

        <TabsContent value="radar" className="mt-6">
          {categoryData.length ? (
            <div className="h-72 w-full" aria-label="Radar chart showing CV coverage by category">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={categoryData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke={gridColor} />
                  <PolarAngleAxis dataKey="category" tick={{ fill: tickColor, fontSize: 11 }} />
                  <Radar name="Coverage" dataKey="score" stroke="#1c69d4" fill="#1c69d4" fillOpacity={0.16} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="border border-dashed border-hairline-strong p-8 text-center text-[14px] font-light text-muted">Category coverage was not included in this analysis.</div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
