'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface Vendor {
  id: string
  name: string
  avgRating: number | null
}

interface StoreData {
  id: string
  name: string
}

const EMOJI_CONFIG = [
  {
    value: 1,
    label: 'Muy mal',
    activeCircle: '#FEE2E2',
    activeStroke: '#EF4444',
    activeShadow: '0 0 0 3px rgba(239,68,68,0.2)',
  },
  {
    value: 2,
    label: 'Mal',
    activeCircle: '#FEF9C3',
    activeStroke: '#EAB308',
    activeShadow: '0 0 0 3px rgba(234,179,8,0.2)',
  },
  {
    value: 3,
    label: 'Regular',
    activeCircle: '#F3F4F6',
    activeStroke: '#6B7280',
    activeShadow: '0 0 0 3px rgba(107,114,128,0.2)',
  },
  {
    value: 4,
    label: 'Bien',
    activeCircle: '#D1FAE5',
    activeStroke: '#10B981',
    activeShadow: '0 0 0 3px rgba(16,185,129,0.2)',
  },
  {
    value: 5,
    label: 'Muy bien',
    activeCircle: '#DCFCE7',
    activeStroke: '#1C7C3C',
    activeShadow: '0 0 0 3px rgba(28,124,60,0.2)',
  },
]

function EmojiFace({
  value,
  active,
  onClick,
}: {
  value: number
  active: boolean
  onClick: () => void
}) {
  const cfg = EMOJI_CONFIG[value - 1]
  const circleColor = active ? cfg.activeCircle : '#E5E7EB'
  const strokeColor = active ? cfg.activeStroke : '#9CA3AF'
  const shadow = active ? cfg.activeShadow : 'none'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 cursor-pointer focus:outline-none"
    >
      <div
        style={{ borderRadius: '50%', boxShadow: shadow, transition: 'box-shadow 0.15s' }}
      >
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="24" fill={circleColor} />
          {value === 1 && (
            <>
              <path d="M 14 17 L 22 21" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 38 17 L 30 21" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="19" cy="22" r="2.8" fill={strokeColor} />
              <circle cx="33" cy="22" r="2.8" fill={strokeColor} />
              <path d="M 17 35 Q 26 25 35 35" stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {value === 2 && (
            <>
              <circle cx="19" cy="22" r="2.8" fill={strokeColor} />
              <circle cx="33" cy="22" r="2.8" fill={strokeColor} />
              <path d="M 19 33 Q 26 27 33 33" stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {value === 3 && (
            <>
              <circle cx="19" cy="22" r="2.8" fill={strokeColor} />
              <circle cx="33" cy="22" r="2.8" fill={strokeColor} />
              <path d="M 18 30 L 34 30" stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {value === 4 && (
            <>
              <circle cx="19" cy="22" r="2.8" fill={strokeColor} />
              <circle cx="33" cy="22" r="2.8" fill={strokeColor} />
              <path d="M 19 27 Q 26 34 33 27" stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {value === 5 && (
            <>
              <path d="M 16 22 Q 19 19 22 22" stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 30 22 Q 33 19 36 22" stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <ellipse cx="13" cy="32" rx="4" ry="2.5" fill="rgba(255,255,255,0.22)" />
              <ellipse cx="39" cy="32" rx="4" ry="2.5" fill="rgba(255,255,255,0.22)" />
              <path d="M 16 27 Q 26 40 36 27" stroke={strokeColor} strokeWidth="2.5" fill="rgba(255,255,255,0.25)" strokeLinecap="round" />
            </>
          )}
        </svg>
      </div>
    </button>
  )
}

function VendorInitial({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 font-semibold text-sm flex items-center justify-content-center shrink-0 flex items-center justify-center">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function FeedbackPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const router = useRouter()

  const [store, setStore] = useState<StoreData | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [rating, setRating] = useState<number | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vendors?storeSlug=${storeSlug}`)
      .then((r) => r.json())
      .then((data) => {
        setVendors(data.vendors ?? [])
        setStore(data.store ?? null)
      })
      .finally(() => setLoading(false))
  }, [storeSlug])

  const canSubmit = rating !== null
  const storeName = store?.name ?? 'Carioca · Tienda Centro'

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug, rating, vendorId, comment }),
      })
      if (res.ok) {
        router.push(`/feedback/${storeSlug}/success`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="bg-primary px-5 pt-10 pb-7">
        {/* Logo + título de la app */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-9 rounded-lg overflow-hidden shrink-0 shadow-sm">
            <Image
              src="/logo-carioca.jpg"
              alt="Carioca"
              width={56}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-white font-bold text-[17px] leading-tight">Carioca Te Escucha</p>
            <p className="text-white/60 text-[12px]">{storeName}</p>
          </div>
        </div>
        <h1 className="text-white text-[22px] font-bold leading-snug">¿Cómo fue tu visita hoy?</h1>
      </div>

      {/* Card overlapping header */}
      <div className="flex-1 overflow-y-auto scroll-hide">
        <div className="mx-4 -mt-3 bg-white rounded-2xl p-5 shadow-card mb-6">

          {/* Sección: Experiencia */}
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
              Tu experiencia
            </span>
          </div>

          <div className="flex justify-between px-1 pb-5">
            {[1, 2, 3, 4, 5].map((v) => (
              <EmojiFace
                key={v}
                value={v}
                active={rating === v}
                onClick={() => setRating(v)}
              />
            ))}
          </div>

          <div className="h-px bg-gray-200 -mx-5 mb-5" />

          {/* Sección: Vendedor (opcional) */}
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
              ¿Quién te atendió?
            </span>
            <span className="text-[12px] text-gray-400">Opcional</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {vendors.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVendorId(vendorId === v.id ? null : v.id)}
                className="flex items-center gap-2.5 p-3 rounded-xl border-2 bg-white transition-all text-left"
                style={{
                  borderColor: vendorId === v.id ? '#1C7C3C' : '#E5E7EB',
                  backgroundColor: vendorId === v.id ? '#F0FDF4' : '#FFFFFF',
                }}
              >
                <VendorInitial name={v.name} />
                <div>
                  <div className="text-[14px] font-semibold text-gray-900">{v.name}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="h-px bg-gray-200 -mx-5 mb-5" />

          {/* Sección: Comentario */}
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
              Comentario (opcional)
            </span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribe algo breve..."
            maxLength={200}
            className="w-full min-h-[80px] rounded-[10px] border border-gray-200 px-3 py-3 font-sans text-[15px] text-gray-900 bg-bg-base resize-none outline-none focus:border-primary transition-colors"
            style={{ borderWidth: '1.5px' }}
          />
          <div className="text-[12px] text-gray-400 text-right">
            {comment.length}/200
          </div>

          {/* Espacio para que el botón fijo no tape contenido */}
          <div className="h-24" />
        </div>
      </div>

      {/* Botón enviar — fijo en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-4 pt-3 pb-8 border-t border-gray-100">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl font-bold text-[16px] tracking-tight transition-all"
          style={{
            background: canSubmit ? '#1C7C3C' : '#E5E7EB',
            color: canSubmit ? '#FFFFFF' : '#9CA3AF',
            cursor: canSubmit ? 'pointer' : 'default',
          }}
        >
          {submitting ? 'Enviando…' : 'Enviar mi opinión →'}
        </button>
        {!canSubmit && (
          <p className="text-[12px] text-gray-400 text-center mt-1.5">
            Selecciona una carita para continuar
          </p>
        )}
      </div>
    </div>
  )
}
