import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, GitCompareArrows, History as HistoryIcon, RefreshCw, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AnalysisComparison } from '@/components/AnalysisComparison'
import { EmptyState } from '@/components/EmptyState'
import { JobMatchCard } from '@/components/JobMatchCard'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip, ChipRow } from '@/components/ui/chip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { analysisApi, matchApi } from '@/services/api'
import { formatDate, formatPercent, getErrorMessage, getRecordId, getScore, safeArray, scoreMeta } from '@/lib/utils'
import { normalizeAnalysis, normalizeComparisonPayload, normalizeList, normalizeMatch } from '@/lib/normalize'

const scoreFloor = 80

function itemLabel(item, type) {
  if (type === 'matches') return item?.job?.title || item?.jobTitle || item?.job?.company || item?.company || 'Untitled match'
  return item?.resumeName || item?.resume?.originalName || item?.resume?.name || item?.name || 'Untitled analysis'
}

function searchText(item, type) {
  const parts = [itemLabel(item, type)]
  if (type === 'matches') {
    parts.push(item?.job?.company, item?.job?.employmentType, item?.resume?.name, item?.resume?.originalName)
    parts.push(...safeArray(item?.matchingSkills))
  } else {
    parts.push(item?.profile?.fullName, item?.profile?.name, item?.summary)
  }
  return parts.filter(Boolean).join(' ').toLowerCase()
}

function sortItems(items, sort) {
  return [...items].sort((first, second) => {
    if (sort === 'oldest') return new Date(first.createdAt || 0) - new Date(second.createdAt || 0)
    if (sort === 'score-high') return getScore(second.score) - getScore(first.score)
    if (sort === 'score-low') return getScore(first.score) - getScore(second.score)
    return new Date(second.createdAt || 0) - new Date(first.createdAt || 0)
  })
}

