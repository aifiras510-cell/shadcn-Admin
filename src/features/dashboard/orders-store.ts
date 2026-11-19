import { create } from 'zustand'

export type ColorKey =
  | 'zinc'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'violet'
  | 'rose'
  | 'sky'
export type Priority = 'low' | 'normal' | 'high'

export type Comment = { id: number; text: string; at: string }
export type Activity = { id: number; text: string; at: string }

export type Order = {
  id: number
  customer: string
  product: string
  quantity: number
  date: string
  notes: string
  status: string
  dueDate?: string
  priority?: Priority
  tags?: string[]
  comments?: Comment[]
  activity?: Activity[]
}

export type Group = { id: string; name: string; color: ColorKey }

type Updater<T> = T | ((current: T) => T)

const STORAGE_KEY = 'orders-v4'
const GROUPS_KEY = 'orders-groups-v1'

export const DEFAULT_GROUPS: Group[] = [
  { id: 'Pending', name: 'Pending', color: 'zinc' },
  { id: 'Processing', name: 'Processing', color: 'blue' },
  { id: 'Delivered', name: 'Delivered', color: 'emerald' },
]

const read = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Keep the request monitor usable when browser storage is unavailable.
  }
}

type OrdersState = {
  orders: Order[]
  groups: Group[]
  setOrders: (next: Updater<Order[]>) => void
  setGroups: (next: Updater<Group[]>) => void
}

export const useOrdersStore = create<OrdersState>()((set) => ({
  orders: read<Order[]>(STORAGE_KEY, []),
  groups: read<Group[]>(GROUPS_KEY, DEFAULT_GROUPS),
  setOrders: (next) =>
    set((state) => {
      const orders = typeof next === 'function' ? next(state.orders) : next
      save(STORAGE_KEY, orders)
      return { orders }
    }),
  setGroups: (next) =>
    set((state) => {
      const groups = typeof next === 'function' ? next(state.groups) : next
      save(GROUPS_KEY, groups)
      return { groups }
    }),
}))
