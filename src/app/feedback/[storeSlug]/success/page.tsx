import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-white rounded-2xl p-8 shadow-card w-full max-w-sm">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#1C7C3C" opacity="0.15" />
            <path d="M10 20 L17 27 L30 13" stroke="#1C7C3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-gray-900 mb-2">¡Gracias por tu opinión!</h2>
        <p className="text-[15px] text-gray-500 leading-relaxed">
          Tu feedback nos ayuda a mejorar la experiencia en tienda.
        </p>
      </div>

      <p className="text-[12px] text-gray-400 mt-8">Carioca Te escucha</p>
    </div>
  )
}
