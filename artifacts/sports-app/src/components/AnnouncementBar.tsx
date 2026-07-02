export default function AnnouncementBar() {
  return (
    <div className="flex items-center bg-white px-3 py-1.5 gap-2 border-b border-gray-100">
      <button className="shrink-0 text-blue-500">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      </button>
      <div className="overflow-hidden flex-1">
        <span className="marquee-text text-xs text-gray-600">
          Welcome to XRT.LLC
        </span>
      </div>
    </div>
  );
}
