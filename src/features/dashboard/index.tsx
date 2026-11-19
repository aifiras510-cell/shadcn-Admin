/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  Activity,
  ArrowUpDown,
  Calendar,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  Download,
  FileText,
  Flag,
  GripVertical,
  Inbox,
  Layers,
  LayoutGrid,
  List,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search as SearchIcon,
  Table as TableIcon,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  type ColorKey,
  type Group,
  type Order,
  type Priority,
  type Activity as OrderActivity,
  useOrdersStore,
} from './orders-store'

type View = 'list' | 'board' | 'calendar' | 'gantt' | 'table'
const PRIORITIES: Priority[] = ['low', 'normal', 'high']
const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}
const PRIORITY_STYLE: Record<Priority, string> = {
  low: 'bg-zinc-600 text-white',
  normal: 'bg-blue-600 text-white',
  high: 'bg-rose-600 text-white',
}

type NewOrder = Omit<Order, 'id' | 'status'>

const COLOR_STYLES: Record<
  ColorKey,
  { pill: string; bar: string; column: string; add: string; dot: string }
> = {
  zinc: {
    pill: 'bg-zinc-600 text-white',
    bar: 'bg-zinc-500',
    column: 'bg-zinc-500/10',
    add: 'text-zinc-400',
    dot: 'bg-zinc-500',
  },
  blue: {
    pill: 'bg-blue-600 text-white',
    bar: 'bg-blue-500',
    column: 'bg-blue-500/10',
    add: 'text-blue-500',
    dot: 'bg-blue-500',
  },
  emerald: {
    pill: 'bg-emerald-600 text-white',
    bar: 'bg-emerald-500',
    column: 'bg-emerald-500/10',
    add: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  amber: {
    pill: 'bg-amber-600 text-white',
    bar: 'bg-amber-500',
    column: 'bg-amber-500/10',
    add: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  violet: {
    pill: 'bg-violet-600 text-white',
    bar: 'bg-violet-500',
    column: 'bg-violet-500/10',
    add: 'text-violet-500',
    dot: 'bg-violet-500',
  },
  rose: {
    pill: 'bg-rose-600 text-white',
    bar: 'bg-rose-500',
    column: 'bg-rose-500/10',
    add: 'text-rose-500',
    dot: 'bg-rose-500',
  },
  sky: {
    pill: 'bg-sky-600 text-white',
    bar: 'bg-sky-500',
    column: 'bg-sky-500/10',
    add: 'text-sky-500',
    dot: 'bg-sky-500',
  },
}

const COLOR_KEYS = Object.keys(COLOR_STYLES) as ColorKey[]

const today = () => new Date().toISOString().slice(0, 10)

const toDateKey = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const emptyForm = {
  customer: '',
  product: '',
  quantity: '1',
  date: today(),
  notes: '',
}

const iconBtn =
  'flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-muted active:scale-90 disabled:pointer-events-none disabled:opacity-30'

const iconFor = (g: Group) => (g.id === 'Delivered' ? Check : Circle)

const newId = () => Date.now()

/* Smooth enter/exit for the bottom action bar (no animation plugin needed) */
function useBarTransition<T>(item: T | null) {
  const open = item !== null
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const last = useRef<T | null>(null)
  if (item !== null) last.current = item

  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      )
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    const id = window.setTimeout(() => setMounted(false), 250)
    return () => window.clearTimeout(id)
  }, [open])

   
  return { mounted, visible, data: item ?? last.current }
}

