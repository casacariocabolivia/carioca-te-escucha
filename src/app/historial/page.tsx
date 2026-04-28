'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface FeedbackItem {
  id: string
  rating: number
  comment: string | null
  createdAt: string
}

interface DistItem {
  rating: number
  count: number
}

interface Stats {
  total: number
  avgRating: number | null
  distribution: DistItem[]
}

interface VendorData {
  id: string
  name: string
}

const RATING_LABEL: Record<number, string> = {
  1: 'Muy mal',
  2: 'Mal',
  3: 'Regular',
  4: 'Bien',
  5: 'Muy bien',
}

const RATING_COLOR: Record<number, string> = {
  1: '#EF4444',
  2: '#EAB308',
  3: '#6B7280',
  4: '#10B981',
  5: '#1C7C3C',
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

function HistorialContent() {
  const searchParams = useSearchParams()
  const vendorId = searchParams.get('vendorId') ?? ''

  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [vendors, setVendors] = useState<VendorData[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState(vendorId)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/vendors?storeSlug=centro')
      .then((r) => r.json())
      .then((d) => {
        const list = d.vendors ?? []
        setVendors(list)
        if (!selectedVendorId && list.length > 0) {
          setSelectedVendorId(list[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (!selectedVendorId) return
    setLoading(true)
    fetch(`/api/historial?vendorId=${selectedVendorId}`)
      .then((r) => r.json())
      .then((d) => {
        setVendor(d.vendor ?? null)
        setFeedbacks(d.feedbacks ?? [])
        setStats(d.stats ?? null)
      })
      .finally(() => setLoading(false))
  }, [selectedVendorId])

  const maxCount = stats
    ? Math.max(...stats.distribution.map((d) => d.count), 1)
    : 1

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-5 text-white">
        <p className="text-white/70 text-[13px] mb-1">Historial de calificaciones</p>
        <h1 className="text-[20px] font-bold">{vendor?.name ?? 'Vendedor'}</h1>

        {stats && (
          <div className="flex gap-4 mt-3">
            <div>
              <div className="text-[24px] font-bold">
                {stats.avgRating != null ? `★ ${stats.avgRating}` : '—'}
              </div>
              <div className="text-[11px] text-white/60">Promedio</div>
            </div>
            <div>
              <div className="text-[24px] font-bold">{stats.total}</div>
              <div className="text-[11px] text-white/60">Calificaciones</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-hide">
        {/* Selector de vendedor */}
        <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-card">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ver historial de
          </p>
          <div className="flex gap-2 flex-wrap">
            {vendors.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVendorId(v.id)}
                className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all"
                style={{
                  background: selectedVendorId === v.id ? '#1C7C3C' : '#F3F4F6',
                  color: selectedVendorId === v.id ? '#FFFFFF' : '#6B7280',
                }}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Distribución */}
        {stats && (
          <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-card">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Distribución
            </p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((r) => {
                const item = stats.distribution.find((d) => d.rating === r)
                const count = item?.count ?? 0
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                return (
                  <div key={r} className="flex items-center gap-2">
                    <span className="text-[12px] text-gray-500 w-14 shrink-0">
                      {RATING_LABEL[r]}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: RATING_COLOR[r],
                        }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-gray-600 w-5 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Feedback list */}
        <div className="px-4 mt-3 pb-6 space-y-3">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
            Comentarios recientes
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-[15px]">
              Sin feedback registrado
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="bg-white rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold"
                      style={{
                        background: RATING_COLOR[fb.rating] + '22',
                        color: RATING_COLOR[fb.rating],
                      }}
                    >
                      {fb.rating}
                    </div>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: RATING_COLOR[fb.rating] }}
                    >
                      {RATING_LABEL[fb.rating]}
                    </span>
                  </div>
                  <span className="text-[12px] text-gray-400">{timeAgo(fb.createdAt)}</span>
                </div>
                {fb.comment ? (
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    &ldquo;{fb.comment}&rdquo;
                  </p>
                ) : (
                  <p className="text-[13px] text-gray-400 italic">Sin comentario</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-white border-t border-gray-100 flex">
        <Link href="/dashboard" className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#9CA3AF">
            <rect x="2" y="2" width="7" height="7" rx="1.5" />
            <rect x="11" y="2" width="7" height="7" rx="1.5" />
            <rect x="2" y="11" width="7" height="7" rx="1.5" />
            <rect x="11" y="11" width="7" height="7" rx="1.5" />
          </svg>
          <span className="text-[10px] font-semibold text-gray-400">Tablero</span>
        </Link>
        <Link href="/historial" className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1C7C3C" strokeWidth="1.5">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v4l3 2" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-semibold text-primary">Historial</span>
        </Link>
        <Link href="/alertas" className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
            <path d="M10 2a6 6 0 016 6v3l1.5 2.5H2.5L4 11V8a6 6 0 016-6z" />
            <path d="M8 16a2 2 0 004 0" />
          </svg>
          <span className="text-[10px] font-semibold text-gray-400">Alertas</span>
        </Link>
      </nav>
    </div>
  )
}

export default function HistorialPage() {
  return (
    <Suspense>
      <HistorialContent />
    </Suspense>
  )
}
