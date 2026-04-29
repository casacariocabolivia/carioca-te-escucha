'use client'

import Image from 'next/image'

const FEEDBACK_URL = 'https://carioca-te-escucha.netlify.app/feedback/centro'
const QR_API = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=16&data=${encodeURIComponent(FEEDBACK_URL)}`

export default function QRPage() {
  return (
    <div className="min-h-screen bg-bg-body flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl p-8 shadow-card w-full max-w-xs text-center">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-13 rounded-xl overflow-hidden shadow-sm">
            <Image
              src="/logo-carioca.jpg"
              alt="Carioca"
              width={80}
              height={52}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="text-[18px] font-bold text-gray-900 mb-1">Carioca Te Escucha</h1>
        <p className="text-[13px] text-gray-400 mb-6">Escanea para dejar tu opinión</p>

        {/* QR */}
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={QR_API}
            alt="Código QR feedback"
            width={220}
            height={220}
            className="rounded-xl"
          />
        </div>

        <p className="text-[11px] text-gray-400 break-all">{FEEDBACK_URL}</p>

        {/* Botón imprimir */}
        <button
          onClick={() => window.print()}
          className="mt-6 w-full py-3 rounded-xl bg-primary text-white font-semibold text-[14px] print:hidden"
        >
          Imprimir
        </button>
      </div>
    </div>
  )
}
