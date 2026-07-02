interface Props {
  onBack: () => void;
}

export default function OnlineServicePage({ onBack }: Props) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div
        className="relative flex items-center px-4 pt-10 pb-4 shrink-0"
        style={{ background: "linear-gradient(135deg, #0d1b3e 0%, #1a3a6e 100%)" }}
      >
        <button onClick={onBack} className="p-1 text-white/80 hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-base font-bold">
          Online Service
        </h1>
      </div>

      {/* Hero illustration */}
      <div
        className="flex flex-col items-center justify-center py-12 gap-3"
        style={{ background: "linear-gradient(160deg, #e8f4ff 0%, #f5f9ff 100%)" }}
      >
        {/* WhatsApp icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl"
          style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-14 h-14">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.529 5.845L.057 23.5l5.797-1.519A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.668-.522-5.174-1.427l-.37-.22-3.44.902.918-3.353-.24-.386A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mt-1">Customer Support</h2>
        <p className="text-sm text-gray-500">We're here to help you</p>
      </div>

      {/* Notice card */}
      <div className="mx-5 mt-6">
        <div
          className="rounded-2xl p-5 shadow-sm border border-blue-100"
          style={{ background: "#f0f7ff" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "#dbeafe" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} className="w-4 h-4">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              For a prompt response and efficient resolution of your queries, we kindly recommend
              reaching out to our support team directly via{" "}
              <span className="font-semibold text-green-600">WhatsApp</span>. Our agents are
              available to assist you and will address your concerns as quickly as possible.
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp button */}
      <div className="mx-5 mt-5">
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl shadow-md active:opacity-80 transition-opacity"
          style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.529 5.845L.057 23.5l5.797-1.519A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.668-.522-5.174-1.427l-.37-.22-3.44.902.918-3.353-.24-.386A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          <span className="text-white font-bold text-base">Contact Agent on WhatsApp</span>
        </a>
      </div>

      {/* Support hours */}
      <div className="mx-5 mt-4">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 flex items-center gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth={1.8} className="w-5 h-5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-gray-700">Support Hours</p>
            <p className="text-xs text-gray-500 mt-0.5">Available 24/7 — We're always here for you</p>
          </div>
        </div>
      </div>
    </div>
  );
}
