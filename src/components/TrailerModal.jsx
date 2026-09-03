import { X } from 'lucide-react';

export default function TrailerModal({ videoKey, title, onClose }) {
  if (!videoKey) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-lg bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close trailer"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-ink hover:bg-crimson-600"
        >
          <X size={18} />
        </button>
        <div className="aspect-video w-full">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
            title={`${title} trailer`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