export function Dashboard() {
  const { t, lang } = useLanguage()
  const { orders, setOrders, groups, setGroups } = useOrdersStore()
  const [view, setView] = useState<View>('board')
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Bottom action bar: which order is currently selected
  const [barId, setBarId] = useState<number | null>(null)
  const barOrder = orders.find((o) => o.id === barId) ?? null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBarId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const selected = orders.find((o) => o.id === selectedId) ?? null

  const q = query.trim().toLowerCase()
  const matches = (o: Order) =>
    `${o.customer} ${o.product} ${o.notes}`.toLowerCase().includes(q)
  const filtered = orders.filter(matches)

  const groupById = (id: string) => groups.find((g) => g.id === id)
  const styleOf = (id: string) => COLOR_STYLES[groupById(id)?.color ?? 'zinc']

  const firstGroupId = groups[0]?.id ?? 'Pending'
  const lastGroupId = groups[groups.length - 1]?.id ?? firstGroupId

  function createOrder(data: NewOrder, groupId: string = firstGroupId) {
    setOrders((prev) => [{ id: Date.now(), status: groupId, ...data }, ...prev])
  }

  function updateOrder(id: number, patch: Partial<Order>) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  function duplicateOrder(id: number) {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === id)
      if (idx < 0) return prev
      const copy: Order = { ...prev[idx], id: Date.now() }
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
    })
  }

  // Move an order to a group. If beforeId is given, place it right before that card;
  // otherwise place it at the end of its column.
  function moveOrder(id: number, groupId: string, beforeId?: number) {
    if (id === beforeId) return
    setOrders((prev) => {
      const item = prev.find((o) => o.id === id)
      if (!item) return prev
      const rest = prev.filter((o) => o.id !== id)
      const updated: Order = { ...item, status: groupId }

      let at: number
      if (beforeId !== undefined) {
        at = rest.findIndex((o) => o.id === beforeId)
      } else {
        let lastIndex = -1
        rest.forEach((o, i) => {
          if (o.status === groupId) lastIndex = i
        })
        at = lastIndex + 1
      }
      if (at < 0) at = rest.length
      return [...rest.slice(0, at), updated, ...rest.slice(at)]
    })
  }

  function completeOrder(id: number) {
    moveOrder(id, lastGroupId)
  }

  function cycleStatus(id: number) {
    const current = orders.find((o) => o.id === id)
    if (!current || groups.length === 0) return
    const index =
      (groups.findIndex((g) => g.id === current.status) + 1) % groups.length
    moveOrder(id, groups[index].id)
  }

  function removeOrder(id: number) {
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  function addGroup(name: string, color: ColorKey) {
    const clean = name.trim()
    if (!clean) return
    setGroups((prev) => [
      ...prev,
      { id: `g-${Date.now()}`, name: clean, color },
    ])
  }

  function removeGroup(id: string) {
    // Only empty groups can be deleted, so no orders get lost
    if (orders.some((o) => o.status === id)) return
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }

  function sortOrders() {
    setOrders((prev) =>
      [...prev].sort((a, b) => (newestFirst ? a.id - b.id : b.id - a.id))
    )
    setNewestFirst((v) => !v)
  }

  function clearAll() {
    if (orders.length && window.confirm(t('Delete all orders?'))) {
      setOrders([])
      setBarId(null)
    }
  }

  function exportCsv() {
    const header = [
      t('Customer'),
      t('Product'),
      t('Quantity'),
      t('Date'),
      t('Status'),
      t('Notes'),
    ]
    const rows = orders.map((o) => [
      o.customer,
      o.product,
      o.quantity,
      o.date,
      t(groupById(o.status)?.name ?? o.status),
      o.notes,
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    // BOM so Excel reads Arabic text correctly
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${today()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const topNav = [
    {
      title: t('Overview'),
      href: 'dashboard/overview',
      isActive: true,
      disabled: false,
    },
    {
      title: t('Customers'),
      href: 'dashboard/customers',
      isActive: false,
      disabled: true,
    },
    {
      title: t('Products'),
      href: 'dashboard/products',
      isActive: false,
      disabled: true,
    },
    {
      title: t('Settings'),
      href: 'dashboard/settings',
      isActive: false,
      disabled: true,
    },
  ]

  const views: { key: View; label: string; icon: typeof List }[] = [
    { key: 'list', label: t('List'), icon: List },
    { key: 'board', label: t('Board'), icon: LayoutGrid },
    { key: 'calendar', label: t('Calendar'), icon: CalendarDays },
    { key: 'gantt', label: t('Gantt'), icon: Activity },
    { key: 'table', label: t('Table'), icon: TableIcon },
  ]

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} className='me-auto' />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='flex min-h-0 flex-col gap-3'>
          {/* ===== Breadcrumb + actions ===== */}
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-2 text-sm'>
              <LayoutGrid className='h-4 w-4 text-muted-foreground' />
              <span className='font-semibold'>{t('Orders')}</span>
              <span className='text-muted-foreground'>· {orders.length}</span>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={exportCsv}
                disabled={!orders.length}
              >
                <Download className='me-2 h-4 w-4' />
                {t('Export CSV')}
              </Button>
              <Button
                variant='destructive'
                size='sm'
                onClick={clearAll}
                disabled={!orders.length}
              >
                {t('Clear all')}
              </Button>
            </div>
          </div>

          {/* ===== View tabs ===== */}
          <div className='flex items-center gap-5 overflow-x-auto border-b'>
            {views.map((v) => {
              const Icon = v.icon
              const active = view === v.key
              return (
                <button
                  key={v.key}
                  type='button'
                  onClick={() => setView(v.key)}
                  className={cn(
                    '-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-2 text-sm transition',
                    active
                      ? 'border-foreground font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  {v.label}
                </button>
              )
            })}
          </div>

          {/* ===== Toolbar ===== */}
          <div className='flex flex-wrap items-center justify-between gap-2'>
            {view === 'board' ? (
              <span className='inline-flex items-center gap-1.5 rounded-md bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-400'>
                <Layers className='h-3.5 w-3.5' />
                {t('Group')}: {t('Status')}
              </span>
            ) : (
              <span />
            )}

            <div className='flex flex-wrap items-center gap-2'>
              <Button variant='outline' size='sm' onClick={sortOrders}>
                <ArrowUpDown className='me-2 h-3.5 w-3.5' />
                {t('Sort')}:{' '}
                {newestFirst ? t('Newest first') : t('Oldest first')}
              </Button>
              <div className='relative w-48'>
                <SearchIcon className='pointer-events-none absolute inset-s-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('Search customer or product')}
                  className='h-8 ps-8 text-sm'
                />
              </div>
              <AddOrderDialog onCreate={(data) => createOrder(data)} />
            </div>
          </div>

          {view === 'board' && (
            <BoardView
              groups={groups}
              orders={orders}
              filtered={filtered}
              matches={matches}
              dragId={dragId}
              setDragId={setDragId}
              dragOverGroup={dragOverGroup}
              setDragOverGroup={setDragOverGroup}
              moveOrder={moveOrder}
              onOpen={setSelectedId}
              onComplete={completeOrder}
              onDuplicate={duplicateOrder}
              onDelete={removeOrder}
              createOrder={createOrder}
              addGroup={addGroup}
              removeGroup={removeGroup}
            />
          )}
          {view === 'list' && (
            <ListView
              groups={groups}
              orders={filtered}
              allEmpty={orders.length === 0}
              styleOf={styleOf}
              groupById={groupById}
              cycleStatus={cycleStatus}
              removeOrder={removeOrder}
              activeId={barId}
              onSelect={setBarId}
            />
          )}
          {view === 'table' && (
            <TableView
              orders={filtered}
              allEmpty={orders.length === 0}
              styleOf={styleOf}
              groupById={groupById}
              cycleStatus={cycleStatus}
              removeOrder={removeOrder}
              activeId={barId}
              onSelect={setBarId}
            />
          )}
          {view === 'calendar' && (
            <CalendarView
              orders={filtered}
              lang={lang}
              styleOf={styleOf}
              activeId={barId}
              onSelect={setBarId}
            />
          )}
          {view === 'gantt' && (
            <GanttView
              orders={filtered}
              lang={lang}
              styleOf={styleOf}
              activeId={barId}
              onSelect={setBarId}
            />
          )}
        </div>
      </Main>

      <OrderDetailsDialog
        order={selected}
        groups={groups}
        onClose={() => setSelectedId(null)}
        onUpdate={updateOrder}
        onDelete={(id) => {
          removeOrder(id)
          setSelectedId(null)
        }}
      />

      <OrderActionBar
        order={barOrder}
        groups={groups}
        styleOf={styleOf}
        onMove={moveOrder}
        onComplete={completeOrder}
        onEdit={(id) => {
          setBarId(null)
          setSelectedId(id)
        }}
        onDuplicate={duplicateOrder}
        onDelete={(id) => {
          removeOrder(id)
          setBarId(null)
        }}
        onClose={() => setBarId(null)}
      />
    </>
  )
}

type GroupLookup = (id: string) => Group | undefined
type StyleLookup = (id: string) => (typeof COLOR_STYLES)[ColorKey]

/* ============================ Board ============================ */

function BoardView({
  groups,
  orders,
  filtered,
  matches,
  dragId,
  setDragId,
  dragOverGroup,
  setDragOverGroup,
  moveOrder,
  onOpen,
  onComplete,
  onDuplicate,
  onDelete,
  createOrder,
  addGroup,
  removeGroup,
}: {
  groups: Group[]
  orders: Order[]
  filtered: Order[]
  matches: (o: Order) => boolean
  dragId: number | null
  setDragId: (id: number | null) => void
  dragOverGroup: string | null
  setDragOverGroup: (id: string | null) => void
  moveOrder: (id: number, groupId: string, beforeId?: number) => void
  onOpen: (id: number) => void
  onComplete: (id: number) => void
  onDuplicate: (id: number) => void
  onDelete: (id: number) => void
  createOrder: (data: NewOrder, groupId?: string) => void
  addGroup: (name: string, color: ColorKey) => void
  removeGroup: (id: string) => void
}) {
  const { t } = useLanguage()
  const lastGroupId = groups[groups.length - 1]?.id

  return (
    <div className='flex items-start gap-3 overflow-x-auto pb-2'>
      {groups.map((g) => {
        const items = filtered.filter((o) => o.status === g.id && matches(o))
        const c = COLOR_STYLES[g.color]
        const Icon = iconFor(g)
        const isDropTarget = dragOverGroup === g.id && dragId !== null
        const isDefault = ['Pending', 'Processing', 'Delivered'].includes(g.id)
        const hasOrders = orders.some((o) => o.status === g.id)

        return (
          <section
            key={g.id}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverGroup(g.id)
            }}
            onDragLeave={() => setDragOverGroup(null)}
            onDrop={(e) => {
              e.preventDefault()
              if (dragId !== null) moveOrder(dragId, g.id)
              setDragId(null)
              setDragOverGroup(null)
            }}
            className={cn(
              'flex w-60 shrink-0 flex-col gap-2 rounded-lg p-2 transition',
              c.column,
              isDropTarget && 'ring-2 ring-foreground/30'
            )}
          >
            {/* Column header */}
            <div className='flex items-center justify-between gap-2 px-1'>
              <div className='flex min-w-0 items-center gap-2'>
                <span
                  className={cn(
                    'inline-flex min-w-0 items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold',
                    c.pill
                  )}
                >
                  <Icon className='h-3 w-3 shrink-0' />
                  <span className='truncate'>{t(g.name)}</span>
                </span>
                <span className='text-xs text-muted-foreground tabular-nums'>
                  {items.length}
                </span>
              </div>
              {!isDefault && !hasOrders && (
                <button
                  type='button'
                  onClick={() => removeGroup(g.id)}
                  aria-label={t('Delete group')}
                  title={t('Delete group')}
                  className={cn(
                    iconBtn,
                    'hover:bg-destructive/10 hover:text-destructive'
                  )}
                >
                  <X className='h-3.5 w-3.5' />
                </button>
              )}
            </div>

            {/* Cards */}
            <div className='flex flex-col gap-2'>
              {items.map((o) => (
                <article
                  key={o.id}
                  draggable
                  onClick={() => onOpen(o.id)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(o.id))
                    e.dataTransfer.effectAllowed = 'move'
                    setDragId(o.id)
                  }}
                  onDragEnd={() => {
                    setDragId(null)
                    setDragOverGroup(null)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOverGroup(g.id)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (dragId !== null) moveOrder(dragId, g.id, o.id)
                    setDragId(null)
                    setDragOverGroup(null)
                  }}
                  className={cn(
                    'group cursor-pointer rounded-md border bg-card p-2 shadow-sm transition duration-200 hover:shadow-md active:cursor-grabbing',
                    dragId === o.id && 'opacity-40'
                  )}
                >
                  <div className='flex items-start gap-1.5'>
                    <GripVertical className='mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition group-hover:opacity-100' />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-semibold'>
                        {o.customer}
                      </p>
                      {o.product && (
                        <p className='truncate text-xs text-muted-foreground'>
                          {o.product}
                        </p>
                      )}
                    </div>
                    <span className='shrink-0 rounded bg-muted px-1 text-[11px] font-semibold tabular-nums'>
                      × {o.quantity}
                    </span>
                  </div>

                  <div className='mt-2 flex items-center justify-between gap-2 border-t pt-1.5'>
                    <span className='flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums'>
                      <Calendar className='h-3 w-3' />
                      {o.date}
                    </span>

                    <div
                      className='flex items-center gap-0.5 opacity-60 transition group-hover:opacity-100'
                      onClick={(e) => e.stopPropagation()}
                    >
                      {o.notes && (
                        <FileText className='me-1 h-3 w-3 text-muted-foreground' />
                      )}
                      <button
                        type='button'
                        onClick={() => onComplete(o.id)}
                        disabled={g.id === lastGroupId}
                        aria-label={t('Mark complete')}
                        title={t('Mark complete')}
                        className={cn(iconBtn, 'hover:text-emerald-500')}
                      >
                        <Check className='h-3.5 w-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => onDuplicate(o.id)}
                        aria-label={t('Duplicate order')}
                        title={t('Duplicate order')}
                        className={iconBtn}
                      >
                        <Copy className='h-3.5 w-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => onOpen(o.id)}
                        aria-label={t('Edit order')}
                        title={t('Edit order')}
                        className={iconBtn}
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type='button'
                            aria-label={t('More actions')}
                            title={t('More actions')}
                            className={iconBtn}
                          >
                            <MoreHorizontal className='h-3.5 w-3.5' />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='end'
                          className='w-48'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem onSelect={() => onOpen(o.id)}>
                            <Pencil className='h-4 w-4' />
                            {t('Edit order')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onDuplicate(o.id)}>
                            <Copy className='h-4 w-4' />
                            {t('Duplicate order')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>{t('Move to')}</DropdownMenuLabel>
                          {groups
                            .filter((target) => target.id !== o.status)
                            .map((target) => (
                              <DropdownMenuItem
                                key={target.id}
                                onSelect={() => moveOrder(o.id, target.id)}
                              >
                                <span
                                  className={cn(
                                    'h-2 w-2 rounded-full',
                                    COLOR_STYLES[target.color].dot
                                  )}
                                />
                                {t(target.name)}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => onDelete(o.id)}
                            className='text-destructive focus:text-destructive'
                          >
                            <Trash2 className='h-4 w-4' />
                            {t('Delete order')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </article>
              ))}

              {items.length === 0 && (
                <div className='flex flex-col items-center gap-1 py-4 text-center'>
                  <Inbox className='h-5 w-5 text-muted-foreground/50' />
                  <p className='text-[11px] text-muted-foreground'>
                    {orders.length === 0
                      ? t('No orders yet. Register your first one.')
                      : t('No orders match this filter.')}
                  </p>
                </div>
              )}
            </div>

            <InlineAdd
              accentClass={c.add}
              onCreate={(data) => createOrder(data, g.id)}
            />
          </section>
        )
      })}

      <AddGroupBox addGroup={addGroup} />
    </div>
  )
}

function AddGroupBox({
  addGroup,
}: {
  addGroup: (name: string, color: ColorKey) => void
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<ColorKey>('violet')

  if (!open) {
    return (
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='flex w-60 shrink-0 items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted/40 hover:text-foreground'
      >
        <Plus className='h-4 w-4' />
        {t('Add group')}
      </button>
    )
  }

  function save() {
    if (!name.trim()) return
    addGroup(name, color)
    setName('')
    setOpen(false)
  }

  return (
    <div className='w-60 shrink-0 space-y-2 rounded-lg border bg-card p-2.5 shadow-sm'>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('Group name')}
        className='h-8 text-sm'
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      <div className='flex flex-wrap gap-1.5'>
        {COLOR_KEYS.map((k) => (
          <button
            key={k}
            type='button'
            onClick={() => setColor(k)}
            aria-label={k}
            className={cn(
              'h-5 w-5 rounded-full transition hover:scale-110',
              COLOR_STYLES[k].dot,
              color === k &&
                'ring-2 ring-foreground ring-offset-2 ring-offset-card'
            )}
          />
        ))}
      </div>
      <div className='flex justify-end gap-2'>
        <Button variant='ghost' size='sm' onClick={() => setOpen(false)}>
          {t('Cancel')}
        </Button>
        <Button size='sm' onClick={save} disabled={!name.trim()}>
          {t('Save')}
        </Button>
      </div>
    </div>
  )
}

/* ============================ Order details ============================ */

function OrderDetailsDialog({
  order,
  groups,
  onClose,
  onUpdate,
  onDelete,
}: {
  order: Order | null
  groups: Group[]
  onClose: () => void
  onUpdate: (id: number, patch: Partial<Order>) => void
  onDelete: (id: number) => void
}) {
  const { t } = useLanguage()

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='overflow-hidden p-0 sm:max-w-5xl'>
        <DialogTitle className='sr-only'>{t('Order details')}</DialogTitle>
        <DialogDescription className='sr-only'>
          {t('Order details')}
        </DialogDescription>
        {order && (
          <div className='grid max-h-[85vh] grid-cols-1 lg:grid-cols-[1fr_320px]'>
            <OrderMain
              order={order}
              groups={groups}
              onUpdate={(patch) => onUpdate(order.id, patch)}
              onDelete={() => onDelete(order.id)}
            />
            <OrderComments
              order={order}
              onUpdate={(patch) => onUpdate(order.id, patch)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function OrderMain({
  order,
  groups,
  onUpdate,
  onDelete,
}: {
  order: Order
  groups: Group[]
  onUpdate: (patch: Partial<Order>) => void
  onDelete: () => void
}) {
  const { t } = useLanguage()
  const [tagInput, setTagInput] = useState('')
  const tags = order.tags ?? []
  const lastGroupId = groups[groups.length - 1]?.id
  const priority = order.priority ?? 'normal'
  const nameOf = (id: string) => t(groups.find((g) => g.id === id)?.name ?? id)

  function changeStatus(to: string) {
    if (to === order.status) return
    const entry: OrderActivity = {
      id: newId(),
      text: `${nameOf(order.status)} → ${nameOf(to)}`,
      at: new Date().toISOString(),
    }
    onUpdate({ status: to, activity: [...(order.activity ?? []), entry] })
  }

  function addTag() {
    const value = tagInput.trim()
    if (!value) return
    if (!tags.includes(value)) onUpdate({ tags: [...tags, value] })
    setTagInput('')
  }

  const row = (icon: ReactNode, label: string, children: ReactNode) => (
    <div className='flex min-h-9 items-center gap-3'>
      <span className='flex w-28 shrink-0 items-center gap-2 text-sm text-muted-foreground'>
        {icon}
        {label}
      </span>
      <div className='flex flex-1 flex-wrap items-center gap-2'>{children}</div>
    </div>
  )

  return (
    <div className='min-w-0 space-y-5 overflow-y-auto p-6'>
      {/* Breadcrumb + type, like the task header */}
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <span className='inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-foreground'>
          <Circle className='h-3 w-3' />
          {t('Order')}
        </span>
        <span>
          {t('Orders')} / {order.customer || '—'}
        </span>
      </div>

      <input
        value={order.customer}
        onChange={(e) => onUpdate({ customer: e.target.value })}
        placeholder={t('Customer name')}
        className='w-full bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/50'
      />

      <div className='space-y-3'>
        {row(
          <Circle className='h-4 w-4' />,
          t('Status'),
          <>
            <div className='flex items-stretch overflow-hidden rounded-md'>
              <span
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold',
                  COLOR_STYLES[
                    groups.find((g) => g.id === order.status)?.color ?? 'zinc'
                  ].pill
                )}
              >
                {nameOf(order.status)}
              </span>
              <span className='flex items-center border-s bg-muted px-1.5'>
                <ChevronRight className='h-3.5 w-3.5 rtl:rotate-180' />
              </span>
            </div>
            {groups.map((g) => (
              <button
                key={g.id}
                type='button'
                onClick={() => changeStatus(g.id)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[11px] transition',
                  order.status === g.id
                    ? 'opacity-0'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
                disabled={order.status === g.id}
              >
                {t(g.name)}
              </button>
            ))}
            <button
              type='button'
              onClick={() => changeStatus(lastGroupId)}
              disabled={order.status === lastGroupId}
              aria-label={t('Mark complete')}
              title={t('Mark complete')}
              className='flex h-6 w-6 items-center justify-center rounded-md border transition hover:bg-emerald-500/15 hover:text-emerald-500 disabled:opacity-30'
            >
              <Check className='h-3.5 w-3.5' />
            </button>
          </>
        )}

        {row(
          <Calendar className='h-4 w-4' />,
          t('Dates'),
          <>
            <label className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground'>
                {t('Start date')}
              </span>
              <Input
                type='date'
                value={order.date}
                onChange={(e) => onUpdate({ date: e.target.value })}
                className='h-8 w-40'
              />
            </label>
            <span className='text-muted-foreground'>→</span>
            <label className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground'>
                {t('Due date')}
              </span>
              <Input
                type='date'
                value={order.dueDate ?? ''}
                onChange={(e) =>
                  onUpdate({ dueDate: e.target.value || undefined })
                }
                className='h-8 w-40'
              />
            </label>
          </>
        )}

        {row(
          <Clock className='h-4 w-4' />,
          t('Quantity'),
          <div className='flex h-8 items-center gap-1 rounded-md border px-1'>
            <button
              type='button'
              onClick={() =>
                onUpdate({ quantity: Math.max(1, order.quantity - 1) })
              }
              aria-label={t('Decrease quantity')}
              className='flex h-6 w-6 items-center justify-center rounded hover:bg-muted'
            >
              <Minus className='h-3.5 w-3.5' />
            </button>
            <span className='w-8 text-center text-sm font-semibold tabular-nums'>
              {order.quantity}
            </span>
            <button
              type='button'
              onClick={() => onUpdate({ quantity: order.quantity + 1 })}
              aria-label={t('Increase quantity')}
              className='flex h-6 w-6 items-center justify-center rounded hover:bg-muted'
            >
              <Plus className='h-3.5 w-3.5' />
            </button>
          </div>
        )}

        {row(
          <Flag className='h-4 w-4' />,
          t('Priority'),
          <>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type='button'
                onClick={() => onUpdate({ priority: p })}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition',
                  priority === p
                    ? PRIORITY_STYLE[p]
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {t(PRIORITY_LABEL[p])}
              </button>
            ))}
          </>
        )}

        {row(
          <Package className='h-4 w-4' />,
          t('Product'),
          <Input
            value={order.product}
            onChange={(e) => onUpdate({ product: e.target.value })}
            placeholder={t('What did they order?')}
            className='h-8 max-w-sm'
          />
        )}

        {row(
          <Tag className='h-4 w-4' />,
          t('Tags'),
          <>
            {tags.map((tag) => (
              <span
                key={tag}
                className='inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs'
              >
                {tag}
                <button
                  type='button'
                  onClick={() =>
                    onUpdate({ tags: tags.filter((x) => x !== tag) })
                  }
                  aria-label={t('Delete order')}
                  className='text-muted-foreground hover:text-foreground'
                >
                  <X className='h-3 w-3' />
                </button>
              </span>
            ))}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder={t('Add tag')}
              className='h-7 w-36 text-xs'
            />
          </>
        )}
      </div>

      <div className='border-t pt-4'>
        <Textarea
          rows={5}
          value={order.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder={t('Add description')}
          className='resize-none border-none bg-transparent px-0 shadow-none focus-visible:ring-0'
        />
      </div>

      <div className='flex items-center justify-between border-t pt-4'>
        <Button
          variant='ghost'
          size='sm'
          className='text-destructive hover:text-destructive'
          onClick={onDelete}
        >
          <Trash2 className='me-2 h-4 w-4' />
          {t('Delete order')}
        </Button>
      </div>
    </div>
  )
}

function OrderComments({
  order,
  onUpdate,
}: {
  order: Order
  onUpdate: (patch: Partial<Order>) => void
}) {
  const { t, lang } = useLanguage()
  const [text, setText] = useState('')
  const comments = order.comments ?? []
  const activity = order.activity ?? []
  const locale = lang === 'ar' ? 'ar' : 'en'
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))

  function post() {
    const value = text.trim()
    if (!value) return
    onUpdate({
      comments: [
        ...comments,
        { id: Date.now(), text: value, at: new Date().toISOString() },
      ],
    })
    setText('')
  }

  return (
    <aside className='flex min-h-0 flex-col border-t bg-muted/20 lg:border-s lg:border-t-0'>
      <div className='flex items-center justify-between border-b px-4 py-3'>
        <div className='flex items-center gap-2 text-sm font-semibold'>
          <MessageSquare className='h-4 w-4' />
          {t('Comments')}
        </div>
        <span className='text-xs text-muted-foreground'>
          {t('Created')} {order.date}
        </span>
      </div>

      <div className='flex-1 space-y-4 overflow-y-auto p-4'>
        {comments.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-10 text-center'>
            <p className='text-sm font-semibold'>
              {t('Send the first comment')}
            </p>
            <p className='max-w-56 text-xs text-muted-foreground'>
              {t('Ask a question, share an update, or loop someone in.')}
            </p>
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className='rounded-md bg-card p-3 text-sm shadow-sm'
            >
              <p className='whitespace-pre-wrap'>{c.text}</p>
              <p className='mt-1 text-[11px] text-muted-foreground tabular-nums'>
                {fmt(c.at)}
              </p>
            </div>
          ))
        )}

        {activity.length > 0 && (
          <div className='space-y-2 border-t pt-4'>
            <p className='text-xs font-semibold text-muted-foreground'>
              {t('Activity')}
            </p>
            {activity.map((a) => (
              <p key={a.id} className='text-xs text-muted-foreground'>
                <span className='font-medium text-foreground'>
                  {t('Status')}:{' '}
                </span>
                {a.text}
                <span className='ms-2 tabular-nums'>{fmt(a.at)}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className='space-y-2 border-t p-3'>
        <Textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              post()
            }
          }}
          placeholder={t('Write a comment')}
          className='resize-none bg-card'
        />
        <div className='flex justify-end'>
          <Button size='sm' onClick={post} disabled={!text.trim()}>
            {t('Post')}
          </Button>
        </div>
      </div>
    </aside>
  )
}

/* ============================ Action bar ============================ */

function OrderActionBar({
  order: orderProp,
  groups,
  styleOf,
  onMove,
  onComplete,
  onEdit,
  onDuplicate,
  onDelete,
  onClose,
}: {
  order: Order | null
  groups: Group[]
  styleOf: StyleLookup
  onMove: (id: number, groupId: string) => void
  onComplete: (id: number) => void
  onEdit: (id: number) => void
  onDuplicate: (id: number) => void
  onDelete: (id: number) => void
  onClose: () => void
}) {
  const { t } = useLanguage()
  const anim = useBarTransition(orderProp)
  if (!anim.mounted || !anim.data) return null
  const order = anim.data
  const lastGroupId = groups[groups.length - 1]?.id

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4'>
      <div
            className={cn(
              'pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-2xl ring-1 ring-foreground/5 transition-all motion-reduce:transition-none',
              anim.visible
                ? 'translate-y-0 scale-100 opacity-100 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
                : 'translate-y-8 scale-95 opacity-0 duration-200 ease-in'
            )}
          >
        {/* Order info */}
        <div className='flex min-w-0 items-center gap-2 px-2'>
          <span
            className={cn(
              'h-2.5 w-2.5 shrink-0 rounded-full',
              styleOf(order.status).dot
            )}
          />
          <div className='max-w-48 min-w-0'>
            <p className='truncate text-sm font-semibold'>{order.customer}</p>
            <p className='truncate text-[11px] text-muted-foreground'>
              {order.product || '—'} · × {order.quantity}
            </p>
          </div>
        </div>

        <div className='h-8 w-px bg-border' />

        {/* Status buttons */}
        <div className='flex flex-wrap items-center gap-1'>
          {groups.map((g) => {
            const active = order.status === g.id
            const Icon = iconFor(g)
            return (
              <button
                key={g.id}
                type='button'
                disabled={active}
                onClick={() => onMove(order.id, g.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition active:scale-95 enabled:hover:-translate-y-0.5',
                  active
                    ? COLOR_STYLES[g.color].pill
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className='h-3 w-3' />
                {t(g.name)}
              </button>
            )
          })}
        </div>

        <div className='h-8 w-px bg-border' />

        {/* Actions */}
        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={() => onComplete(order.id)}
            disabled={order.status === lastGroupId}
            aria-label={t('Mark complete')}
            title={t('Mark complete')}
            className={cn(iconBtn, 'h-8 w-8 hover:text-emerald-500')}
          >
            <Check className='h-4 w-4' />
          </button>
          <button
            type='button'
            onClick={() => onEdit(order.id)}
            aria-label={t('Edit order')}
            title={t('Edit order')}
            className={cn(iconBtn, 'h-8 w-8')}
          >
            <Pencil className='h-4 w-4' />
          </button>
          <button
            type='button'
            onClick={() => onDuplicate(order.id)}
            aria-label={t('Duplicate order')}
            title={t('Duplicate order')}
            className={cn(iconBtn, 'h-8 w-8')}
          >
            <Copy className='h-4 w-4' />
          </button>
          <button
            type='button'
            onClick={() => onDelete(order.id)}
            aria-label={t('Delete order')}
            title={t('Delete order')}
            className={cn(
              iconBtn,
              'h-8 w-8 hover:bg-destructive/10 hover:text-destructive'
            )}
          >
            <Trash2 className='h-4 w-4' />
          </button>
          <div className='mx-1 h-6 w-px bg-border' />
          <button
            type='button'
            onClick={onClose}
            aria-label={t('Close')}
            title={t('Close')}
            className={cn(iconBtn, 'h-8 w-8')}
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================ List ============================ */

function ListView({
  groups,
  orders,
  allEmpty,
  styleOf,
  groupById,
  cycleStatus,
  removeOrder,
  activeId,
  onSelect,
}: {
  groups: Group[]
  orders: Order[]
  allEmpty: boolean
  styleOf: StyleLookup
  groupById: GroupLookup
  cycleStatus: (id: number) => void
  removeOrder: (id: number) => void
  activeId: number | null
  onSelect: (id: number) => void
}) {
  const { t } = useLanguage()

  if (orders.length === 0) {
    return (
      <EmptyState
        text={
          allEmpty
            ? t('No orders yet. Register your first one.')
            : t('No orders match this filter.')
        }
      />
    )
  }

  return (
    <div className='space-y-6'>
      {groups.map((g) => {
        const items = orders.filter((o) => o.status === g.id)
        if (items.length === 0) return null
        return (
          <section key={g.id} className='space-y-2'>
            <div className='flex items-center gap-2'>
              <StatusPill
                label={t(g.name)}
                style={styleOf(g.id)}
                icon={iconFor(g)}
              />
              <span className='text-sm text-muted-foreground tabular-nums'>
                {items.length}
              </span>
            </div>
            <div className='divide-y rounded-lg border bg-card'>
              {items.map((o) => (
                <div
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 px-4 py-3 transition hover:bg-muted/40',
                    activeId === o.id && 'bg-muted/60'
                  )}
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold'>
                      {o.customer}
                    </p>
                    <p className='truncate text-xs text-muted-foreground'>
                      {o.product}
                    </p>
                  </div>
                  <span className='hidden text-xs text-muted-foreground tabular-nums sm:block'>
                    × {o.quantity}
                  </span>
                  <span className='hidden text-xs text-muted-foreground tabular-nums md:block'>
                    {o.date}
                  </span>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      cycleStatus(o.id)
                    }}
                    className='transition hover:scale-105'
                  >
                    <StatusPill
                      label={t(groupById(o.status)?.name ?? o.status)}
                      style={styleOf(o.status)}
                      icon={iconFor(groupById(o.status) ?? groups[0])}
                    />
                  </button>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      removeOrder(o.id)
                    }}
                    aria-label={t('Delete order')}
                    title={t('Delete order')}
                    className={cn(
                      iconBtn,
                      'hover:bg-destructive/10 hover:text-destructive'
                    )}
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/* ============================ Table ============================ */

function TableView({
  orders,
  allEmpty,
  styleOf,
  groupById,
  cycleStatus,
  removeOrder,
  activeId,
  onSelect,
}: {
  orders: Order[]
  allEmpty: boolean
  styleOf: StyleLookup
  groupById: GroupLookup
  cycleStatus: (id: number) => void
  removeOrder: (id: number) => void
  activeId: number | null
  onSelect: (id: number) => void
}) {
  const { t } = useLanguage()

  return (
    <div className='overflow-x-auto rounded-lg border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Customer')}</TableHead>
            <TableHead>{t('Product')}</TableHead>
            <TableHead className='text-center'>{t('Qty')}</TableHead>
            <TableHead>{t('Date')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead>{t('Notes')}</TableHead>
            <TableHead className='text-center'>{t('Action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className='py-8 text-center text-muted-foreground'
              >
                {allEmpty
                  ? t('No orders yet. Register your first one.')
                  : t('No orders match this filter.')}
              </TableCell>
            </TableRow>
          )}
          {orders.map((o) => {
            const g = groupById(o.status)
            return (
              <TableRow
                key={o.id}
                onClick={() => onSelect(o.id)}
                className={cn(
                  'cursor-pointer',
                  activeId === o.id && 'bg-muted/60'
                )}
              >
                <TableCell className='font-medium'>{o.customer}</TableCell>
                <TableCell>{o.product}</TableCell>
                <TableCell className='text-center tabular-nums'>
                  {o.quantity}
                </TableCell>
                <TableCell className='tabular-nums'>{o.date}</TableCell>
                <TableCell>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      cycleStatus(o.id)
                    }}
                    className='transition hover:scale-105'
                  >
                    <StatusPill
                      label={t(g?.name ?? o.status)}
                      style={styleOf(o.status)}
                      icon={g ? iconFor(g) : Circle}
                    />
                  </button>
                </TableCell>
                <TableCell className='max-w-56 truncate text-muted-foreground'>
                  {o.notes}
                </TableCell>
                <TableCell className='text-center'>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      removeOrder(o.id)
                    }}
                    aria-label={t('Delete order')}
                    title={t('Delete order')}
                    className={cn(
                      iconBtn,
                      'hover:bg-destructive/10 hover:text-destructive'
                    )}
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/* ============================ Calendar ============================ */

function CalendarView({
  orders,
  lang,
  styleOf,
  activeId,
  onSelect,
}: {
  orders: Order[]
  lang: string
  styleOf: StyleLookup
  activeId: number | null
  onSelect: (id: number) => void
}) {
  const { t } = useLanguage()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay.getDay() // 0 = Sunday

  const locale = lang === 'ar' ? 'ar' : 'en'
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(now)

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
      new Date(2024, 0, 7 + i)
    )
  )

  const byDate = new Map<string, Order[]>()
  orders.forEach((o) => {
    byDate.set(o.date, [...(byDate.get(o.date) ?? []), o])
  })

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const todayKey = toDateKey(now)

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-semibold'>{monthLabel}</h2>
        <span className='text-xs text-muted-foreground'>
          {t('Today')}: {toDateKey(now)}
        </span>
      </div>
      <div className='grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border'>
        {weekdays.map((d) => (
          <div
            key={d}
            className='bg-muted/50 px-2 py-2 text-center text-xs font-semibold text-muted-foreground'
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null)
            return <div key={`e-${i}`} className='min-h-24 bg-card/40' />
          const key = toDateKey(new Date(year, month, day))
          const dayOrders = byDate.get(key) ?? []
          const isToday = key === todayKey
          return (
            <div key={key} className='min-h-24 space-y-1 bg-card p-1.5'>
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums',
                  isToday && 'bg-foreground font-bold text-background'
                )}
              >
                {day}
              </div>
              {dayOrders.slice(0, 3).map((o) => (
                <div
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className={cn(
                    'cursor-pointer truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white',
                    styleOf(o.status).bar,
                    activeId === o.id && 'ring-2 ring-foreground'
                  )}
                  title={`${o.customer} · ${o.product}`}
                >
                  {o.customer}
                </div>
              ))}
              {dayOrders.length > 3 && (
                <div className='text-[11px] text-muted-foreground'>
                  +{dayOrders.length - 3}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================ Gantt ============================ */

function GanttView({
  orders,
  lang,
  styleOf,
  activeId,
  onSelect,
}: {
  orders: Order[]
  lang: string
  styleOf: StyleLookup
  activeId: number | null
  onSelect: (id: number) => void
}) {
  const { t } = useLanguage()
  const start = new Date()
  start.setDate(start.getDate() - 3)
  const DAYS = 14
  const locale = lang === 'ar' ? 'ar' : 'en'

  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
  const todayKey = toDateKey(new Date())
  const sorted = [...orders].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className='overflow-x-auto rounded-lg border bg-card'>
      <div className='min-w-180'>
        <div className='flex border-b bg-muted/40'>
          <div className='w-56 shrink-0 border-e px-3 py-2 text-xs font-semibold text-muted-foreground'>
            {t('Customer')}
          </div>
          {days.map((d) => {
            const isToday = toDateKey(d) === todayKey
            return (
              <div
                key={toDateKey(d)}
                className={cn(
                  'flex flex-1 flex-col items-center py-2 text-[11px] text-muted-foreground',
                  isToday && 'font-bold text-foreground'
                )}
              >
                <span>
                  {new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
                    d
                  )}
                </span>
                <span className='tabular-nums'>{d.getDate()}</span>
              </div>
            )
          })}
        </div>

        {sorted.length === 0 && (
          <p className='py-10 text-center text-sm text-muted-foreground'>
            {t('No orders yet. Register your first one.')}
          </p>
        )}
        {sorted.map((o) => (
          <div
            key={o.id}
            onClick={() => onSelect(o.id)}
            className={cn(
              'flex cursor-pointer border-b last:border-b-0 hover:bg-muted/30',
              activeId === o.id && 'bg-muted/50'
            )}
          >
            <div className='flex w-56 shrink-0 items-center gap-2 border-e px-3 py-2.5'>
              <span
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  styleOf(o.status).bar
                )}
              />
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{o.customer}</p>
                <p className='truncate text-xs text-muted-foreground'>
                  {o.product}
                </p>
              </div>
            </div>
            {days.map((d) => {
              const key = toDateKey(d)
              const active = key === o.date
              return (
                <div
                  key={key}
                  className={cn(
                    'relative flex-1 py-2.5',
                    key === todayKey && 'bg-foreground/5'
                  )}
                >
                  {active && (
                    <div
                      className={cn(
                        'mx-0.5 h-5 rounded-md shadow-sm',
                        styleOf(o.status).bar
                      )}
                      title={`${o.customer} · ${o.date}`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================ Shared pieces ============================ */

function EmptyState({ text }: { text: string }) {
  return (
    <div className='flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center'>
      <Inbox className='h-8 w-8 text-muted-foreground/50' />
      <p className='max-w-72 text-sm text-muted-foreground'>{text}</p>
    </div>
  )
}

function StatusPill({
  label,
  style,
  icon: Icon,
}: {
  label: string
  style: (typeof COLOR_STYLES)[ColorKey]
  icon: typeof Circle
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap',
        style.pill
      )}
    >
      <Icon className='h-3 w-3' />
      {label}
    </span>
  )
}

function InlineAdd({
  accentClass,
  onCreate,
}: {
  accentClass: string
  onCreate: (o: NewOrder) => void
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [customer, setCustomer] = useState('')

  if (!open) {
    return (
      <button
        type='button'
        onClick={() => setOpen(true)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition hover:bg-background/40',
          accentClass
        )}
      >
        <Plus className='h-4 w-4' />
        {t('Add Order')}
      </button>
    )
  }

  function save() {
    if (!customer.trim()) return
    onCreate({
      customer: customer.trim(),
      product: '',
      quantity: 1,
      date: today(),
      notes: '',
    })
    setCustomer('')
    setOpen(false)
  }

  return (
    <div className='space-y-2 rounded-md border bg-card p-2 shadow-sm'>
      <Input
        autoFocus
        value={customer}
        onChange={(e) => setCustomer(e.target.value)}
        placeholder={t('Register order')}
        className='h-7 border-none px-0 text-sm shadow-none focus-visible:ring-0'
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      <div className='flex items-center justify-end gap-2 pt-1'>
        <Button variant='ghost' size='sm' onClick={() => setOpen(false)}>
          {t('Cancel')}
        </Button>
        <Button size='sm' onClick={save} disabled={!customer.trim()}>
          {t('Save')}
        </Button>
      </div>
    </div>
  )
}

function AddOrderDialog({ onCreate }: { onCreate: (o: NewOrder) => void }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm'>
          <Plus className='me-2 h-4 w-4' />
          {t('Add Order')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('New Order')}</DialogTitle>
          <DialogDescription>
            {t('Add a customer order to your list.')}
          </DialogDescription>
        </DialogHeader>
        <OrderForm
          onCreate={(data) => {
            onCreate(data)
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function OrderForm({ onCreate }: { onCreate: (o: NewOrder) => void }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const qty = Math.max(1, Math.floor(Number(form.quantity)) || 1)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.customer.trim() || !form.product.trim()) {
      setError(t('Customer name and product are required.'))
      return
    }
    setError('')
    onCreate({
      customer: form.customer.trim(),
      product: form.product.trim(),
      quantity: qty,
      date: form.date,
      notes: form.notes.trim(),
    })
  }

  return (
    <form onSubmit={submit} className='space-y-5'>
      <div className='space-y-1.5'>
        <Label htmlFor='customer'>{t('Customer name')}</Label>
        <Input
          id='customer'
          value={form.customer}
          onChange={(e) => set('customer', e.target.value)}
          placeholder={t('Customer name')}
        />
      </div>

      <div className='space-y-1.5'>
        <Label htmlFor='product'>{t('Product')}</Label>
        <Input
          id='product'
          value={form.product}
          onChange={(e) => set('product', e.target.value)}
          placeholder={t('What did they order?')}
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-1.5'>
          <Label>{t('Quantity')}</Label>
          <div className='flex h-9 items-center justify-between rounded-md border px-1'>
            <button
              type='button'
              onClick={() => set('quantity', String(Math.max(1, qty - 1)))}
              className='flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-muted active:scale-90'
              aria-label={t('Decrease quantity')}
            >
              <Minus className='h-4 w-4' />
            </button>
            <span className='font-semibold tabular-nums'>{qty}</span>
            <button
              type='button'
              onClick={() => set('quantity', String(qty + 1))}
              className='flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-muted active:scale-90'
              aria-label={t('Increase quantity')}
            >
              <Plus className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='date'>{t('Order date')}</Label>
          <Input
            id='date'
            type='date'
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
          />
        </div>
      </div>

      <div className='space-y-1.5'>
        <Label htmlFor='notes'>{t('Notes')}</Label>
        <Textarea
          id='notes'
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder={t('Delivery instructions, special requests...')}
          className='resize-none'
        />
      </div>

      {error && (
        <p className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {error}
        </p>
      )}

      <Button type='submit' className='h-10 w-full'>
        {t('Create order')}
      </Button>
    </form>
  )
}