export function History() {
  const [activeTab, setActiveTab] = useState('analyses')
  const [analyses, setAnalyses] = useState([])
  const [matches, setMatches] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState([])
  const [comparison, setComparison] = useState(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const load = useCallback(async (query = '') => {
    setLoading(true)
    setError('')
    try {
      const params = query ? { search: query, limit: 50 } : { limit: 50 }
      const [analysisResponse, matchResponse] = await Promise.all([analysisApi.list(params), matchApi.list(params)])
      setAnalyses(normalizeList(analysisResponse, 'analyses').map(normalizeAnalysis).filter(Boolean))
      setMatches(normalizeList(matchResponse, 'matches').map(normalizeMatch).filter(Boolean))
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Your saved history could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(search)
  }, [load, search])

  const visibleAnalyses = useMemo(() => {
    const query = search.toLowerCase()
    const filtered = analyses
      .filter((item) => (query ? searchText(item, 'analyses').includes(query) : true))
      .filter((item) => filter === 'all' || (filter === 'high' ? getScore(item.score) >= scoreFloor : getScore(item.score) < scoreFloor))
    return sortItems(filtered, sort)
  }, [analyses, search, filter, sort])

  const visibleMatches = useMemo(() => {
    const query = search.toLowerCase()
    const filtered = matches
      .filter((item) => (query ? searchText(item, 'matches').includes(query) : true))
      .filter((item) => filter === 'all' || (filter === 'high' ? getScore(item.score) >= scoreFloor : getScore(item.score) < scoreFloor))
    return sortItems(filtered, sort)
  }, [matches, search, filter, sort])

  const toggleSelected = (id) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current)
  }

  const runComparison = async () => {
    if (selected.length !== 2) return
    setComparing(true)
    try {
      const response = await analysisApi.compare(selected)
      const first = analyses.find((item) => getRecordId(item) === selected[0]) || null
      const second = analyses.find((item) => getRecordId(item) === selected[1]) || null
      setComparison(normalizeComparisonPayload({ first: response?.first || first, second: response?.second || second, summary: response?.summary }))
      setCompareOpen(true)
    } catch (compareError) {
      toast.error(getErrorMessage(compareError, 'The comparison could not be generated.'))
    } finally {
      setComparing(false)
    }
  }

  const deleteRecord = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.type === 'analysis') {
        await analysisApi.remove(getRecordId(deleteTarget.item))
        setAnalyses((current) => current.filter((item) => getRecordId(item) !== getRecordId(deleteTarget.item)))
      } else {
        await matchApi.remove(getRecordId(deleteTarget.item))
        setMatches((current) => current.filter((item) => getRecordId(item) !== getRecordId(deleteTarget.item)))
      }
      toast.success('History item removed.')
      setDeleteTarget(null)
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, 'The item could not be removed.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="History" title="A record of your progress." description="Search, compare, and revisit the CV decisions you have made." action={<Button variant="outline" onClick={() => load(search)}><RefreshCw className="h-4 w-4" /> Refresh</Button>} />
      {error && (
        <Alert variant="destructive" className="mb-6">
          <HistoryIcon className="h-4 w-4" />
          <AlertTitle>History is unavailable</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => load(search)}>Try again</Button>
          </AlertDescription>
        </Alert>
      )}
      <Card className="mb-8 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted" aria-hidden="true" />
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by CV, role, company, or profile" className="pl-10" aria-label="Search history" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ChipRow role="group" aria-label="Filter by score">
              {[
                { value: 'all', label: 'All scores' },
                { value: 'high', label: `${scoreFloor}+ scores` },
                { value: 'low', label: `Below ${scoreFloor}` },
              ].map((option) => (
                <Chip key={option.value} active={filter === option.value} onClick={() => setFilter(option.value)}>
                  {option.label}
                </Chip>
              ))}
            </ChipRow>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Sort history"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="score-high">Highest score</SelectItem>
                <SelectItem value="score-low">Lowest score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {search && <p className="mt-4 border-t border-hairline pt-4 text-[13px] font-light text-muted">Filtering on the server for “{search}” and again locally, so both naming styles are covered.</p>}
      </Card>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="analyses">CV analyses <Badge variant="secondary" className="ml-1.5">{visibleAnalyses.length}</Badge></TabsTrigger>
            <TabsTrigger value="matches">Job matches <Badge variant="secondary" className="ml-1.5">{visibleMatches.length}</Badge></TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={runComparison} disabled={selected.length !== 2 || comparing}>
            <GitCompareArrows className="h-4 w-4" /> {comparing ? 'Comparing…' : 'Compare selected'}
          </Button>
        </div>
        <TabsContent value="analyses" className="mt-6">
          {loading ? (
            <div className="space-y-px bg-hairline">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)}</div>
          ) : visibleAnalyses.length ? (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"><span className="sr-only">Select</span></TableHead>
                    <TableHead>Analysis</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleAnalyses.map((item) => {
                    const id = getRecordId(item)
                    const meta = scoreMeta(item.score)
                    return (
                      <TableRow key={id || itemLabel(item, 'analyses')}>
                        <TableCell>
                          <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleSelected(id)} disabled={!id} aria-label={`Select ${itemLabel(item, 'analyses')} for comparison`} className="h-4 w-4 accent-primary" />
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-ink">{itemLabel(item, 'analyses')}</p>
                          <p className="mt-1 text-[12px] font-light text-muted">{item.profile?.fullName || item.resumeName || 'CV analysis'}</p>
                        </TableCell>
                        <TableCell><span className="font-bold tabular-nums" style={{ color: meta.color }}>{formatPercent(item.score)}</span></TableCell>
                        <TableCell className="text-[13px] font-light text-muted">{formatDate(item.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {id && <Button asChild variant="ghost" size="sm"><Link to={`/analysis/${encodeURIComponent(id)}`}>Open</Link></Button>}
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget({ type: 'analysis', item })} aria-label={`Delete ${itemLabel(item, 'analyses')}`}><Trash2 className="h-4 w-4 text-error" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState icon={HistoryIcon} title={search ? 'No analyses match your search' : 'No analyses yet'} description={search ? 'Try a different name, or clear the search to see everything.' : 'Analyze a CV to start building your history.'} action={<Button size="sm" asChild><Link to="/upload">Analyze a CV</Link></Button>} />
          )}
        </TabsContent>
        <TabsContent value="matches" className="mt-6">
          {loading ? (
            <div className="space-y-px bg-hairline">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div>
          ) : visibleMatches.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleMatches.map((item) => (
                <div key={getRecordId(item) || itemLabel(item, 'matches')} className="relative">
                  <JobMatchCard match={item} />
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget({ type: 'match', item })} aria-label={`Delete ${itemLabel(item, 'matches')}`} className="absolute right-3 top-3"><Trash2 className="h-4 w-4 text-error" /></Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={GitCompareArrows} title={search ? 'No matches match your search' : 'No matches yet'} description={search ? 'Try a different role or company name.' : 'Run a CV against a role description to create your first result.'} action={<Button size="sm" asChild><Link to="/jobs">Open job matcher</Link></Button>} />
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare two versions</DialogTitle>
            <DialogDescription>Category scores are read from the score breakdown each analysis returned.</DialogDescription>
          </DialogHeader>
          {comparison?.first && comparison?.second ? <AnalysisComparison first={comparison.first} second={comparison.second} comparison={comparison} /> : <p className="text-[14px] font-light text-muted">The comparison could not be assembled from the available analyses.</p>}
          <DialogFooter><Button variant="outline" onClick={() => setCompareOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this item?</DialogTitle>
            <DialogDescription>This deletes the saved record from your workspace. The source file you uploaded is not changed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Keep it</Button>
            <Button variant="destructive" onClick={deleteRecord} disabled={deleting}><Check className="mr-1.5 h-4 w-4" />{deleting ? 'Removing…' : 'Remove'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
