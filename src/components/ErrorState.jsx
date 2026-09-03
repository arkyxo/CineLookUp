import { AlertTriangle } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  subtitle = "We couldn't load this. Check your connection and try again.",
  onRetry,
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangle size={32} className="text-crimson-500/70" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-ink/50">{subtitle}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md bg-ink/10 px-5 py-2 text-sm font-semibold hover:bg-ink/20"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
