'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Vendor {
  id: string
  name: string
}

interface FeedbackItem {
  id: string
  rating: number
  comment: string | null
  vendor: Vendor | null
  reviewed: boolean
  createdAt: string
  alerts: { id: string; status: string }[]
}

interface Stats {
  total: number
  avgRating: number | null
  pending: number
  openAlerts: number
}

const EMOJI_MINI_CFG: Record<
  number,
  { bg: string; stroke: string; label: string }
> = {
  1: { bg: '#FEE2E2', stroke: '#EF4444', label: 'Muy mal' },
  2: { bg: '#FEF9C3', stroke: '#EAB308', label: 'Mal' },
  3: { bg: '#F3F4F6', stroke: '#6B7280', label: 'Regular' },
  4: { bg: '#D1FAE5', stroke: '#10B981', label: 'Bien' },
  5: { bg: '#DCFCE7', stroke: '#1C7C3C', label: 'Muy bien' },
}

function MiniEmoji({ rating }: { rating: number }) {
  const cfg = EMOJI_MINI_CFG[rating] ?? EMOJI_MINI_CFG[3]
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
      style={{ background: cfg.bg, color: cfg.stroke }}
    >
      {rating}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

function severityBadge(rating: number) {
  if (rating <= 2) return <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Crítico</span>
  if (rating === 3) return <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Regular</span>
  return null
}

export default function DashboardPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filter, setFilter] = useState<'todos' | 'critico' | 'pending'>('todos')
  const [vendorFilter, setVendorFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ storeSlug: 'centro' })
    if (vendorFilter) params.set('vendorId', vendorFilter)
    if (filter === 'critico') params.set('severity', 'critico')
    if (filter === 'pending') params.set('pending', '1')

    const [dashRes, vendorRes] = await Promise.all([
      fetch(`/api/dashboard?${params}`),
      fetch('/api/vendors?storeSlug=centro'),
    ])
    const dash = await dashRes.json()
    const vend = await vendorRes.json()

    setFeedbacks(dash.feedbacks ?? [])
    setStats(dash.stats ?? null)
    setVendors(vend.vendors ?? [])
    setLoading(false)
  }, [filter, vendorFilter])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  async function handleReview(id: string) {
    setActionLoading(id)
    await fetch(`/api/feedback/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reviewed' }),
    })
    await loadData()
    setActionLoading(null)
  }

  async function handleTask(id: string) {
    setActionLoading(id + '_task')
    await fetch(`/api/feedback/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_task' }),
    })
    await loadData()
    setActionLoading(null)
  }

  const openAlerts = feedbacks.filter((f) =>
    f.alerts.some((a) => a.status === 'OPEN'),
  )

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-5 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/70 text-[13px]">Supervisor</p>
            <h1 className="text-[20px] font-bold">Tablero de feedback</h1>
          </div>
          <Link href="/alertas" className="text-[13px] font-semibold bg-white/15 px-3 py-1.5 rounded-full text-white">
            Alertas {stats?.openAlerts ? `(${stats.openAlerts})` : ''}
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: stats.total },
              {
                label: 'Promedio',
                value: stats.avgRating != null ? `★ ${stats.avgRating}` : '—',
              },
              { label: 'Pendientes', value: stats.pending, highlight: stats.pending > 0 },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl px-3 py-2.5">
                <div
                  className={`text-[20px] font-bold ${s.highlight ? 'text-accent' : 'text-white'}`}
                >
                  {s.value}
                </div>
                <div className="text-[11px] text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-hide">
        {/* Alerta crítica banner */}
        {openAlerts.length > 0 && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 13H2L8 2Z" fill="#EF4444" />
                <path d="M8 6V9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.7" fill="white" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-red-700">
                {openAlerts.length} alerta{openAlerts.length > 1 ? 's' : ''} crítica{openAlerts.length > 1 ? 's' : ''} sin resolver
              </p>
              <p className="text-[12px] text-red-500">Responde en menos de 30 minutos</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scroll-hide">
          {(
            [
              { key: 'todos', label: 'Todos' },
              { key: 'critico', label: 'Críticos' },
              { key: 'pending', label: 'Sin revisar' },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all"
              style={{
                background: filter === f.key ? '#1C7C3C' : '#FFFFFF',
                color: filter === f.key ? '#FFFFFF' : '#6B7280',
                border: filter === f.key ? 'none' : '1.5px solid #E5E7EB',
              }}
            >
              {f.label}
            </button>
          ))}

          {/* Filtro vendedor */}
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-1.5 rounded-full text-[13px] font-semibold text-gray-500 bg-white border border-gray-200 outline-none"
          >
            <option value="">Todos los vendedores</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lista de feedback */}
        <div className="px-4 pb-6 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-[15px]">Sin feedback para mostrar</p>
            </div>
          ) : (
            feedbacks.map((fb) => {
              const hasCriticalAlert = fb.alerts.some((a) => a.status === 'OPEN')
              const isReviewed = fb.reviewed

              return (
                <div
                  key={fb.id}
                  className="bg-white rounded-2xl p-4 shadow-card"
                  style={{ borderLeft: hasCriticalAlert ? '3px solid #EF4444' : 'none' }}
                >
                  <div className="flex items-start gap-3">
                    <MiniEmoji rating={fb.rating} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-gray-900">
                            {fb.vendor?.name ?? 'Sin vendedor'}
                          </span>
                          {severityBadge(fb.rating)}
                          {isReviewed && (
                            <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              Revisado
                            </span>
                          )}
                        </div>
                        <span className="text-[12px] text-gray-400 shrink-0 ml-2">
                          {timeAgo(fb.createdAt)}
                        </span>
                      </div>

                      {fb.comment ? (
                        <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">
                          &ldquo;{fb.comment}&rdquo;
                        </p>
                      ) : (
                        <p className="text-[13px] text-gray-400 italic">Sin comentario</p>
                      )}
                    </div>
                  </div>

                  {!isReviewed && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleReview(fb.id)}
                        disabled={actionLoading === fb.id}
                        className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-primary border border-primary/30 bg-primary/5 transition-opacity disabled:opacity-50"
                      >
                        {actionLoading === fb.id ? '…' : '✓ Marcar revisado'}
                      </button>
                      {hasCriticalAlert && (
                        <button
                          onClick={() => handleTask(fb.id)}
                          disabled={actionLoading === fb.id + '_task'}
                          className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-white bg-primary transition-opacity disabled:opacity-50"
                        >
                          {actionLoading === fb.id + '_task' ? '…' : '+ Crear tarea'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Nav bottom */}
      <nav className="bg-white border-t border-gray-100 flex">
        <Link href="/dashboard" className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#1C7C3C">
            <rect x="2" y="2" width="7" height="7" rx="1.5" />
            <rect x="11" y="2" width="7" height="7" rx="1.5" />
            <rect x="2" y="11" width="7" height="7" rx="1.5" />
            <rect x="11" y="11" width="7" height="7" rx="1.5" />
          </svg>
          <span className="text-[10px] font-semibold text-primary">Tablero</span>
        </Link>
        <Link href="/historial" className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v4l3 2" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-semibold text-gray-400">Historial</span>
        </Link>
        <Link href="/alertas" className="flex-1 py-3 flex flex-col items-center gap-0.5 relative">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
            <path d="M10 2a6 6 0 016 6v3l1.5 2.5H2.5L4 11V8a6 6 0 016-6z" />
            <path d="M8 16a2 2 0 004 0" />
          </svg>
          {stats?.openAlerts ? (
            <span className="absolute top-2 right-4 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
              {stats.openAlerts}
            </span>
          ) : null}
          <span className="text-[10px] font-semibold text-gray-400">Alertas</span>
        </Link>
      </nav>
    </div>
  )
}
