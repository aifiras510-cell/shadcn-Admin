/* eslint-disable react-hooks/refs */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Circle,
  ClipboardList,
  Copy,
  Pencil,
  Search as SearchIcon,
  Trash2,
  X,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  type ColorKey,
  type Order,
  useOrdersStore,
} from '../dashboard/orders-store'

const COLOR_STYLES: Record<ColorKey, { pill: string; dot: string }> = {
  zinc: { pill: 'bg-zinc-600 text-white', dot: 'bg-zinc-500' },
  blue: { pill: 'bg-blue-600 text-white', dot: 'bg-blue-500' },
  emerald: { pill: 'bg-emerald-600 text-white', dot: 'bg-emerald-500' },
  amber: { pill: 'bg-amber-600 text-white', dot: 'bg-amber-500' },
  violet: { pill: 'bg-violet-600 text-white', dot: 'bg-violet-500' },
  rose: { pill: 'bg-rose-600 text-white', dot: 'bg-rose-500' },
  sky: { pill: 'bg-sky-600 text-white', dot: 'bg-sky-500' },
}

const iconBtn =
  'flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-muted active:scale-90 disabled:pointer-events-none disabled:opacity-30'

/* Smooth enter/exit for the bottom action bar (no animation plugin needed) */
function useBarTransition<T>(item: T | null) {
  const open = item !== null
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const last = useRef<T | null>(null)
  if (item !== null) last.current = item

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

export function Tasks() {
  const { t } = useLanguage()
  const { orders, groups, setOrders } = useOrdersStore()
  const [query, setQuery] = useState('')
  const [queue, setQueue] = useState<'all' | 'open' | 'handled'>('open')
  const [barId, setBarId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const completedGroupId = groups[groups.length - 1]?.id ?? 'Delivered'
  const pending = orders.filter(
    (order) => order.status !== completedGroupId
  ).length
  const completed = orders.length - pending
  const normalizedQuery = query.trim().toLowerCase()
  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesQuery =
          `${order.customer} ${order.product} ${order.notes} ${order.id}`
            .toLowerCase()
            .includes(normalizedQuery)
        const isCompleted = order.status === completedGroupId
        const matchesQueue =
          queue === 'all' || (queue === 'handled' ? isCompleted : !isCompleted)
        return matchesQuery && matchesQueue
      }),
    [completedGroupId, normalizedQuery, orders, queue]
  )

  const barOrder = orders.find((o) => o.id === barId) ?? null
  const anim = useBarTransition(barOrder)
  const shown = anim.data
  const editOrder = orders.find((o) => o.id === editId) ?? null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBarId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function toggleCompleted(id: number) {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id) return order
        const isCompleted = order.status === completedGroupId
        return {
          ...order,
          status: isCompleted ? (groups[0]?.id ?? 'Pending') : completedGroupId,
        }
      })
    )
  }

  function updateOrder(id: number, patch: Partial<Order>) {
    setOrders((current) =>
      current.map((o) => (o.id === id ? { ...o, ...patch } : o))
    )
  }

  function moveTo(id: number, status: string) {
    updateOrder(id, { status })
  }

  function duplicateOrder(id: number) {
    setOrders((current) => {
      const idx = current.findIndex((o) => o.id === id)
      if (idx < 0) return current
      const copy: Order = { ...current[idx], id: Date.now() }
      return [...current.slice(0, idx + 1), copy, ...current.slice(idx + 1)]
    })
  }

  function removeOrder(id: number) {
    setOrders((current) => current.filter((o) => o.id !== id))
    setBarId((cur) => (cur === id ? null : cur))
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-5 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div>
            <div className='mb-2 flex items-center gap-2 text-sm font-medium text-primary'>
              <ClipboardList className='h-4 w-4' />
              {t('Orders')}
            </div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('Request monitor')}
            </h2>
            <p className='text-muted-foreground'>
              {t('Monitor and complete incoming requests from the dashboard.')}
            </p>
          </div>
          <div className='grid grid-cols-3 overflow-hidden rounded-lg border bg-card text-center shadow-sm'>
            <Summary value={orders.length} label={t('Total Orders')} />
            <Summary
              value={pending}
              label={t('Open Orders')}
              accent='text-amber-600 dark:text-amber-400'
            />
            <Summary
              value={completed}
              label={t('Handled')}
              accent='text-emerald-600 dark:text-emerald-400'
            />
          </div>
        </div>

        <section className='overflow-hidden rounded-xl border bg-card shadow-sm'>
          <div className='flex flex-col gap-3 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground'>
                  {pending}
                </span>
                <h3 className='font-semibold'>{t('Open requests')}</h3>
              </div>
              <p className='text-xs text-muted-foreground'>
                {t('Tap the circle to mark a request as handled.')}
              </p>
            </div>
            <div className='flex flex-col gap-2 sm:items-end'>
              <div
                className='inline-flex w-full rounded-lg bg-muted p-1 sm:w-auto'
                aria-label={t('Request status filter')}
              >
                {(
                  [
                    ['open', t('Open'), pending],
                    ['handled', t('Handled'), completed],
                    ['all', t('All'), orders.length],
                  ] as const
                ).map(([value, label, count]) => (
                  <button
                    key={value}
                    type='button'
                    onClick={() => setQueue(value)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-none',
                      queue === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {label}
                    <span className='tabular-nums'>{count}</span>
                  </button>
                ))}
              </div>
              <div className='relative w-full sm:w-72'>
                <SearchIcon className='pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('Search customer or product')}
                  className='ps-9'
                />
              </div>
            </div>
          </div>

          <div className='hidden overflow-x-auto md:block'>
            <table className='w-full text-sm'>
              <thead className='border-b bg-muted/30 text-xs font-medium text-muted-foreground'>
                <tr>
                  <th className='w-14 px-4 py-3 text-center'>{t('Handled')}</th>
                  <th className='px-4 py-3 text-start'>{t('Customer')}</th>
                  <th className='px-4 py-3 text-start'>{t('Product')}</th>
                  <th className='px-4 py-3 text-center'>{t('Qty')}</th>
                  <th className='px-4 py-3 text-start'>{t('Date')}</th>
                  <th className='px-4 py-3 text-start'>{t('Status')}</th>
                  <th className='px-4 py-3 text-start'>{t('Notes')}</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {visibleOrders.map((order) => {
                  const isCompleted = order.status === completedGroupId
                  const group = groups.find((item) => item.id === order.status)
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setBarId(order.id)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/40',
                        isCompleted && 'bg-muted/20',
                        barId === order.id && 'bg-muted/60'
                      )}
                    >
                      <td className='px-4 py-3 text-center'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCompleted(order.id)
                          }}
                          aria-label={
                            isCompleted
                              ? t('Mark as pending')
                              : t('Mark complete')
                          }
                          title={
                            isCompleted
                              ? t('Mark as pending')
                              : t('Mark complete')
                          }
                          className={cn(
                            'h-8 w-8 rounded-full border transition-all',
                            isCompleted
                              ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white'
                              : 'border-muted-foreground/40 text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary'
                          )}
                        >
                          {isCompleted ? (
                            <Check className='h-4 w-4' />
                          ) : (
                            <Circle className='h-3.5 w-3.5' />
                          )}
                        </Button>
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 font-medium',
                          isCompleted && 'text-muted-foreground line-through'
                        )}
                      >
                        {order.customer}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3',
                          isCompleted && 'text-muted-foreground line-through'
                        )}
                      >
                        {order.product}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-center tabular-nums',
                          isCompleted && 'text-muted-foreground line-through'
                        )}
                      >
                        {order.quantity}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-muted-foreground tabular-nums',
                          isCompleted && 'line-through'
                        )}
                      >
                        {order.date}
                      </td>
                      <td className='px-4 py-3'>
                        <Badge
                          variant={isCompleted ? 'default' : 'secondary'}
                          className={cn(
                            isCompleted && 'bg-emerald-600 hover:bg-emerald-600'
                          )}
                        >
                          {t(
                            isCompleted
                              ? 'Handled'
                              : (group?.name ?? order.status)
                          )}
                        </Badge>
                      </td>
                      <td
                        className={cn(
                          'max-w-72 truncate px-4 py-3 text-muted-foreground',
                          isCompleted && 'line-through'
                        )}
                      >
                        {order.notes || '—'}
                      </td>
                    </tr>
                  )
                })}
                {!visibleOrders.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-4 py-14 text-center text-muted-foreground'
                    >
                      {orders.length
                        ? t('No orders match this filter.')
                        : t('No orders yet. Register your first one.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className='divide-y md:hidden'>
            {visibleOrders.map((order) => {
              const isCompleted = order.status === completedGroupId
              const group = groups.find((item) => item.id === order.status)
              return (
                <article
                  key={order.id}
                  onClick={() => setBarId(order.id)}
                  className={cn(
                    'flex cursor-pointer gap-3 p-4',
                    isCompleted && 'bg-muted/20',
                    barId === order.id && 'bg-muted/60'
                  )}
                >
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCompleted(order.id)
                    }}
                    aria-label={
                      isCompleted ? t('Mark as pending') : t('Mark complete')
                    }
                    className={cn(
                      'mt-0.5 h-9 w-9 shrink-0 rounded-full border',
                      isCompleted
                        ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white'
                        : 'border-muted-foreground/40 text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    {isCompleted ? (
                      <Check className='h-4 w-4' />
                    ) : (
                      <Circle className='h-3.5 w-3.5' />
                    )}
                  </Button>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p
                          className={cn(
                            'truncate font-semibold',
                            isCompleted && 'text-muted-foreground line-through'
                          )}
                        >
                          {order.customer}
                        </p>
                        <p
                          className={cn(
                            'truncate text-sm text-muted-foreground',
                            isCompleted && 'line-through'
                          )}
                        >
                          {order.product}
                        </p>
                      </div>
                      <Badge
                        variant={isCompleted ? 'default' : 'secondary'}
                        className={cn(
                          'shrink-0',
                          isCompleted && 'bg-emerald-600 hover:bg-emerald-600'
                        )}
                      >
                        {t(
                          isCompleted
                            ? 'Handled'
                            : (group?.name ?? order.status)
                        )}
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        'mt-2 flex items-center gap-3 text-xs text-muted-foreground',
                        isCompleted && 'line-through'
                      )}
                    >
                      <span>
                        {t('Qty')}: {order.quantity}
                      </span>
                      <span className='tabular-nums'>{order.date}</span>
                    </div>
                    {order.notes && (
                      <p
                        className={cn(
                          'mt-2 text-xs text-muted-foreground',
                          isCompleted && 'line-through'
                        )}
                      >
                        {order.notes}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
            {!visibleOrders.length && (
              <p className='px-4 py-14 text-center text-sm text-muted-foreground'>
                {orders.length
                  ? t('No orders match this filter.')
                  : t('No orders yet. Register your first one.')}
              </p>
            )}
          </div>
        </section>
      </Main>

      {/* ===== Bottom action bar ===== */}
      {anim.mounted && shown && (
        <div className='pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4'>
          <div
            className={cn(
              'pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-2xl ring-1 ring-foreground/5 transition-all motion-reduce:transition-none',
              anim.visible
                ? 'translate-y-0 scale-100 opacity-100 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
                : 'translate-y-8 scale-95 opacity-0 duration-200 ease-in'
            )}
          >
            <div className='flex min-w-0 items-center gap-2 px-2'>
              <span
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  COLOR_STYLES[
                    groups.find((g) => g.id === shown.status)?.color ?? 'zinc'
                  ].dot
                )}
              />
              <div className='max-w-48 min-w-0'>
                <p className='truncate text-sm font-semibold'>
                  {shown.customer}
                </p>
                <p className='truncate text-[11px] text-muted-foreground'>
                  {shown.product || '—'} · × {shown.quantity}
                </p>
              </div>
            </div>

            <div className='h-8 w-px bg-border' />

            <div className='flex flex-wrap items-center gap-1'>
              {groups.map((g) => {
                const active = shown.status === g.id
                return (
                  <button
                    key={g.id}
                    type='button'
                    disabled={active}
                    onClick={() => moveTo(shown.id, g.id)}
                    className={cn(
                      'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition active:scale-95 enabled:hover:-translate-y-0.5',
                      active
                        ? COLOR_STYLES[g.color].pill
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(g.name)}
                  </button>
                )
              })}
            </div>

            <div className='h-8 w-px bg-border' />

            <div className='flex items-center gap-1'>
              <button
                type='button'
                onClick={() => moveTo(shown.id, completedGroupId)}
                disabled={shown.status === completedGroupId}
                aria-label={t('Mark complete')}
                title={t('Mark complete')}
                className={cn(iconBtn, 'hover:text-emerald-500')}
              >
                <Check className='h-4 w-4' />
              </button>
              <button
                type='button'
                onClick={() => setEditId(shown.id)}
                aria-label={t('Edit order')}
                title={t('Edit order')}
                className={iconBtn}
              >
                <Pencil className='h-4 w-4' />
              </button>
              <button
                type='button'
                onClick={() => duplicateOrder(shown.id)}
                aria-label={t('Duplicate order')}
                title={t('Duplicate order')}
                className={iconBtn}
              >
                <Copy className='h-4 w-4' />
              </button>
              <button
                type='button'
                onClick={() => removeOrder(shown.id)}
                aria-label={t('Delete order')}
                title={t('Delete order')}
                className={cn(
                  iconBtn,
                  'hover:bg-destructive/10 hover:text-destructive'
                )}
              >
                <Trash2 className='h-4 w-4' />
              </button>
              <div className='mx-1 h-6 w-px bg-border' />
              <button
                type='button'
                onClick={() => setBarId(null)}
                aria-label={t('Close')}
                title={t('Close')}
                className={iconBtn}
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit dialog ===== */}
      <Dialog
        open={!!editOrder}
        onOpenChange={(open) => !open && setEditId(null)}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('Edit order')}</DialogTitle>
            <DialogDescription className='sr-only'>
              {t('Order details')}
            </DialogDescription>
          </DialogHeader>
          {editOrder && (
            <div className='space-y-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='edit-customer'>{t('Customer name')}</Label>
                <Input
                  id='edit-customer'
                  value={editOrder.customer}
                  onChange={(e) =>
                    updateOrder(editOrder.id, { customer: e.target.value })
                  }
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='edit-product'>{t('Product')}</Label>
                <Input
                  id='edit-product'
                  value={editOrder.product}
                  onChange={(e) =>
                    updateOrder(editOrder.id, { product: e.target.value })
                  }
                  placeholder={t('What did they order?')}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <Label htmlFor='edit-qty'>{t('Quantity')}</Label>
                  <Input
                    id='edit-qty'
                    type='number'
                    min={1}
                    value={editOrder.quantity}
                    onChange={(e) =>
                      updateOrder(editOrder.id, {
                        quantity: Math.max(
                          1,
                          Math.floor(Number(e.target.value)) || 1
                        ),
                      })
                    }
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='edit-date'>{t('Order date')}</Label>
                  <Input
                    id='edit-date'
                    type='date'
                    value={editOrder.date}
                    onChange={(e) =>
                      updateOrder(editOrder.id, { date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='edit-notes'>{t('Notes')}</Label>
                <Textarea
                  id='edit-notes'
                  rows={3}
                  value={editOrder.notes}
                  onChange={(e) =>
                    updateOrder(editOrder.id, { notes: e.target.value })
                  }
                  className='resize-none'
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Summary({
  value,
  label,
  accent,
}: {
  value: number
  label: string
  accent?: string
}) {
  return (
    <div className='min-w-0 border-e px-3 py-2.5 last:border-e-0 sm:px-4'>
      <p className={cn('text-lg font-bold tabular-nums', accent)}>{value}</p>
      <p className='text-[11px] text-muted-foreground'>{label}</p>
    </div>
  )
}
