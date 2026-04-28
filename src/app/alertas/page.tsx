'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AlertRule {
  id: string
  name: string
  type: string
  operator: string | null
  value: string
  vendorId: string | null
  active: boolean
  vendor: { id: string; name: string } | null
}

interface OpenAlert {
  id: string
  status: string
  createdAt: string
  rule: { id: string; name: string }
  feedback: {
    id: string
    rating: number
    comment: string | null
    vendor: { id: string; name: string } | null
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

function ruleDescription(rule: AlertRule): string {
  if (rule.type === 'THRESHOLD') {
    return `Calificación ${rule.operator} ${rule.value}${rule.vendor ? ` · ${rule.vendor.name}` : ' · Global'}`
  }
  if (rule.type === 'KEYWORD') {
    return `Palabra clave: "${rule.value}"${rule.vendor ? ` · ${rule.vendor.name}` : ' · Global'}`
  }
  return `Regex: ${rule.value}`
}

export default function AlertasPage() {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [openAlerts, setOpenAlerts] = useState<OpenAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewRule, setShowNewRule] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'THRESHOLD',
    operator: '<=',
    value: '',
  })

  async function load() {
    const res = await fetch('/api/alertas?storeSlug=centro')
    const data = await res.json()
    setRules(data.rules ?? [])
    setOpenAlerts(data.openAlerts ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleRule(id: string, active: boolean) {
    await fetch('/api/alertas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    load()
  }

  async function deleteRule(id: string) {
    await fetch(`/api/alertas?id=${id}`, { method: 'DELETE' })
    load()
  }

  async function resolveAlert(feedbackId: string) {
    await fetch(`/api/feedback/${feedbackId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reviewed' }),
    })
    load()
  }

  async function createTaskFromAlert(feedbackId: string) {
    await fetch(`/api/feedback/${feedbackId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_task' }),
    })
    load()
  }

  async function handleAddRule() {
    if (!newRule.name || !newRule.value) return
    await fetch('/api/alertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeSlug: 'centro', ...newRule }),
    })
    setShowNewRule(false)
    setNewRule({ name: '', type: 'THRESHOLD', operator: '<=', value: '' })
    load()
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="bg-primary px-5 pt-12 pb-5 text-white">
        <p className="text-white/70 text-[13px] mb-1">Supervisor</p>
        <h1 className="text-[20px] font-bold">Alertas críticas</h1>
        {openAlerts.length > 0 && (
          <p className="text-accent text-[13px] font-semibold mt-1">
            {openAlerts.length} alerta{openAlerts.length > 1 ? 's' : ''} abiert{openAlerts.length > 1 ? 'as' : 'a'}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-hide pb-6">
        {/* Alertas abiertas */}
        {openAlerts.length > 0 && (
          <div className="px-4 mt-4">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Alertas abiertas
            </p>
            <div className="space-y-3">
              {openAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-2xl p-4 shadow-card border-l-4 border-red-400"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[12px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {alert.rule.name}
                    </span>
                    <span className="text-[12px] text-gray-400">{timeAgo(alert.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 font-bold text-[12px] flex items-center justify-center">
                      {alert.feedback.rating}
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800">
                      {alert.feedback.vendor?.name ?? 'Sin vendedor'}
                    </span>
                  </div>
                  {alert.feedback.comment && (
                    <p className="text-[13px] text-gray-600 mb-3">&ldquo;{alert.feedback.comment}&rdquo;</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveAlert(alert.feedback.id)}
                      className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-primary border border-primary/30 bg-primary/5"
                    >
                      ✓ Resolver
                    </button>
                    <button
                      onClick={() => createTaskFromAlert(alert.feedback.id)}
                      className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-white bg-primary"
                    >
                      + Crear tarea
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reglas */}
        <div className="px-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
              Reglas configuradas
            </p>
            <button
              onClick={() => setShowNewRule(!showNewRule)}
              className="text-[13px] font-semibold text-primary"
            >
              + Nueva regla
            </button>
          </div>

          {/* Formulario nueva regla */}
          {showNewRule && (
            <div className="bg-white rounded-2xl p-4 shadow-card mb-3">
              <p className="text-[13px] font-semibold text-gray-700 mb-3">Nueva regla de alerta</p>
              <input
                type="text"
                placeholder="Nombre de la regla"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] mb-2 outline-none focus:border-primary"
              />
              <div className="flex gap-2 mb-2">
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none"
                >
                  <option value="THRESHOLD">Umbral (rating)</option>
                  <option value="KEYWORD">Palabra clave</option>
                  <option value="REGEX">Regex</option>
                </select>
                {newRule.type === 'THRESHOLD' && (
                  <select
                    value={newRule.operator}
                    onChange={(e) => setNewRule({ ...newRule, operator: e.target.value })}
                    className="w-20 border border-gray-200 rounded-xl px-2 py-2.5 text-[14px] outline-none"
                  >
                    <option value="<=">≤</option>
                    <option value=">=">≥</option>
                    <option value="==">==</option>
                  </select>
                )}
              </div>
              <input
                type="text"
                placeholder={newRule.type === 'THRESHOLD' ? 'Valor (ej: 2)' : 'Palabra clave (ej: fraude)'}
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] mb-3 outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewRule(false)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-500 border border-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddRule}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-primary"
                >
                  Guardar regla
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-[15px]">Sin reglas configuradas</div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-2xl px-4 py-3 shadow-card flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] font-semibold text-gray-900">{rule.name}</span>
                      {!rule.active && (
                        <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Pausada
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 truncate">{ruleDescription(rule)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleRule(rule.id, rule.active)}
                      className="relative w-10 h-6 rounded-full transition-colors"
                      style={{ background: rule.active ? '#1C7C3C' : '#E5E7EB' }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm"
                        style={{ left: rule.active ? '22px' : '4px' }}
                      />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v4l3 2" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-semibold text-gray-400">Historial</span>
        </Link>
        <Link href="/alertas" className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1C7C3C" strokeWidth="1.5">
            <path d="M10 2a6 6 0 016 6v3l1.5 2.5H2.5L4 11V8a6 6 0 016-6z" />
            <path d="M8 16a2 2 0 004 0" />
          </svg>
          <span className="text-[10px] font-semibold text-primary">Alertas</span>
        </Link>
      </nav>
    </div>
  )
}
